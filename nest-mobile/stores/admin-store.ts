import { create } from 'zustand';
import {
  AdminReservation,
  AdminReservationStats,
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
  DirectoryUser,
  Order,
  OrderListFilter,
  OrderStatus,
} from '@/types/api';
import { adminService } from '@/services/admin.service';

type ReservationFilter = 'upcoming' | 'past' | 'cancelled' | 'all';

interface ReservationsPage {
  ids: string[];
  cursor: string | null;
  loaded: boolean;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
}

interface OrdersPanel {
  items: Order[];
  loaded: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  filter: OrderListFilter;
  loadedAt: number | null;
}

interface AdminState {
  // Reservations
  reservationsById: Record<string, AdminReservation>;
  reservationsPage: Record<ReservationFilter, ReservationsPage>;
  cancellingReservation: Record<string, boolean>;

  // Reservation stats (admin dashboard)
  stats: AdminReservationStats | null;
  statsLoading: boolean;
  statsError: string | null;
  statsLoadedAt: number | null;

  // Orders (staff list)
  orders: OrdersPanel;
  updatingOrder: Record<string, boolean>;

  // Users directory
  directory: DirectoryUser[];
  directoryLoading: boolean;
  directoryError: string | null;
  directoryQuery: string;

  // Broadcast
  broadcasting: boolean;
  broadcastError: string | null;
  lastBroadcast: BroadcastNotificationResponse | null;

  fetchReservations: (
    filter: ReservationFilter,
    opts?: { append?: boolean; refresh?: boolean },
  ) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;

  fetchStats: (opts?: { force?: boolean }) => Promise<void>;

  fetchOrders: (opts?: { force?: boolean }) => Promise<void>;
  refreshOrders: () => Promise<void>;
  setOrdersFilter: (f: OrderListFilter) => void;
  advanceOrder: (id: string, status: OrderStatus, note?: string) => Promise<Order>;
  cancelOrder: (id: string, note?: string) => Promise<Order>;

  fetchDirectory: (q?: string) => Promise<void>;
  setDirectoryQuery: (q: string) => void;

  sendBroadcast: (
    payload: BroadcastNotificationRequest,
  ) => Promise<BroadcastNotificationResponse>;

  reset: () => void;
}

const PAGE_SIZE = 30;
const ORDERS_STALE_MS = 30_000;
const STATS_STALE_MS = 60_000;

const emptyReservationsPage = (): ReservationsPage => ({
  ids: [],
  cursor: null,
  loaded: false,
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
});

const initialReservationsPages = (): Record<ReservationFilter, ReservationsPage> => ({
  upcoming: emptyReservationsPage(),
  past: emptyReservationsPage(),
  cancelled: emptyReservationsPage(),
  all: emptyReservationsPage(),
});

const initialOrdersPanel = (): OrdersPanel => ({
  items: [],
  loaded: false,
  loading: false,
  refreshing: false,
  error: null,
  filter: 'active',
  loadedAt: null,
});

