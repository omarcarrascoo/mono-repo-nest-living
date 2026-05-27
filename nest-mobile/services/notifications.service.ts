import { apiFetch } from '@/lib/api/client';
import { Notification, RegisterPushTokenRequest } from '@/types/api';
import { adaptNotification } from './adapters';

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

  async listMine(opts: { unreadOnly?: boolean } = {}): Promise<Notification[]> {
    const qs = opts.unreadOnly ? '?unreadOnly=true' : '';
    const raw = await apiFetch<any[]>(`/notifications/me${qs}`);
    return Array.isArray(raw) ? raw.map(adaptNotification) : [];
  },

  async unreadCount(): Promise<number> {
    const raw = await apiFetch<{ count: number }>('/notifications/me/unread-count');
    return raw?.count ?? 0;
  },

  async markRead(id: string): Promise<Notification> {
    const raw = await apiFetch<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
      body: {},
    });
    return adaptNotification(raw);
  },

  async markAllRead(): Promise<{ modified: number }> {
    return apiFetch<{ modified: number }>('/notifications/mark-all-read', {
      method: 'POST',
      body: {},
    });
  },
};
