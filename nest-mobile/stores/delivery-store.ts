import { create } from 'zustand';
import { FeaturedProduct, Product, ProductCategory } from '@/types/api';
import { deliveryService } from '@/services/delivery.service';

interface DeliveryState {
  products: Product[];
  byId: Record<string, Product>;
  categories: ProductCategory[];
  featured: FeaturedProduct | null;

  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadedAt: number | null;

  query: { q?: string; category?: string };
  /** Monotonic seq, mismo patrón que amenities-store para evitar races. */
  requestSeq: number;

  fetchAll: (opts?: { force?: boolean }) => Promise<void>;
  setQuery: (q: { q?: string; category?: string }) => void;
  refresh: () => Promise<void>;
  fetchProduct: (id: string) => Promise<Product>;
  reset: () => void;
}

const STALE_MS = 60_000;

function sameQuery(a: DeliveryState['query'], b: DeliveryState['query']): boolean {
  return (a.q ?? '') === (b.q ?? '') && (a.category ?? '') === (b.category ?? '');
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  products: [],
  byId: {},
  categories: [],
  featured: null,
  loading: false,
  refreshing: false,
  error: null,
  loadedAt: null,
  query: {},
  requestSeq: 0,

  setQuery: (q) => {
    const state = get();
    if (sameQuery(state.query, q)) return;
    const seq = state.requestSeq + 1;
    set({ loading: true, error: null, query: q, requestSeq: seq });
    deliveryService
      .listProducts(q)
      .then((items) => {
        if (get().requestSeq !== seq) return;
        const byId: Record<string, Product> = {};
        for (const p of items) byId[p.id] = p;
        set({ products: items, byId, loading: false, loadedAt: Date.now() });
      })
      .catch((e) => {
        if (get().requestSeq !== seq) return;
        set({ loading: false, error: e?.message ?? 'Error cargando productos' });
      });
  },

  fetchAll: async ({ force = false } = {}) => {
    const state = get();
    if (!force && state.loadedAt && Date.now() - state.loadedAt < STALE_MS) return;

    const seq = state.requestSeq + 1;
    set({ loading: true, error: null, requestSeq: seq });
    try {
      const [products, categories, featured] = await Promise.all([
        deliveryService.listProducts(state.query),
        deliveryService.listCategories(),
        deliveryService.getFeaturedOfDay(),
      ]);
      if (get().requestSeq !== seq) return;
      const byId: Record<string, Product> = {};
      for (const p of products) byId[p.id] = p;
      set({
        products,
        byId,
        categories,
        featured,
        loading: false,
        loadedAt: Date.now(),
      });
    } catch (e: any) {
      if (get().requestSeq !== seq) return;
      set({ loading: false, error: e?.message ?? 'Error cargando delivery' });
    }
  },

  refresh: async () => {
    const seq = get().requestSeq + 1;
    set({ refreshing: true, error: null, requestSeq: seq });
    try {
      const [products, categories, featured] = await Promise.all([
        deliveryService.listProducts(get().query),
        deliveryService.listCategories(),
        deliveryService.getFeaturedOfDay(),
      ]);
      if (get().requestSeq !== seq) return;
      const byId: Record<string, Product> = {};
      for (const p of products) byId[p.id] = p;
      set({
        products,
        byId,
        categories,
        featured,
        refreshing: false,
        loadedAt: Date.now(),
      });
    } catch (e: any) {
      if (get().requestSeq !== seq) return;
      set({ refreshing: false, error: e?.message ?? 'Error refrescando' });
    }
  },

  fetchProduct: async (id) => {
    const cached = get().byId[id];
    if (cached) return cached;
    const product = await deliveryService.getProduct(id);
    set((s) => ({ byId: { ...s.byId, [id]: product } }));
    return product;
  },

  reset: () =>
    set({
      products: [],
      byId: {},
      categories: [],
      featured: null,
      loading: false,
      refreshing: false,
      error: null,
      loadedAt: null,
      query: {},
      requestSeq: 0,
    }),
}));
