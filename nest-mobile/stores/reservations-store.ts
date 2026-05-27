import { create } from 'zustand';
import {
  CreateReservationRequest,
  Reservation,
  UpdateReservationRequest,
} from '@/types/api';
import { reservationsService } from '@/services/reservations.service';

type FilterKey = 'upcoming' | 'past' | 'cancelled';

interface PageState {
  ids: string[];
  cursor: string | null;
  loaded: boolean;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
}

interface ReservationsState {
  byId: Record<string, Reservation>;
  pages: Record<FilterKey, PageState>;
  creating: boolean;
  cancelling: Record<string, boolean>;
  modifying: Record<string, boolean>;

  fetchPage: (filter: FilterKey, opts?: { append?: boolean; refresh?: boolean }) => Promise<void>;
  fetchOne: (id: string) => Promise<Reservation>;
  create: (payload: CreateReservationRequest) => Promise<Reservation>;
  cancel: (id: string) => Promise<Reservation>;
  modify: (id: string, payload: UpdateReservationRequest) => Promise<Reservation>;
  invalidate: () => void;
  reset: () => void;
}

const PAGE_SIZE = 20;

const emptyPage = (): PageState => ({
  ids: [],
  cursor: null,
  loaded: false,
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
});

const initialPages = (): Record<FilterKey, PageState> => ({
  upcoming: emptyPage(),
  past: emptyPage(),
  cancelled: emptyPage(),
});

function categorize(r: Reservation): FilterKey {
  if (r.status === 'cancelled') return 'cancelled';
  if (new Date(r.startTime).getTime() >= Date.now()) return 'upcoming';
  return 'past';
}

export const useReservationsStore = create<ReservationsState>((set, get) => ({
  byId: {},
  pages: initialPages(),
  creating: false,
  cancelling: {},
  modifying: {},

  fetchPage: async (filter, { append = false, refresh = false } = {}) => {
    const state = get();
    const page = state.pages[filter];
    if (page.loading || page.loadingMore || page.refreshing) return;

    set((s) => ({
      pages: {
        ...s.pages,
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
      const res = await reservationsService.list({
        filter,
        limit: PAGE_SIZE,
        cursor: cursor ?? undefined,
      });

      set((s) => {
        const nextById = { ...s.byId };
        for (const r of res.items) nextById[r.id] = r;
        const existingIds = append ? s.pages[filter].ids : [];
        const merged = [...existingIds, ...res.items.map((r) => r.id)];
        // dedup conservando orden
        const seen = new Set<string>();
        const dedup = merged.filter((id) => {
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        return {
          byId: nextById,
          pages: {
            ...s.pages,
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
        pages: {
          ...s.pages,
          [filter]: {
            ...s.pages[filter],
            loading: false,
            loadingMore: false,
            refreshing: false,
            error: e?.message ?? 'Error cargando reservas',
          },
        },
      }));
    }
  },

  fetchOne: async (id) => {
    const cached = get().byId[id];
    if (cached) return cached;
    const r = await reservationsService.get(id);
    set((s) => ({ byId: { ...s.byId, [id]: r } }));
    return r;
  },

  create: async (payload) => {
    if (get().creating) {
      throw new Error('Ya estamos procesando una reserva');
    }
    set({ creating: true });
    try {
      const r = await reservationsService.create(payload);
      set((s) => ({
        creating: false,
        byId: { ...s.byId, [r.id]: r },
        pages: {
          ...s.pages,
          upcoming: {
            ...s.pages.upcoming,
            // Insertamos al inicio si ya hay datos cargados
            ids: s.pages.upcoming.loaded
              ? [r.id, ...s.pages.upcoming.ids.filter((x) => x !== r.id)]
              : s.pages.upcoming.ids,
          },
        },
      }));
      return r;
    } catch (e) {
      set({ creating: false });
      throw e;
    }
  },

  cancel: async (id) => {
    if (get().cancelling[id]) {
      return get().byId[id];
    }
    set((s) => ({ cancelling: { ...s.cancelling, [id]: true } }));
    try {
      const r = await reservationsService.cancel(id);
      set((s) => {
        const removeFromUpcoming = s.pages.upcoming.ids.filter((x) => x !== id);
        const cancelledIds = s.pages.cancelled.loaded
          ? [r.id, ...s.pages.cancelled.ids.filter((x) => x !== id)]
          : s.pages.cancelled.ids;
        const c = { ...s.cancelling };
        delete c[id];
        return {
          cancelling: c,
          byId: { ...s.byId, [id]: r },
          pages: {
            ...s.pages,
            upcoming: { ...s.pages.upcoming, ids: removeFromUpcoming },
            cancelled: { ...s.pages.cancelled, ids: cancelledIds },
          },
        };
      });
      return r;
    } catch (e) {
      set((s) => {
        const c = { ...s.cancelling };
        delete c[id];
        return { cancelling: c };
      });
      throw e;
    }
  },

  modify: async (id, payload) => {
    if (get().modifying[id]) return get().byId[id];
    set((s) => ({ modifying: { ...s.modifying, [id]: true } }));
    try {
      const r = await reservationsService.update(id, payload);
      set((s) => {
        const m = { ...s.modifying };
        delete m[id];

        // Si el id cambió (porque modify cancela y crea uno nuevo), gestionamos ambos
        const oldByCategory = categorize(s.byId[id] ?? r);
        const newCategory = categorize(r);

        const pages = { ...s.pages };

        // Quitar el id viejo de su pageColumn anterior
        if (pages[oldByCategory]) {
          pages[oldByCategory] = {
            ...pages[oldByCategory],
            ids: pages[oldByCategory].ids.filter((x) => x !== id),
          };
        }

        // Insertar el nuevo (si aplica)
        if (pages[newCategory] && pages[newCategory].loaded) {
          const without = pages[newCategory].ids.filter((x) => x !== r.id);
          pages[newCategory] = {
            ...pages[newCategory],
            ids: [r.id, ...without],
          };
        }

        return {
          modifying: m,
          byId: { ...s.byId, [r.id]: r },
          pages,
        };
      });
      return r;
    } catch (e) {
      set((s) => {
        const m = { ...s.modifying };
        delete m[id];
        return { modifying: m };
      });
      throw e;
    }
  },

  invalidate: () => set({ pages: initialPages() }),

  reset: () =>
    set({
      byId: {},
      pages: initialPages(),
      creating: false,
      cancelling: {},
      modifying: {},
    }),
}));
