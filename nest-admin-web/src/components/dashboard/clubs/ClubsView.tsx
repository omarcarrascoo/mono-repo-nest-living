"use client";

import { useCallback, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Globe,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClubFormModal } from "./ClubFormModal";
import { PromoteAdminModal } from "./PromoteAdminModal";
import { Club, CreateClubRequest } from "@/types/api";
import { clubsService } from "@/services/clubs.service";
import { useAsyncData } from "@/hooks/use-async-data";

export function ClubsView() {
  const fetchClubs = useCallback(() => clubsService.listAll(), []);
  const { data, loading, error, reload } = useAsyncData(fetchClubs);
  const clubs = data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [promoting, setPromoting] = useState<Club | null>(null);
  const [removing, setRemoving] = useState<Club | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = reload;

  async function copyCode(club: Club) {
    if (!club.joinCode) return;
    try {
      await navigator.clipboard.writeText(club.joinCode);
      setCopiedId(club.id);
      setTimeout(() => setCopiedId((c) => (c === club.id ? null : c)), 1600);
    } catch {
      /* clipboard bloqueado — ignoramos */
    }
  }

  async function handleSubmit(dto: CreateClubRequest & { joinCode?: string }) {
    if (editing) {
      await clubsService.update(editing.id, dto);
    } else {
      await clubsService.create(dto);
    }
    load();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Plataforma</p>
          <h2 className="font-display mt-3 text-3xl leading-tight text-editorial-ink md:text-[2.6rem]">
            Comunidades <em className="italic text-teal-dark">activas</em>
          </h2>
          <p className="mt-3 max-w-md text-sm text-editorial-soft">
            Crea y administra los clubs de la plataforma.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo club
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
          <button onClick={load} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aún no hay clubs"
          description="Crea el primer club para empezar a administrar una comunidad."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Crear club
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Card key={club.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/[0.10] text-lg font-bold text-teal-dark">
                  {club.name.charAt(0).toUpperCase()}
                </span>
                <Badge tone={club.privacy === "public" ? "ok" : "neutral"}>
                  {club.privacy === "public" ? (
                    <>
                      <Globe className="h-3 w-3" /> Pública
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" /> Privada
                    </>
                  )}
                </Badge>
              </div>

              <h3 className="mt-4 truncate text-lg font-bold text-ink">
                {club.name}
              </h3>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-ink-soft">
                {club.description || "Sin descripción."}
              </p>

              {/* Código de acceso */}
              <button
                onClick={() => copyCode(club)}
                className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-line bg-canvas px-3 py-2 text-left transition-colors hover:border-teal/40"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    Código de acceso
                  </span>
                  <span className="block truncate font-mono text-sm font-bold tracking-wider text-ink">
                    {club.joinCode ?? "—"}
                  </span>
                </span>
                {copiedId === club.id ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-ink-soft" />
                )}
              </button>

              {/* Acciones */}
              <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setPromoting(club)}
                  className="flex-1 px-2 py-2 text-xs"
                >
                  <UserPlus className="h-4 w-4" />
                  Admin
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(club);
                    setFormOpen(true);
                  }}
                  className="px-2.5 py-2"
                  aria-label="Editar club"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setRemoving(club)}
                  className="px-2.5 py-2 text-red-600 hover:bg-red-50"
                  aria-label="Eliminar club"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modales */}
      <ClubFormModal
        open={formOpen}
        club={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <PromoteAdminModal
        open={promoting !== null}
        club={promoting}
        onClose={() => setPromoting(null)}
        onSubmit={async (clubId, userId) => {
          await clubsService.promoteAdmin(clubId, { userId });
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            await clubsService.remove(removing.id);
            load();
          }
        }}
        title="Eliminar club"
        message={`Vas a eliminar "${removing?.name}" y todas sus membresías. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