export const useAdminStore = create<AdminState>((set, get) => ({
  reservationsById: {},
  reservationsPage: initialReservationsPages(),
  cancellingReservation: {},

  stats: null,
  statsLoading: false,
  statsError: null,
  statsLoadedAt: null,

  orders: initialOrdersPanel(),
  updatingOrder: {},

  directory: [],
  directoryLoading: false,
  directoryError: null,
  directoryQuery: '',

  broadcasting: false,
  broadcastError: null,
  lastBroadcast: null,

  fetchReservations: async (filter, { append = false, refresh = false } = {}) => {
    const state = get();
    const page = state.reservationsPage[filter];
    if (page.loading || page.loadingMore || page.refreshing) return;

    set((s) => ({
      reservationsPage: {
        ...s.reservationsPage,
        [filter]: {
          ...page,
          loading: !append && !refresh && !page.loaded,
          loadingMore: append,
          refreshing: refresh,
          error: null,
        },
      },
    }));

    try {
      const cursor = append ? page.cursor ?? undefined : undefined;
      const res = await adminService.listReservations({
        filter,
        cursor,
        limit: PAGE_SIZE,
      });

      set((s) => {
        const nextById = { ...s.reservationsById };
        for (const r of res.items) nextById[r.id] = r;
        const existing = append ? s.reservationsPage[filter].ids : [];
        const merged = [...existing, ...res.items.map((r) => r.id)];
        const seen = new Set<string>();
        const dedup = merged.filter((id) => {
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        return {
          reservationsById: nextById,
          reservationsPage: {
            ...s.reservationsPage,
            [filter]: {
              ids: dedup,
              cursor: res.nextCursor,
              loaded: true,
              loading: false,
              loadingMore: false,
              refreshing: false,
              error: null,
            },
          },
        };
      });
    } catch (e: any) {
      set((s) => ({
        reservationsPage: {
          ...s.reservationsPage,
          [filter]: {
            ...s.reservationsPage[filter],
            loading: false,
            loadingMore: false,
            refreshing: false,
            error: e?.message ?? 'Error cargando reservas',
          },
        },
      }));
    }
  },

  cancelReservation: async (id) => {
    if (get().cancellingReservation[id]) return;
    set((s) => ({ cancellingReservation: { ...s.cancellingReservation, [id]: true } }));
    try {
      const r = await adminService.cancelReservation(id);
      set((s) => {
        const nextById = { ...s.reservationsById, [r.id]: r };
        const c = { ...s.cancellingReservation };
        delete c[id];
        const upcoming = s.reservationsPage.upcoming;
        const cancelled = s.reservationsPage.cancelled;
        return {
          cancellingReservation: c,
          reservationsById: nextById,
          reservationsPage: {
            ...s.reservationsPage,
            upcoming: {
              ...upcoming,
              ids: upcoming.ids.filter((x) => x !== id),
            },
            cancelled: cancelled.loaded
              ? {
                  ...cancelled,
                  ids: [r.id, ...cancelled.ids.filter((x) => x !== id)],
                }
              : cancelled,
          },
        };
      });
    } catch (e) {
      set((s) => {
        const c = { ...s.cancellingReservation };
        delete c[id];
        return { cancellingReservation: c };
      });
      throw e;
    }
  },

  fetchStats: async ({ force = false } = {}) => {
    const state = get();
    if (state.statsLoading) return;
    if (
      !force &&
      state.statsLoadedAt &&
      Date.now() - state.statsLoadedAt < STATS_STALE_MS
    )
      return;
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await adminService.getReservationStats();
      set({ stats, statsLoading: false, statsLoadedAt: Date.now() });
    } catch (e: any) {
      set({
        statsLoading: false,
        statsError: e?.message ?? 'Error cargando estadísticas',
      });
    }
  },

  fetchOrders: async ({ force = false } = {}) => {
    const state = get();
    const panel = state.orders;
    if (
      !force &&
      panel.loadedAt &&
      Date.now() - panel.loadedAt < ORDERS_STALE_MS
    )
      return;
    set((s) => ({ orders: { ...s.orders, loading: true, error: null } }));
    try {
      const items = await adminService.listOrders({ filter: panel.filter });
      set((s) => ({
        orders: {
          ...s.orders,
          items,
          loaded: true,
          loading: false,
          loadedAt: Date.now(),
          error: null,
        },
      }));
    } catch (e: any) {
      set((s) => ({
        orders: {
          ...s.orders,
          loading: false,
          error: e?.message ?? 'Error cargando pedidos',
        },
      }));
    }
  },

  refreshOrders: async () => {
    const state = get();
    set((s) => ({ orders: { ...s.orders, refreshing: true, error: null } }));
    try {
      const items = await adminService.listOrders({ filter: state.orders.filter });
      set((s) => ({
        orders: {
          ...s.orders,
          items,
          refreshing: false,
          loadedAt: Date.now(),
          error: null,
        },
      }));
    } catch (e: any) {
      set((s) => ({
        orders: {
          ...s.orders,
          refreshing: false,
          error: e?.message ?? 'Error refrescando',
        },
      }));
    }
  },

  setOrdersFilter: (f) => {
    if (get().orders.filter === f) return;
    set((s) => ({
      orders: { ...s.orders, filter: f, loaded: false, loadedAt: null },
    }));
    void get().fetchOrders({ force: true });
  },

  advanceOrder: async (id, status, note) => {
    if (get().updatingOrder[id]) return get().orders.items.find((o) => o.id === id)!;
    set((s) => ({ updatingOrder: { ...s.updatingOrder, [id]: true } }));
    try {
      const updated = await adminService.updateOrderStatus(id, status, note);
      set((s) => {
        const u = { ...s.updatingOrder };
        delete u[id];
        const items = s.orders.items.some((o) => o.id === id)
          ? s.orders.items.map((o) => (o.id === id ? updated : o))
          : s.orders.items;
        return {
          updatingOrder: u,
          orders: { ...s.orders, items },
        };
      });
      return updated;
    } catch (e) {
      set((s) => {
        const u = { ...s.updatingOrder };
        delete u[id];
        return { updatingOrder: u };
      });
      throw e;
    }
  },

  cancelOrder: (id, note) => get().advanceOrder(id, 'cancelled', note),

  fetchDirectory: async (q) => {
    set({ directoryLoading: true, directoryError: null });
    try {
      const items = await adminService.listUsers(q);
      set({ directory: items, directoryLoading: false });
    } catch (e: any) {
      set({
        directoryLoading: false,
        directoryError: e?.message ?? 'Error cargando directorio',
      });
    }
  },

  setDirectoryQuery: (q) => set({ directoryQuery: q }),

  sendBroadcast: async (payload) => {
    if (get().broadcasting) {
      throw new Error('Ya hay un envío en curso');
    }
    set({ broadcasting: true, broadcastError: null });
    try {
      const res = await adminService.broadcast(payload);
      set({ broadcasting: false, lastBroadcast: res });
      return res;
    } catch (e: any) {
      set({
        broadcasting: false,
        broadcastError: e?.message ?? 'Error enviando notificación',
      });
      throw e;
    }
  },

  reset: () =>
    set({
      reservationsById: {},
      reservationsPage: initialReservationsPages(),
      cancellingReservation: {},
      stats: null,
      statsLoading: false,
      statsError: null,
      statsLoadedAt: null,
      orders: initialOrdersPanel(),
      updatingOrder: {},
      directory: [],
      directoryLoading: false,
      directoryError: null,
      directoryQuery: '',
      broadcasting: false,
      broadcastError: null,
      lastBroadcast: null,
    }),
}));
