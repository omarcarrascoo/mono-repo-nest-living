import { create } from "zustand";
import { storage } from "@/lib/storage";
import { configureApi } from "@/lib/api/client";
import { authService } from "@/services/auth.service";
import { clubsService } from "@/services/clubs.service";
import { AuthUser, LoginRequest, Membership, Role } from "@/types/api";

/**
 * Auth store — espejo de `nest-mobile/stores/auth-store.ts`, adaptado a web:
 *   - Token en localStorage (no expo-secure-store).
 *   - Mismo flujo: login → guarda token + activeClub/rol → /users/me → memberships.
 *   - El JWT trae un solo `activeClubId`; para cambiarlo se llama switch-club.
 *
 * Nota de seguridad de roles: este sitio es para **admins**. El gating de UI se
 * basa en `activeMembershipRole === 'admin'` o `user.globalRole === 'super_admin'`.
 * El backend es la fuente de verdad real (cada endpoint admin valida el rol del
 * JWT), así que el gating de cliente es solo para UX, no para seguridad.
 */

const TOKEN_KEY = "nest.admin.token";
const ACTIVE_CLUB_KEY = "nest.admin.activeClubId";
const ACTIVE_ROLE_KEY = "nest.admin.activeRole";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  hydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  activeClubId: string | null;
  activeMembershipRole: Role | null;
  memberships: Membership[];
  membershipsLoading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  switchClub: (clubId: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  hydrated: false,
  token: null,
  user: null,
  activeClubId: null,
  activeMembershipRole: null,
  memberships: [],
  membershipsLoading: false,
  error: null,

  hydrate: async () => {
    const token = storage.getItem(TOKEN_KEY);
    const activeClubId = storage.getItem(ACTIVE_CLUB_KEY);
    const activeRole = storage.getItem(ACTIVE_ROLE_KEY);

    if (!token) {
      set({ hydrated: true, status: "unauthenticated" });
      return;
    }

    set({
      token,
      activeClubId: activeClubId ?? null,
      activeMembershipRole: (activeRole as Role | null) ?? null,
      status: "loading",
    });

    try {
      const user = await authService.me();
      set({ user, status: "authenticated", hydrated: true });
      void get().refreshMemberships();
    } catch {
      // Token inválido/expirado → limpiar.
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(ACTIVE_CLUB_KEY);
      storage.removeItem(ACTIVE_ROLE_KEY);
      set({
        token: null,
        user: null,
        activeClubId: null,
        activeMembershipRole: null,
        memberships: [],
        status: "unauthenticated",
        hydrated: true,
      });
    }
  },

  login: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const res = await authService.login(payload);
      storage.setItem(TOKEN_KEY, res.access_token);
      if (res.activeClubId) storage.setItem(ACTIVE_CLUB_KEY, res.activeClubId);
      else storage.removeItem(ACTIVE_CLUB_KEY);
      if (res.activeMembershipRole)
        storage.setItem(ACTIVE_ROLE_KEY, res.activeMembershipRole);
      else storage.removeItem(ACTIVE_ROLE_KEY);

      set({
        token: res.access_token,
        activeClubId: res.activeClubId,
        activeMembershipRole: res.activeMembershipRole,
      });

      const user = await authService.me();
      set({ user, status: "authenticated" });
      void get().refreshMemberships();
    } catch (e) {
      set({
        status: "unauthenticated",
        token: null,
        user: null,
        activeClubId: null,
        activeMembershipRole: null,
        error: (e as Error)?.message ?? "No pudimos iniciar sesión",
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
    storage.setItem(TOKEN_KEY, res.access_token);
    if (res.activeClubId) storage.setItem(ACTIVE_CLUB_KEY, res.activeClubId);
    else storage.removeItem(ACTIVE_CLUB_KEY);
    if (res.activeMembershipRole)
      storage.setItem(ACTIVE_ROLE_KEY, res.activeMembershipRole);
    else storage.removeItem(ACTIVE_ROLE_KEY);

    set({
      token: res.access_token,
      activeClubId: res.activeClubId,
      activeMembershipRole: res.activeMembershipRole,
    });
  },

  logout: () => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(ACTIVE_CLUB_KEY);
    storage.removeItem(ACTIVE_ROLE_KEY);
    set({
      token: null,
      user: null,
      activeClubId: null,
      activeMembershipRole: null,
      memberships: [],
      status: "unauthenticated",
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

// Inyecta token + handler de 401 al cliente HTTP, igual que el móvil.
configureApi({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});

// ---- Selectores derivados ----

/** ¿La sesión puede administrar el club activo? (admin del club o super admin) */
export function selectIsAdmin(s: AuthState): boolean {
  return (
    s.activeMembershipRole === "admin" || s.user?.globalRole === "super_admin"
  );
}

export function selectIsSuperAdmin(s: AuthState): boolean {
  return s.user?.globalRole === "super_admin";
}
