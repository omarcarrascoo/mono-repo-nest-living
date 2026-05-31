import { apiFetch } from "@/lib/api/client";
import { AuthUser, LoginRequest, LoginResponse, SwitchClubRequest } from "@/types/api";
import { adaptAuthUser } from "./adapters";

export const authService = {
  login(payload: LoginRequest) {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    });
  },

  switchClub(payload: SwitchClubRequest) {
    return apiFetch<LoginResponse>("/auth/switch-club", {
      method: "POST",
      body: payload,
    });
  },

  async me(): Promise<AuthUser> {
    const raw = await apiFetch<Record<string, unknown>>("/users/me", {
      method: "GET",
    });
    return adaptAuthUser(raw);
  },
};
