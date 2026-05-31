import { apiFetch } from "@/lib/api/client";
import { ClubMember, MembershipStatus, UpdateMembershipRequest } from "@/types/api";
import { adaptClubMember } from "./adapters";

/**
 * Gestión de residentes (memberships) del club activo. El backend resuelve el
 * club desde el JWT (`activeClubId`), así que el clubId del path debe coincidir
 * con el club activo de la sesión — lo provee el auth-store.
 */
export const residentsService = {
  async list(
    clubId: string,
    opts: { status?: MembershipStatus; q?: string } = {},
  ): Promise<ClubMember[]> {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.q) params.set("q", opts.q);
    const qs = params.toString();
    const raw = await apiFetch<unknown[]>(
      `/clubs/${clubId}/memberships${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
    return Array.isArray(raw)
      ? raw.map((m) => adaptClubMember(m as Record<string, unknown>))
      : [];
  },

  async approve(membershipId: string): Promise<void> {
    await apiFetch(`/clubs/memberships/${membershipId}/approve`, {
      method: "POST",
    });
  },

  async reject(membershipId: string): Promise<void> {
    await apiFetch(`/clubs/memberships/${membershipId}/reject`, {
      method: "POST",
    });
  },

  async update(
    membershipId: string,
    dto: UpdateMembershipRequest,
  ): Promise<void> {
    await apiFetch(`/clubs/memberships/${membershipId}`, {
      method: "PATCH",
      body: dto,
    });
  },

  async remove(membershipId: string): Promise<void> {
    await apiFetch(`/clubs/memberships/${membershipId}`, { method: "DELETE" });
  },
};
