import { apiFetch } from "@/lib/api/client";
import { Amenity } from "@/types/api";
import { adaptAmenity } from "./adapters";

export const amenitiesService = {
  async list(opts: { q?: string; category?: string } = {}): Promise<Amenity[]> {
    const sp = new URLSearchParams();
    if (opts.q?.trim()) sp.set("q", opts.q.trim());
    if (opts.category) sp.set("category", opts.category);
    const qs = sp.toString();
    const raw = await apiFetch<unknown[]>(
      `/amenities${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
    return Array.isArray(raw)
      ? raw.map((r) => adaptAmenity(r as Record<string, unknown>))
      : [];
  },

  async create(payload: Partial<Amenity>): Promise<Amenity> {
    const raw = await apiFetch<Record<string, unknown>>("/amenities", {
      method: "POST",
      body: payload,
    });
    return adaptAmenity(raw);
  },

  async update(id: string, payload: Partial<Amenity>): Promise<Amenity> {
    const raw = await apiFetch<Record<string, unknown>>(`/amenities/${id}`, {
      method: "PUT",
      body: payload,
    });
    return adaptAmenity(raw);
  },

  async remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/amenities/${id}`, { method: "DELETE" });
  },
};
