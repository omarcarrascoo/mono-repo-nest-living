"use client";

import { useCallback, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/Badge";
import { Order, OrderStatus } from "@/types/api";
import { deliveryService } from "@/services/delivery.service";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatMxn } from "@/lib/currency";
import { cn } from "@/lib/cn";

type Filter = "active" | "completed" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "active", label: "Activas" },
  { key: "completed", label: "Completadas" },
  { key: "all", label: "Todas" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  preparing: "Preparando",
  on_the_way: "En camino",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

const STATUS_TONE: Record<
  OrderStatus,
  "ok" | "warn" | "danger" | "neutral" | "teal"
> = {
  pending: "warn",
  confirmed: "teal",
  preparing: "teal",
  on_the_way: "teal",
  delivered: "ok",
  cancelled: "danger",
};

/** Próximo estado al que el staff puede mover la orden. */
const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "confirmed", label: "Confirmar" },
  confirmed: { status: "preparing", label: "Marcar en preparación" },
  preparing: { status: "on_the_way", label: "Marcar en camino" },
  on_the_way: { status: "delivered", label: "Marcar entregada" },
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

export function OrdersTab() {
  const [filter, setFilter] = useState<Filter>("active");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOrders = useCallback(
    () => deliveryService.listOrders({ filter }),
    [filter],
  );
  const { data, loading, error, reload } = useAsyncData<Order[]>(fetchOrders);
  const orders = data ?? [];

  async function advance(o: Order) {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    setBusyId(o.id);
    try {
      await deliveryService.updateOrderStatus(o.id, next.status);
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(o: Order) {
    setBusyId(o.id);
    try {
      await deliveryService.updateOrderStatus(o.id, "cancelled");
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
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

      {loading && orders.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Sin órdenes"
          description="Aquí aparecerán las órdenes de los residentes para este filtro."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const next = NEXT_STATUS[o.status];
            const busy = busyId === o.id;
            return (
              <Card key={o.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">#{o.orderNumber}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {fmtDateTime(o.createdAt)}
                      {o.payment.method === "cash"
                        ? ` · Efectivo${o.payment.cashDenomination ? ` $${o.payment.cashDenomination}` : ""}`
                        : " · Terminal"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS_TONE[o.status]}>
                      {STATUS_LABEL[o.status]}
                    </Badge>
                    <span className="text-xl font-extrabold text-ink">
                      {formatMxn(o.total)}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5 text-sm">
                  {o.items.map((it) => (
                    <li
                      key={it.lineId}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="text-ink">
                        <span className="font-semibold">{it.quantity}×</span>{" "}
                        {it.name}
                        {it.modifiers.length > 0 && (
                          <span className="text-ink-soft">
                            {" "}
                            (
                            {it.modifiers
                              .map((m) => m.optionName)
                              .join(", ")}
                            )
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums text-ink-soft">
                        {formatMxn(it.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                {o.notes && (
                  <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm italic text-ink-soft">
                    “{o.notes}”
                  </p>
                )}

                {o.status !== "delivered" && o.status !== "cancelled" && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    {next && (
                      <button
                        onClick={() => advance(o)}
                        disabled={busy}
                        className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-55"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          next.label
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => cancel(o)}
                      disabled={busy}
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-55"
                    >
                      Cancelar orden
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
