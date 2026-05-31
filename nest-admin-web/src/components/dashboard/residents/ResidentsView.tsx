"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EditResidentModal } from "./EditResidentModal";
import { RoleBadge, StatusBadge } from "./badges";
import { ClubMember, MembershipStatus, Role } from "@/types/api";
import { residentsService } from "@/services/residents.service";
import { useAuthStore } from "@/stores/auth-store";
import { useAsyncData } from "@/hooks/use-async-data";
import { cn } from "@/lib/cn";

type Filter = "all" | MembershipStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "active", label: "Activos" },
  { key: "rejected", label: "Rechazados" },
];

export function ResidentsView() {
  const activeClubId = useAuthStore((s) => s.activeClubId);
  const myUserId = useAuthStore((s) => s.user?.id);
  const searchParams = useSearchParams();

  const initialStatus = (searchParams.get("status") as Filter) || "all";

  const [filter, setFilter] = useState<Filter>(
    FILTERS.some((f) => f.key === initialStatus) ? initialStatus : "all",
  );
  const [query, setQuery] = useState("");

  // Acción en curso por membershipId (para spinners en botones por fila).
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClubMember | null>(null);
  const [removing, setRemoving] = useState<ClubMember | null>(null);
  const [rejecting, setRejecting] = useState<ClubMember | null>(null);

  const fetchMembers = useCallback(() => {
    if (!activeClubId) return Promise.resolve<ClubMember[]>([]);
    return residentsService.list(activeClubId, {
      status: filter === "all" ? undefined : filter,
    });
  }, [activeClubId, filter]);

  const {
    data,
    loading,
    error,
    reload: load,
    setError,
  } = useAsyncData(fetchMembers);
  const members = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.fullName, m.email, m.unitNumber]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q)),
    );
  }, [members, query]);

  const pendingCount = useMemo(
    () => members.filter((m) => m.status === "pending").length,
    [members],
  );

  async function withBusy(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    try {
      await fn();
      load();
    } catch (e) {
      setError((e as Error)?.message ?? "Algo salió mal.");
    } finally {
      setBusyId(null);
    }
  }

  const approve = (m: ClubMember) =>
    withBusy(m.membershipId, () => residentsService.approve(m.membershipId));

  const saveEdit = async (
    membershipId: string,
    dto: { role: Role; unitNumber: string | null },
  ) => {
    await residentsService.update(membershipId, dto);
    load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Encabezado + búsqueda */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow">Tu comunidad</p>
          <h2 className="font-display mt-3 text-3xl leading-tight text-editorial-ink md:text-[2.6rem]">
            Residentes <em className="italic text-teal-dark">activos</em>
          </h2>
          <p className="mt-3 max-w-md text-sm text-editorial-soft">
            Aprueba solicitudes y administra los miembros de tu club.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o unidad…"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none transition-colors focus:border-teal"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              filter === f.key
                ? "bg-teal-dark text-white"
                : "border border-line bg-surface text-ink-soft hover:bg-canvas",
            )}
          >
            {f.label}
            {f.key === "pending" && pendingCount > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  filter === "pending"
                    ? "bg-white/25 text-white"
                    : "bg-amber-100 text-amber-700",
                )}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
          <button onClick={load} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "Sin coincidencias" : "Aún no hay residentes"}
          description={
            query
              ? "Prueba con otro nombre, correo o unidad."
              : "Cuando alguien se una a tu club con el código, aparecerá aquí."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Cabecera de tabla (desktop) */}
          <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft md:grid">
            <span>Miembro</span>
            <span>Rol</span>
            <span>Unidad</span>
            <span className="text-right">Acciones</span>
          </div>

          <ul className="divide-y divide-line">
            {filtered.map((m) => {
              const isSelf = m.id === myUserId;
              const busy = busyId === m.membershipId;
              return (
                <li
                  key={m.membershipId}
                  className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1.6fr_1fr_0.8fr_auto] md:items-center md:gap-4"
                >
                  {/* Miembro */}
                  <div className="flex items-center gap-3">
                    <Avatar name={m.fullName} src={m.avatar} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {m.fullName}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-ink-soft">
                            (tú)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-ink-soft">
                        {m.email}
                      </p>
                    </div>
                  </div>

                  {/* Rol + estado */}
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleBadge role={m.role} />
                    {m.status !== "active" && <StatusBadge status={m.status} />}
                  </div>

                  {/* Unidad */}
                  <div className="text-sm text-ink-soft">
                    {m.unitNumber ? (
                      <span className="font-medium text-ink">
                        {m.unitNumber}
                      </span>
                    ) : (
                      "—"
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-start gap-2 md:justify-end">
                    {m.status === "pending" ? (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => approve(m)}
                          disabled={busy}
                          className="px-3 py-2"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Aprobar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setRejecting(m)}
                          disabled={busy}
                          className="px-3 py-2"
                        >
                          <X className="h-4 w-4" />
                          Rechazar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => setEditing(m)}
                          disabled={busy}
                          className="px-3 py-2"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            onClick={() => setRemoving(m)}
                            disabled={busy}
                            className="px-2.5 py-2 text-red-600 hover:bg-red-50"
                            aria-label="Quitar del club"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Modales */}
      <EditResidentModal
        member={editing}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
      />

      <ConfirmDialog
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        onConfirm={async () => {
          if (rejecting) {
            await residentsService.reject(rejecting.membershipId);
            load();
          }
        }}
        title="Rechazar solicitud"
        message={`¿Seguro que quieres rechazar la solicitud de ${rejecting?.fullName}? Podrá volver a solicitar acceso más tarde.`}
        confirmLabel="Rechazar"
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            await residentsService.remove(removing.membershipId);
            load();
          }
        }}
        title="Quitar del club"
        message={`${removing?.fullName} dejará de ser miembro de este club y perderá el acceso. Esta acción no se puede deshacer.`}
        confirmLabel="Quitar"
      />
    </div>
  );
}
