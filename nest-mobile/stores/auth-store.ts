import { create } from 'zustand';
import { secureStorage } from '@/lib/storage/secure-storage';
import { configureApi } from '@/lib/api/client';
import { authService } from '@/services/auth.service';
import { AuthUser, LoginRequest, RegisterRequest } from '@/types/api';
import { useAmenitiesStore } from './amenities-store';
import { useReservationsStore } from './reservations-store';
import { useFavoritesStore } from './favorites-store';
import { useCategoriesStore } from './categories-store';
import { useNotificationsStore } from './notifications-store';
import { useCommunityStore } from './community-store';
import { usePostThreadStore } from './post-thread-store';
import { useAdminStore } from './admin-store';

const TOKEN_KEY = 'nest.auth.token';

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: Status;
  hydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  hydrated: false,
  token: null,
  user: null,
  error: null,

  hydrate: async () => {
    try {
      const token = await secureStorage.getItem(TOKEN_KEY);
      if (!token) {
        set({ hydrated: true, status: 'unauthenticated' });
        return;
      }
      set({ token, status: 'loading' });
      try {
        const user = await authService.me();
        set({ user, status: 'authenticated', hydrated: true });
      } catch {
        await secureStorage.removeItem(TOKEN_KEY);
        set({
          token: null,
          user: null,
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
      const { access_token } = await authService.login(payload);
      await secureStorage.setItem(TOKEN_KEY, access_token);
      set({ token: access_token });
      const user = await authService.me();
      set({ user, status: 'authenticated' });
    } catch (e: any) {
      set({
        status: 'unauthenticated',
        token: null,
        user: null,
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

  logout: async () => {
    await secureStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, status: 'unauthenticated', error: null });
    useAmenitiesStore.getState().reset();
    useReservationsStore.getState().reset();
    useFavoritesStore.getState().reset();
    useCategoriesStore.getState().reset();
    useNotificationsStore.getState().reset();
    useCommunityStore.getState().reset();
    usePostThreadStore.getState().reset();
    useAdminStore.getState().reset();
  },

  clearError: () => set({ error: null }),
}));

configureApi({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    void useAuthStore.getState().logout();
  },
});
