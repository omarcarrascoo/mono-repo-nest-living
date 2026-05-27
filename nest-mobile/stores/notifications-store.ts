import { create } from 'zustand';
import { notificationsService } from '@/services/notifications.service';

interface NotificationsState {
  registeredToken: string | null;
  registering: boolean;
  error: string | null;

  registerToken: (
    token: string,
    platform?: 'ios' | 'android' | 'web' | 'unknown',
    deviceName?: string,
  ) => Promise<void>;
  unregisterToken: () => Promise<void>;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  registeredToken: null,
  registering: false,
  error: null,

  registerToken: async (token, platform, deviceName) => {
    if (get().registeredToken === token) return;
    set({ registering: true, error: null });
    try {
      await notificationsService.registerToken({
        expoPushToken: token,
        platform,
        deviceName,
      });
      set({ registeredToken: token, registering: false });
    } catch (e: any) {
      set({ registering: false, error: e?.message ?? 'No pudimos registrar tu dispositivo' });
    }
  },

  unregisterToken: async () => {
    const token = get().registeredToken;
    if (!token) return;
    try {
      await notificationsService.unregisterToken(token);
    } catch {
      // ignore
    }
    set({ registeredToken: null });
  },

  reset: () => set({ registeredToken: null, registering: false, error: null }),
}));
