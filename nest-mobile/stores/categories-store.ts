import { create } from 'zustand';
import { Category } from '@/types/api';
import { categoriesService } from '@/services/categories.service';

interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
  loadedAt: number | null;

  fetchAll: (opts?: { force?: boolean }) => Promise<void>;
  reset: () => void;
}

const STALE_MS = 5 * 60_000;

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  loadedAt: null,

  fetchAll: async ({ force = false } = {}) => {
    const { loading, loadedAt } = get();
    if (loading) return;
    if (!force && loadedAt && Date.now() - loadedAt < STALE_MS) return;
    set({ loading: true, error: null });
    try {
      const items = await categoriesService.list();
      set({ items, loading: false, loadedAt: Date.now() });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Error cargando categorías' });
    }
  },

  reset: () => set({ items: [], loading: false, error: null, loadedAt: null }),
}));
