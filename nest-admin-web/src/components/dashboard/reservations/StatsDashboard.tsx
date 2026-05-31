"use client";

import { useMemo } from "react";
import { CalendarCheck, Loader2, TrendingUp, XOctagon } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { AdminReservationStats } from "@/types/api";

const fmtPercent = (rate: number) =>
  Number.isFinite(rate) ? `${Math.round(rate * 100)}%` : "0%";

export function StatsDashboard({
  stats,
  loading,
}: {
  stats: AdminReservationStats | null;
  loading: boolean;
}) {
  const totals = stats?.totals ?? { today: 0, week: 0, month: 0 };
  const top = stats?.topAmenities ?? [];
  const hours = stats?.hourOccupancy ?? Array.from({ length: 24 }, () => 0);
  const cancelRate = stats?.cancellationRate ?? 0;
  const peak = useMemo(() => Math.max(1, ...hours), [hours]);

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-teal-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          icon={CalendarCheck}
          tint="#0f766e"
          bg="#ccfbf1"
          label="Hoy"
          value={totals.today}
        />
        <Kpi
          icon={TrendingUp}
          tint="#1d4ed8"
          bg="#dbeafe"
          label="Esta semana"
          value={totals.week}
        />
        <Kpi
          icon={CalendarCheck}
          tint="#9333ea"
          bg="#f3e8ff"
          label="Este mes"
          value={totals.month}
        />
      </div>

      <Card className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <XOctagon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              Tasa de cancelación
            </p>
            <p className="text-xs text-ink-soft">
              Histórico de la residencia
            </p>
          </div>
        </div>
        <p className="text-2xl font-extrabold text-red-600">
          {fmtPercent(cancelRate)}
        </p>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Top amenidades · 30 días
        </p>
        {top.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Aún no hay reservas en los últimos 30 días.
          </p>
        ) : (
          <div className="space-y-3">
            {top.map((t, idx) => {
              const pct = top[0]?.count ? t.count / top[0].count : 0;
              return (
                <div key={t.amenityId} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-bold text-ink">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {t.title ?? "Amenidad sin nombre"}
                    </p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                      <div
                        className="h-full rounded-full bg-teal-dark"
                        style={{ width: `${Math.max(8, pct * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-bold tabular-nums text-ink">
                    {t.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Ocupación por hora · 30 días
        </p>
        <div className="flex h-16 items-end gap-0.5">
          {hours.map((count, h) => {
            const intensity = count / peak;
            const opacity = count === 0 ? 0.06 : 0.2 + intensity * 0.8;
            return (
              <div
                key={h}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${8 + intensity * 56}px`,
                  backgroundColor: `rgba(15, 118, 110, ${opacity.toFixed(2)})`,
                }}
                title={`${String(h).padStart(2, "0")}:00 — ${count} reserva${count === 1 ? "" : "s"}`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink-soft">
          <span>00h</span>
          <span>06h</span>
          <span>12h</span>
          <span>18h</span>
          <span>23h</span>
        </div>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon,
  tint,
  bg,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  bg: string;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: bg, color: tint }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </Card>
  );
}
