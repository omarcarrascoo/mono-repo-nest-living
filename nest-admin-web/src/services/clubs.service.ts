import { apiFetch } from "@/lib/api/client";
import {
  Club,
  CreateClubRequest,
  Membership,
  PromoteAdminRequest,
  UpdateClubRequest,
} from "@/types/api";
import { adaptClub, adaptMembership } from "./adapters";

export const clubsService = {
  // -------- Cualquier user autenticado --------
  async listMyMemberships(): Promise<Membership[]> {
    const raw = await apiFetch<unknown[]>("/clubs/me/memberships", {
      method: "GET",
    });
    return Array.isArray(raw) ? raw.map((m) => adaptMembership(m as Record<string, unknown>)) : [];
  },

  // -------- Super admin --------
  async listAll(): Promise<Club[]> {
    const raw = await apiFetch<unknown[]>("/clubs", { method: "GET" });
    return Array.isArray(raw) ? raw.map((c) => adaptClub(c as Record<string, unknown>)) : [];
  },

  async create(dto: CreateClubRequest): Promise<Club> {
    const raw = await apiFetch<Record<string, unknown>>("/clubs", {
      method: "POST",
      body: dto,
    });
    return adaptClub(raw);
  },

  async update(clubId: string, dto: UpdateClubRequest): Promise<Club> {
    const raw = await apiFetch<Record<string, unknown>>(`/clubs/${clubId}`, {
      method: "PATCH",
      body: dto,
    });
    return adaptClub(raw);
  },

  async remove(clubId: string): Promise<{ ok: true }> {
    return apiFetch<{ ok: true }>(`/clubs/${clubId}`, { method: "DELETE" });
  },

  async promoteAdmin(clubId: string, dto: PromoteAdminRequest): Promise<Membership> {
    const raw = await apiFetch<Record<string, unknown>>(`/clubs/${clubId}/admins`, {
      method: "POST",
      body: dto,
    });
    return adaptMembership(raw);
  },
};
