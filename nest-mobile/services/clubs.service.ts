import { apiFetch } from '@/lib/api/client';
import {
  Club,
  ClubMember,
  CreateClubRequest,
  JoinClubRequest,
  JoinClubResponse,
  Membership,
  MembershipStatus,
  PromoteAdminRequest,
  UpdateClubRequest,
  UpdateMembershipRequest,
} from '@/types/api';
import {
  adaptClub,
  adaptClubMember,
  adaptMembership,
} from './adapters';

export const clubsService = {
  // -------- Cualquier user --------
  async listMyMemberships(): Promise<Membership[]> {
    const raw = await apiFetch<any[]>('/clubs/me/memberships', { method: 'GET' });
    return Array.isArray(raw) ? raw.map(adaptMembership) : [];
  },

  async join(payload: JoinClubRequest): Promise<JoinClubResponse> {
    return apiFetch<JoinClubResponse>('/clubs/join', {
      method: 'POST',
      body: payload,
    });
  },

  async leave(clubId: string): Promise<{ ok: true }> {
    return apiFetch(`/clubs/me/memberships/${clubId}`, { method: 'DELETE' });
  },

  // -------- Admin del club --------
  async listMembershipsAdmin(
    clubId: string,
    opts: { status?: MembershipStatus; q?: string } = {},
  ): Promise<ClubMember[]> {
    const params = new URLSearchParams();
    if (opts.status) params.set('status', opts.status);
    if (opts.q) params.set('q', opts.q);
    const qs = params.toString();
    const raw = await apiFetch<any[]>(
      `/clubs/${clubId}/memberships${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
    return Array.isArray(raw) ? raw.map(adaptClubMember) : [];
  },

  async approveMembership(membershipId: string) {
    return apiFetch(`/clubs/memberships/${membershipId}/approve`, {
      method: 'POST',
    });
  },

  async rejectMembership(membershipId: string) {
    return apiFetch(`/clubs/memberships/${membershipId}/reject`, {
      method: 'POST',
    });
  },

  async updateMembership(membershipId: string, dto: UpdateMembershipRequest) {
    return apiFetch(`/clubs/memberships/${membershipId}`, {
      method: 'PATCH',
      body: dto,
    });
  },

  async removeMembership(membershipId: string) {
    return apiFetch(`/clubs/memberships/${membershipId}`, { method: 'DELETE' });
  },

  // -------- Super admin --------
  async listAll(): Promise<Club[]> {
    const raw = await apiFetch<any[]>('/clubs', { method: 'GET' });
    return Array.isArray(raw) ? raw.map(adaptClub) : [];
  },

  async create(dto: CreateClubRequest): Promise<Club> {
    const raw = await apiFetch<any>('/clubs', { method: 'POST', body: dto });
    return adaptClub(raw);
  },

  async update(clubId: string, dto: UpdateClubRequest): Promise<Club> {
    const raw = await apiFetch<any>(`/clubs/${clubId}`, {
      method: 'PATCH',
      body: dto,
    });
    return adaptClub(raw);
  },

  async remove(clubId: string) {
    return apiFetch(`/clubs/${clubId}`, { method: 'DELETE' });
  },

  async promoteAdmin(clubId: string, dto: PromoteAdminRequest) {
    return apiFetch(`/clubs/${clubId}/admins`, { method: 'POST', body: dto });
  },
};
