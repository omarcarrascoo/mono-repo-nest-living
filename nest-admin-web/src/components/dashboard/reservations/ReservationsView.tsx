"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CalendarCheck,
  Loader2,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatsDashboard } from "./StatsDashboard";
import {
  AdminReservation,
  AdminReservationStats,
  ReservationStatus,
} from "@/types/api";
import { reservationsService } from "@/services/reservations.service";
import { useAsyncData } from "@/hooks/use-async-data";
import { cn } from "@/lib/cn";

type Filter = "upcoming" | "past" | "cancelled" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Próximas" },
  { key: "past", label: "Pasadas" },
  { key: "cancelled", label: "Canceladas" },
  { key: "all", label: "Todas" },
];

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistió",
};

const STATUS_TONE: Record<
  ReservationStatus,
  "ok" | "warn" | "danger" | "neutral" | "teal"
> = {
  confirmed: "teal",
  completed: "ok",
  cancelled: "danger",
  no_show: "warn",
};

function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReservationsView() {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [cancelling, setCancelling] = useState<AdminReservation | null>(null);

  const fetchStats = useCallback(() => reservationsService.stats(), []);
  const { data: stats, loading: statsLoading } =
    useAsyncData<AdminReservationStats>(fetchStats);

  const fetchList = useCallback(
    () => reservationsService.listAll({ filter, limit: 50 }),
    [filter],
  );
  const {
    data: listData,
    loading,
    error,
    reload,
  } = useAsyncData(fetchList);
  const items = useMemo(() => listData?.items ?? [], [listData]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow">Operación</p>
        <h2 className="font-display mt-3 text-3xl leading-tight text-editorial-ink md:text-[2.6rem]">
          Reservas <em className="italic text-teal-dark">en vivo</em>
        </h2>
        <p className="mt-3 max-w-md text-sm text-editorial-soft">
          Ocupación, ranking y conflictos resueltos sin pelear con un Excel.
        </p>
      </div>

      <StatsDashboard stats={stats} loading={statsLoading} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 pt-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              filter === f.key
                ? "bg-teal-dark text-white"
                : "border border-line bg-surface text-ink-soft hover:bg-canvas",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
          <button onClick={reload} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Sin reservas"
          description="No hay reservas para este filtro en tu club."
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {items.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={r.user?.fullName ?? "?"}
                    src={r.user?.avatar}
                    size={36}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {r.user?.fullName ?? "Residente"}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {r.user?.unitNumber
                        ? `Unidad ${r.user.unitNumber} · `
                        : ""}
                      {r.user?.email}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {r.amenityTitle ?? "Amenidad"}
                  </p>
                  {r.amenityLocation && (
                    <p className="truncate text-xs text-ink-soft">
                      {r.amenityLocation}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink">
                    {fmtDateTime(r.startTime)}
                  </span>
                  <Badge tone={STATUS_TONE[r.status]}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </div>
                <div className="flex justify-start md:justify-end">
                  {r.status === "confirmed" && (
                    <Button
                      variant="ghost"
                      onClick={() => setCancelling(r)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          if (cancelling) {
            await reservationsService.cancel(cancelling.id);
            reload();
          }
        }}
        title="Cancelar reserva"
        message={`Vas a cancelar la reserva de ${cancelling?.user?.fullName ?? "este residente"} en ${cancelling?.amenityTitle ?? "esta amenidad"}. El residente recibirá una notificación.`}
        confirmLabel="Cancelar reserva"
      />
    </div>
  );
}
