import { apiFetch } from '@/lib/api/client';
import { RegisterPushTokenRequest } from '@/types/api';

export const notificationsService = {
  async registerToken(payload: RegisterPushTokenRequest): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/notifications/register-token', {
      method: 'POST',
      body: payload,
    });
  },

  async unregisterToken(expoPushToken: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/notifications/unregister-token', {
      method: 'DELETE',
      body: { expoPushToken },
    });
  },
};
