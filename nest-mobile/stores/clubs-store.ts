import { create } from 'zustand';
import { clubsService } from '@/services/clubs.service';
import {
  Club,
  ClubMember,
  CreateClubRequest,
  MembershipStatus,
  PromoteAdminRequest,
  UpdateClubRequest,
  UpdateMembershipRequest,
} from '@/types/api';

/**
 * Store para operaciones admin/super_admin de clubs. Vive aparte del
 * `auth-store` (que solo expone "mis memberships" / activeClubId) para no
 * mezclar responsabilidades — la mayoría de los users no necesitarán este
 * store cargado.
 *
 * Patrón:
 * - `allClubs` lo llena el super_admin via `fetchAll()`.
 * - `members[clubId]` lo llena el admin del club via `fetchMembers(clubId)`.
 */
interface ClubsState {
  // Super admin
  allClubs: Club[];
  allClubsLoading: boolean;
  allClubsError: string | null;

  // Admin del club (memberships del club que estás administrando)
  members: Record<string, ClubMember[]>;
  membersLoading: Record<string, boolean>;
  membersError: Record<string, string | null>;
  membersStatusFilter: MembershipStatus | 'all';
  membersQuery: string;

  fetchAll: () => Promise<void>;
  createClub: (dto: CreateClubRequest) => Promise<Club>;
  updateClub: (clubId: string, dto: UpdateClubRequest) => Promise<Club>;
  removeClub: (clubId: string) => Promise<void>;
  promoteAdmin: (clubId: string, dto: PromoteAdminRequest) => Promise<void>;

  fetchMembers: (clubId: string, opts?: { force?: boolean }) => Promise<void>;
  setMembersStatusFilter: (s: MembershipStatus | 'all') => void;
  setMembersQuery: (q: string) => void;
  approveMember: (clubId: string, membershipId: string) => Promise<void>;
  rejectMember: (clubId: string, membershipId: string) => Promise<void>;
  updateMember: (
    clubId: string,
    membershipId: string,
    dto: UpdateMembershipRequest,
  ) => Promise<void>;
  removeMember: (clubId: string, membershipId: string) => Promise<void>;

  reset: () => void;
}

export const useClubsStore = create<ClubsState>((set, get) => ({
  allClubs: [],
  allClubsLoading: false,
  allClubsError: null,

  members: {},
  membersLoading: {},
  membersError: {},
  membersStatusFilter: 'all',
  membersQuery: '',

  fetchAll: async () => {
    if (get().allClubsLoading) return;
    set({ allClubsLoading: true, allClubsError: null });
    try {
      const clubs = await clubsService.listAll();
      set({ allClubs: clubs, allClubsLoading: false });
    } catch (e: any) {
      set({
        allClubsLoading: false,
        allClubsError: e?.message ?? 'Error cargando clubs',
      });
    }
  },

  createClub: async (dto) => {
    const club = await clubsService.create(dto);
    set((s) => ({ allClubs: [club, ...s.allClubs] }));
    return club;
  },

  updateClub: async (clubId, dto) => {
    const updated = await clubsService.update(clubId, dto);
    set((s) => ({
      allClubs: s.allClubs.map((c) => (c.id === clubId ? updated : c)),
    }));
    return updated;
  },

  removeClub: async (clubId) => {
    await clubsService.remove(clubId);
    set((s) => ({
      allClubs: s.allClubs.filter((c) => c.id !== clubId),
    }));
  },

  promoteAdmin: async (clubId, dto) => {
    await clubsService.promoteAdmin(clubId, dto);
    // Refrescar miembros si los teníamos cargados
    if (get().members[clubId]) await get().fetchMembers(clubId, { force: true });
  },

  fetchMembers: async (clubId, { force = false } = {}) => {
    if (get().membersLoading[clubId] && !force) return;
    set((s) => ({
      membersLoading: { ...s.membersLoading, [clubId]: true },
      membersError: { ...s.membersError, [clubId]: null },
    }));
    try {
      const filter = get().membersStatusFilter;
      const q = get().membersQuery.trim();
      const items = await clubsService.listMembershipsAdmin(clubId, {
        status: filter === 'all' ? undefined : filter,
        q: q || undefined,
      });
      set((s) => ({
        members: { ...s.members, [clubId]: items },
        membersLoading: { ...s.membersLoading, [clubId]: false },
      }));
    } catch (e: any) {
      set((s) => ({
        membersLoading: { ...s.membersLoading, [clubId]: false },
        membersError: {
          ...s.membersError,
          [clubId]: e?.message ?? 'Error cargando miembros',
        },
      }));
    }
  },

  setMembersStatusFilter: (s) => set({ membersStatusFilter: s }),
  setMembersQuery: (q) => set({ membersQuery: q }),

  approveMember: async (clubId, membershipId) => {
    await clubsService.approveMembership(membershipId);
    await get().fetchMembers(clubId, { force: true });
  },

  rejectMember: async (clubId, membershipId) => {
    await clubsService.rejectMembership(membershipId);
    await get().fetchMembers(clubId, { force: true });
  },

  updateMember: async (clubId, membershipId, dto) => {
    await clubsService.updateMembership(membershipId, dto);
    await get().fetchMembers(clubId, { force: true });
  },

  removeMember: async (clubId, membershipId) => {
    await clubsService.removeMembership(membershipId);
    set((s) => ({
      members: {
        ...s.members,
        [clubId]: (s.members[clubId] ?? []).filter(
          (m) => m.membershipId !== membershipId,
        ),
      },
    }));
  },

  reset: () =>
    set({
      allClubs: [],
      allClubsLoading: false,
      allClubsError: null,
      members: {},
      membersLoading: {},
      membersError: {},
      membersStatusFilter: 'all',
      membersQuery: '',
    }),
}));
