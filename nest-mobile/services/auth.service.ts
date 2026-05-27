import { apiFetch } from '@/lib/api/client';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '@/types/api';
import { adaptAuthUser } from './adapters';

export const authService = {
  login(payload: LoginRequest) {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
  },

  async register(payload: RegisterRequest) {
    const raw = await apiFetch<any>('/auth/register', {
      method: 'POST',
      body: { role: 'user', ...payload },
      auth: false,
    });
    return adaptAuthUser(raw);
  },

  async me(): Promise<AuthUser> {
    const raw = await apiFetch<any>('/users/me', { method: 'GET' });
    return adaptAuthUser(raw);
  },
};
