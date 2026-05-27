import { create } from 'zustand';
import { Order, OrderListFilter } from '@/types/api';
import { deliveryService } from '@/services/delivery.service';

interface OrdersState {
  items: Order[];
  byId: Record<string, Order>;

  filter: OrderListFilter;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadedAt: number | null;

  fetchMine: (opts?: { force?: boolean }) => Promise<void>;
  refreshMine: () => Promise<void>;
  setFilter: (filter: OrderListFilter) => void;
  fetchOrder: (id: string) => Promise<Order>;
  upsertOrder: (order: Order) => void;
  reset: () => void;
}

const STALE_MS = 30_000;

export const useOrdersStore = create<OrdersState>((set, get) => ({
  items: [],
  byId: {},
  filter: 'all',
  loading: false,
  refreshing: false,
  error: null,
  loadedAt: null,

  fetchMine: async ({ force = false } = {}) => {
    const state = get();
    if (!force && state.loadedAt && Date.now() - state.loadedAt < STALE_MS) return;
    set({ loading: true, error: null });
    try {
      const items = await deliveryService.listMyOrders(state.filter);
      const byId = { ...state.byId };
      for (const o of items) byId[o.id] = o;
      set({ items, byId, loading: false, loadedAt: Date.now() });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Error cargando tus pedidos' });
    }
  },

  refreshMine: async () => {
    const state = get();
    set({ refreshing: true, error: null });
    try {
      const items = await deliveryService.listMyOrders(state.filter);
      const byId = { ...state.byId };
      for (const o of items) byId[o.id] = o;
      set({ items, byId, refreshing: false, loadedAt: Date.now() });
    } catch (e: any) {
      set({ refreshing: false, error: e?.message ?? 'Error refrescando' });
    }
  },

  setFilter: (filter) => {
    if (get().filter === filter) return;
    set({ filter, loadedAt: null });
    void get().fetchMine({ force: true });
  },

  fetchOrder: async (id) => {
    const order = await deliveryService.getOrder(id);
    set((s) => {
      const byId = { ...s.byId, [id]: order };
      const items = s.items.some((o) => o.id === id)
        ? s.items.map((o) => (o.id === id ? order : o))
        : s.items;
      return { byId, items };
    });
    return order;
  },

  upsertOrder: (order) =>
    set((s) => {
      const byId = { ...s.byId, [order.id]: order };
      const items = s.items.some((o) => o.id === order.id)
        ? s.items.map((o) => (o.id === order.id ? order : o))
        : [order, ...s.items];
      return { byId, items };
    }),

  reset: () =>
    set({
      items: [],
      byId: {},
      filter: 'all',
      loading: false,
      refreshing: false,
      error: null,
      loadedAt: null,
    }),
}));
