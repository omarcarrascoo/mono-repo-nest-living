import { create } from 'zustand';
import { amenitiesService } from '@/services/amenities.service';
import { usersService } from '@/services/users.service';

interface FavoritesState {
  ids: Set<string>;
  loaded: boolean;
  loading: boolean;
  pending: Record<string, boolean>;
  error: string | null;

  hydrate: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => Promise<boolean>;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set<string>(),
  loaded: false,
  loading: false,
  pending: {},
  error: null,

  hydrate: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const ids = await usersService.favorites();
      set({ ids: new Set(ids), loading: false, loaded: true });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'No pudimos cargar tus favoritos' });
    }
  },

  isFavorite: (id: string) => get().ids.has(id),

  toggle: async (id: string) => {
    const state = get();
    if (state.pending[id]) return state.ids.has(id);
    const isFav = state.ids.has(id);

    // Optimistic update
    const nextIds = new Set(state.ids);
    if (isFav) nextIds.delete(id);
    else nextIds.add(id);
    set({
      ids: nextIds,
      pending: { ...state.pending, [id]: true },
      error: null,
    });

    try {
      if (isFav) await amenitiesService.removeFavorite(id);
      else await amenitiesService.addFavorite(id);
      set((s) => {
        const p = { ...s.pending };
        delete p[id];
        return { pending: p };
      });
      return !isFav;
    } catch (e: any) {
      // rollback
      set((s) => {
        const rolled = new Set(s.ids);
        if (isFav) rolled.add(id);
        else rolled.delete(id);
        const p = { ...s.pending };
        delete p[id];
        return {
          ids: rolled,
          pending: p,
          error: e?.message ?? 'No pudimos actualizar tu favorito',
        };
      });
      throw e;
    }
  },

  reset: () =>
    set({
      ids: new Set<string>(),
      loaded: false,
      loading: false,
      pending: {},
      error: null,
    }),
}));
