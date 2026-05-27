import { apiFetch } from '@/lib/api/client';
import { FavoriteIdsResponse, NotificationPreferences } from '@/types/api';

export const usersService = {
  async favorites(): Promise<string[]> {
    const raw = await apiFetch<FavoriteIdsResponse>('/users/me/favorites', {
      method: 'GET',
    });
    return Array.isArray(raw?.ids) ? raw.ids.map(String) : [];
  },

  async updateNotificationPreferences(
    payload: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    return apiFetch<NotificationPreferences>(
      '/users/me/notification-preferences',
      { method: 'PATCH', body: payload },
    );
  },
};
