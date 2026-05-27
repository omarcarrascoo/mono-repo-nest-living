import { apiFetch } from '@/lib/api/client';
import { Amenity, AvailabilityResponse } from '@/types/api';
import { adaptAmenity, adaptAvailability } from './adapters';

export interface ListAmenitiesParams {
  q?: string;
  category?: string;
  favorite?: boolean;
}

function buildQuery(params: ListAmenitiesParams): string {
  const sp = new URLSearchParams();
  if (params.q && params.q.trim().length > 0) sp.set('q', params.q.trim());
  if (params.category) sp.set('category', params.category);
  if (params.favorite) sp.set('favorite', 'true');
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const amenitiesService = {
  async list(params: ListAmenitiesParams = {}): Promise<Amenity[]> {
    const raw = await apiFetch<any[]>(`/amenities${buildQuery(params)}`, {
      method: 'GET',
    });
    return (raw ?? []).map(adaptAmenity);
  },

  async get(id: string): Promise<Amenity> {
    const raw = await apiFetch<any>(`/amenities/${id}`, { method: 'GET' });
    return adaptAmenity(raw);
  },

  async availability(id: string, dateYYYYMMDD: string): Promise<AvailabilityResponse> {
    const raw = await apiFetch<any>(
      `/amenities/${id}/availability?date=${encodeURIComponent(dateYYYYMMDD)}`,
      { method: 'GET' },
    );
    return adaptAvailability(raw);
  },

  async addFavorite(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/amenities/${id}/favorite`, {
      method: 'POST',
    });
  },

  async removeFavorite(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/amenities/${id}/favorite`, {
      method: 'DELETE',
    });
  },
};
