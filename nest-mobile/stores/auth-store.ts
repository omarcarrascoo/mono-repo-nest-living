import { create } from 'zustand';
import { secureStorage } from '@/lib/storage/secure-storage';
import { configureApi } from '@/lib/api/client';
import { authService } from '@/services/auth.service';
import { clubsService } from '@/services/clubs.service';
import {
  AuthUser,
  LoginRequest,
  Membership,
  RegisterRequest,
  Role,
} from '@/types/api';
import { useAmenitiesStore } from './amenities-store';
import { useReservationsStore } from './reservations-store';
import { useFavoritesStore } from './favorites-store';
import { useCategoriesStore } from './categories-store';
import { useNotificationsStore } from './notifications-store';
import { useCommunityStore } from './community-store';
import { usePostThreadStore } from './post-thread-store';
import { useAdminStore } from './admin-store';
import { useClubsStore } from './clubs-store';

const TOKEN_KEY = 'nest.auth.token';
const ACTIVE_CLUB_KEY = 'nest.auth.activeClubId';
const ACTIVE_ROLE_KEY = 'nest.auth.activeRole';

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: Status;
  hydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  /** ID del club activo en el JWT actual (null si el user no se ha unido a ningún club). */
  activeClubId: string | null;
  /** Rol del user en `activeClubId`. null si activeClubId === null. */
  activeMembershipRole: Role | null;
  /** Memberships pobladas del user. Refrescadas tras login y switch-club. */
  memberships: Membership[];
  membershipsLoading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  switchClub: (clubId: string) => Promise<void>;
  /** Llamar después de unirse a un club público para activarlo. */
  setActiveClub: (clubId: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function resetClubScopedStores() {
  useAmenitiesStore.getState().reset();
  useReservationsStore.getState().reset();
  useFavoritesStore.getState().reset();
  useCategoriesStore.getState().reset();
  useNotificationsStore.getState().reset();
  useCommunityStore.getState().reset();
  usePostThreadStore.getState().reset();
  useAdminStore.getState().reset();
  useClubsStore.getState().reset();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  hydrated: false,
  token: null,
  user: null,
  activeClubId: null,
  activeMembershipRole: null,
  memberships: [],
  membershipsLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const [token, activeClubId, activeRole] = await Promise.all([
        secureStorage.getItem(TOKEN_KEY),
        secureStorage.getItem(ACTIVE_CLUB_KEY),
        secureStorage.getItem(ACTIVE_ROLE_KEY),
      ]);
      if (!token) {
        set({ hydrated: true, status: 'unauthenticated' });
        return;
      }
      set({
        token,
        activeClubId: activeClubId ?? null,
        activeMembershipRole: (activeRole as Role | null) ?? null,
        status: 'loading',
      });
      try {
        const user = await authService.me();
        set({ user, status: 'authenticated', hydrated: true });
        void get().refreshMemberships();
      } catch {
        await Promise.all([
          secureStorage.removeItem(TOKEN_KEY),
          secureStorage.removeItem(ACTIVE_CLUB_KEY),
          secureStorage.removeItem(ACTIVE_ROLE_KEY),
        ]);
        set({
          token: null,
          user: null,
          activeClubId: null,
          activeMembershipRole: null,
          memberships: [],
          status: 'unauthenticated',
          hydrated: true,
        });
      }
    } catch {
      set({ hydrated: true, status: 'unauthenticated' });
    }
  },

  login: async (payload) => {
    set({ status: 'loading', error: null });
    try {
      const res = await authService.login(payload);
      await Promise.all([
        secureStorage.setItem(TOKEN_KEY, res.access_token),
        res.activeClubId
          ? secureStorage.setItem(ACTIVE_CLUB_KEY, res.activeClubId)
          : secureStorage.removeItem(ACTIVE_CLUB_KEY),
        res.activeMembershipRole
          ? secureStorage.setItem(ACTIVE_ROLE_KEY, res.activeMembershipRole)
          : secureStorage.removeItem(ACTIVE_ROLE_KEY),
      ]);
      set({
        token: res.access_token,
        activeClubId: res.activeClubId,
        activeMembershipRole: res.activeMembershipRole,
      });
      const user = await authService.me();
      set({ user, status: 'authenticated' });
      void get().refreshMemberships();
    } catch (e: any) {
      set({
        status: 'unauthenticated',
        token: null,
        user: null,
        activeClubId: null,
        activeMembershipRole: null,
        error: e?.message ?? 'No pudimos iniciar sesión',
      });
      throw e;
    }
  },

  register: async (payload) => {
    set({ status: 'loading', error: null });
    try {
      await authService.register(payload);
      await get().login({ email: payload.email, password: payload.password });
    } catch (e: any) {
      set({
        status: 'unauthenticated',
        error: e?.message ?? 'No pudimos crear la cuenta',
      });
      throw e;
    }
  },

  refreshUser: async () => {
    if (!get().token) return;
    const user = await authService.me();
    set({ user });
  },

  refreshMemberships: async () => {
    if (!get().token) return;
    set({ membershipsLoading: true });
    try {
      const memberships = await clubsService.listMyMemberships();
      set({ memberships, membershipsLoading: false });
    } catch {
      set({ membershipsLoading: false });
    }
  },

  switchClub: async (clubId) => {
    const res = await authService.switchClub({ clubId });
    await Promise.all([
      secureStorage.setItem(TOKEN_KEY, res.access_token),
      res.activeClubId
        ? secureStorage.setItem(ACTIVE_CLUB_KEY, res.activeClubId)
        : secureStorage.removeItem(ACTIVE_CLUB_KEY),
      res.activeMembershipRole
        ? secureStorage.setItem(ACTIVE_ROLE_KEY, res.activeMembershipRole)
        : secureStorage.removeItem(ACTIVE_ROLE_KEY),
    ]);
    // Reset todo el estado scope-ado al club anterior antes de cambiar.
    resetClubScopedStores();
    set({
      token: res.access_token,
      activeClubId: res.activeClubId,
      activeMembershipRole: res.activeMembershipRole,
    });
  },

  setActiveClub: async (clubId) => {
    await get().switchClub(clubId);
  },

  logout: async () => {
    await Promise.all([
      secureStorage.removeItem(TOKEN_KEY),
      secureStorage.removeItem(ACTIVE_CLUB_KEY),
      secureStorage.removeItem(ACTIVE_ROLE_KEY),
    ]);
    set({
      token: null,
      user: null,
      activeClubId: null,
      activeMembershipRole: null,
      memberships: [],
      status: 'unauthenticated',
      error: null,
    });
    resetClubScopedStores();
  },

  clearError: () => set({ error: null }),
}));

configureApi({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    void useAuthStore.getState().logout();
  },
});
