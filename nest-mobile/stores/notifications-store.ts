import { create } from 'zustand';
import { Notification } from '@/types/api';
import { notificationsService } from '@/services/notifications.service';

interface NotificationsState {
  // Push token registration (existing)
  registeredToken: string | null;
  registering: boolean;
  error: string | null;

  // Inbox
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  inboxError: string | null;
  loadedAt: number | null;

  registerToken: (
    token: string,
    platform?: 'ios' | 'android' | 'web' | 'unknown',
    deviceName?: string,
  ) => Promise<void>;
  unregisterToken: () => Promise<void>;

  fetchInbox: (opts?: { force?: boolean }) => Promise<void>;
  refreshInbox: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  reset: () => void;
}

const STALE_MS = 30_000;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  registeredToken: null,
  registering: false,
  error: null,

  items: [],
  unreadCount: 0,
  loading: false,
  refreshing: false,
  inboxError: null,
  loadedAt: null,

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

  fetchInbox: async ({ force = false } = {}) => {
    const state = get();
    if (!force && state.loadedAt && Date.now() - state.loadedAt < STALE_MS) return;
    set({ loading: true, inboxError: null });
    try {
      const [items, count] = await Promise.all([
        notificationsService.listMine(),
        notificationsService.unreadCount(),
      ]);
      set({
        items,
        unreadCount: count,
        loading: false,
        loadedAt: Date.now(),
      });
    } catch (e: any) {
      set({ loading: false, inboxError: e?.message ?? 'No pudimos cargar tus notificaciones' });
    }
  },

  refreshInbox: async () => {
    set({ refreshing: true, inboxError: null });
    try {
      const [items, count] = await Promise.all([
        notificationsService.listMine(),
        notificationsService.unreadCount(),
      ]);
      set({
        items,
        unreadCount: count,
        refreshing: false,
        loadedAt: Date.now(),
      });
    } catch (e: any) {
      set({ refreshing: false, inboxError: e?.message ?? 'No pudimos refrescar' });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsService.unreadCount();
      set({ unreadCount: count });
    } catch {
      // silent — only afecta el badge
    }
  },

  markRead: async (id) => {
    const before = get().items;
    const wasUnread = before.find((n) => n.id === id && !n.read);
    set((s) => ({
      items: s.items.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
      ),
      unreadCount: wasUnread ? Math.max(s.unreadCount - 1, 0) : s.unreadCount,
    }));
    try {
      await notificationsService.markRead(id);
    } catch {
      // si falla revertimos
      set({ items: before });
      void get().fetchUnreadCount();
    }
  },

  markAllRead: async () => {
    const before = get().items;
    const beforeCount = get().unreadCount;
    set((s) => ({
      items: s.items.map((n) =>
        n.read ? n : { ...n, read: true, readAt: new Date().toISOString() },
      ),
      unreadCount: 0,
    }));
    try {
      await notificationsService.markAllRead();
    } catch {
      set({ items: before, unreadCount: beforeCount });
    }
  },

  reset: () =>
    set({
      registeredToken: null,
      registering: false,
      error: null,
      items: [],
      unreadCount: 0,
      loading: false,
      refreshing: false,
      inboxError: null,
      loadedAt: null,
    }),
}));
