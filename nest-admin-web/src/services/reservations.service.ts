import { apiFetch } from "@/lib/api/client";
import {
  AdminListReservationsParams,
  AdminListReservationsResponse,
  AdminReservation,
  AdminReservationStats,
} from "@/types/api";
import { adaptAdminReservation } from "./adapters";

function buildQuery(p: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const reservationsService = {
  /** Lista de reservas del club activo (vista admin). */
  async listAll(
    params: AdminListReservationsParams = {},
  ): Promise<AdminListReservationsResponse> {
    const qs = buildQuery({
      filter: params.filter,
      userId: params.userId,
      amenityId: params.amenityId,
      cursor: params.cursor,
      limit: params.limit ? String(params.limit) : undefined,
    });
    const raw = await apiFetch<{
      items?: unknown[];
      nextCursor?: string | null;
    }>(`/reservations/admin/all${qs}`);
    return {
      items: Array.isArray(raw?.items)
        ? raw.items.map((r) => adaptAdminReservation(r as Record<string, unknown>))
        : [],
      nextCursor: raw?.nextCursor ?? null,
    };
  },

  async stats(): Promise<AdminReservationStats> {
    const raw = await apiFetch<Record<string, unknown>>(
      "/reservations/admin/stats",
    );
    const totals = (raw.totals ?? {}) as Record<string, unknown>;
    const top = Array.isArray(raw.topAmenities) ? raw.topAmenities : [];
    const occRaw = Array.isArray(raw.hourOccupancy) ? raw.hourOccupancy : [];
    const hourOccupancy = Array.from({ length: 24 }, (_, i) =>
      typeof occRaw[i] === "number" ? (occRaw[i] as number) : 0,
    );
    return {
      totals: {
        today: Number(totals.today ?? 0),
        week: Number(totals.week ?? 0),
        month: Number(totals.month ?? 0),
      },
      topAmenities: top.map((t) => {
        const o = (t ?? {}) as Record<string, unknown>;
        return {
          amenityId: String(o.amenityId ?? o._id ?? ""),
          count: Number(o.count ?? 0),
          title: (o.title as string | null | undefined) ?? null,
        };
      }),
      cancellationRate: Number(raw.cancellationRate ?? 0),
      hourOccupancy,
    };
  },

  /** Cancela cualquier reserva del club. El backend valida que el caller sea admin. */
  async cancel(id: string): Promise<AdminReservation> {
    const raw = await apiFetch<Record<string, unknown>>(`/reservations/${id}`, {
      method: "DELETE",
    });
    return adaptAdminReservation(raw);
  },
};
