import { create } from 'zustand';
import { Amenity, AvailabilityResponse } from '@/types/api';
import { amenitiesService, ListAmenitiesParams } from '@/services/amenities.service';

interface AmenitiesState {
  items: Amenity[];
  byId: Record<string, Amenity>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadedAt: number | null;
  query: ListAmenitiesParams;
  /** Monotonic id de request — solo el más reciente puede comitear resultados. */
  requestSeq: number;

  // Availability cache: amenityId+date -> response
  availability: Record<string, AvailabilityResponse>;
  availabilityLoading: Record<string, boolean>;

  fetchAll: (opts?: { force?: boolean; params?: ListAmenitiesParams }) => Promise<void>;
  setQuery: (q: ListAmenitiesParams) => void;
  refresh: () => Promise<void>;
  fetchOne: (id: string) => Promise<Amenity>;
  fetchAvailability: (
    amenityId: string,
    dateYYYYMMDD: string,
    opts?: { force?: boolean },
  ) => Promise<AvailabilityResponse>;
  invalidateAvailability: (amenityId: string, dateYYYYMMDD?: string) => void;
  reset: () => void;
}

const STALE_MS = 60_000;

function cacheKey(id: string, date: string) {
  return `${id}::${date}`;
}

function sameQuery(a: ListAmenitiesParams, b: ListAmenitiesParams): boolean {
  return (
    (a.q ?? '') === (b.q ?? '') &&
    (a.category ?? '') === (b.category ?? '') &&
    !!a.favorite === !!b.favorite
  );
}

export const useAmenitiesStore = create<AmenitiesState>((set, get) => ({
  items: [],
  byId: {},
  loading: false,
  refreshing: false,
  error: null,
  loadedAt: null,
  query: {},
  requestSeq: 0,
  availability: {},
  availabilityLoading: {},

  setQuery: (q: ListAmenitiesParams) => {
    void get().fetchAll({ force: true, params: q });
  },

  fetchAll: async ({ force = false, params } = {}) => {
    const state = get();
    const nextQuery = params ?? state.query;
    const queryChanged = !sameQuery(state.query, nextQuery);
    if (!force && !queryChanged && state.loadedAt && Date.now() - state.loadedAt < STALE_MS) {
      return;
    }

    const seq = state.requestSeq + 1;
    set({ loading: true, error: null, query: nextQuery, requestSeq: seq });
    try {
      const items = await amenitiesService.list(nextQuery);
      // Solo el último request en vuelo puede comitear — descarta resultados stale.
      if (get().requestSeq !== seq) return;
      const byId: Record<string, Amenity> = {};
      for (const item of items) byId[item.id] = item;
      set({ items, byId, loading: false, loadedAt: Date.now() });
    } catch (e: any) {
      if (get().requestSeq !== seq) return;
      set({ loading: false, error: e?.message ?? 'Error cargando amenidades' });
    }
  },

  refresh: async () => {
    const seq = get().requestSeq + 1;
    set({ refreshing: true, error: null, requestSeq: seq });
    try {
      const items = await amenitiesService.list(get().query);
      if (get().requestSeq !== seq) return;
      const byId: Record<string, Amenity> = {};
      for (const item of items) byId[item.id] = item;
      set({ items, byId, refreshing: false, loadedAt: Date.now() });
    } catch (e: any) {
      if (get().requestSeq !== seq) return;
      set({ refreshing: false, error: e?.message ?? 'Error refrescando' });
    }
  },

  fetchOne: async (id: string) => {
    const cached = get().byId[id];
    if (cached) return cached;
    const item = await amenitiesService.get(id);
    set((s) => ({
      byId: { ...s.byId, [id]: item },
    }));
    return item;
  },

  fetchAvailability: async (amenityId, dateYYYYMMDD, { force = false } = {}) => {
    const key = cacheKey(amenityId, dateYYYYMMDD);
    const state = get();
    if (!force && state.availability[key]) return state.availability[key];
    set((s) => ({
      availabilityLoading: { ...s.availabilityLoading, [key]: true },
    }));
    try {
      const data = await amenitiesService.availability(amenityId, dateYYYYMMDD);
      set((s) => ({
        availability: { ...s.availability, [key]: data },
        availabilityLoading: { ...s.availabilityLoading, [key]: false },
      }));
      return data;
    } catch (e) {
      set((s) => ({
        availabilityLoading: { ...s.availabilityLoading, [key]: false },
      }));
      throw e;
    }
  },

  invalidateAvailability: (amenityId, dateYYYYMMDD) => {
    set((s) => {
      const next = { ...s.availability };
      if (dateYYYYMMDD) {
        delete next[cacheKey(amenityId, dateYYYYMMDD)];
      } else {
        // Invalidar todas las del amenity
        for (const k of Object.keys(next)) {
          if (k.startsWith(`${amenityId}::`)) delete next[k];
        }
      }
      return { availability: next };
    });
  },

  reset: () =>
    set({
      items: [],
      byId: {},
      loading: false,
      refreshing: false,
      error: null,
      loadedAt: null,
      query: {},
      requestSeq: 0,
      availability: {},
      availabilityLoading: {},
    }),
}));
