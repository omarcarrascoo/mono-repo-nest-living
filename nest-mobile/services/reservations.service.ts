import { apiFetch } from '@/lib/api/client';
import {
  CreateReservationRequest,
  ListReservationsResponse,
  Reservation,
  UpdateReservationRequest,
} from '@/types/api';
import { adaptReservation } from './adapters';

export interface ListReservationsParams {
  filter?: 'upcoming' | 'past' | 'cancelled' | 'all';
  cursor?: string;
  limit?: number;
}

function buildQuery(params: ListReservationsParams): string {
  const sp = new URLSearchParams();
  if (params.filter) sp.set('filter', params.filter);
  if (params.cursor) sp.set('cursor', params.cursor);
  if (params.limit) sp.set('limit', String(params.limit));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const reservationsService = {
  async create(payload: CreateReservationRequest): Promise<Reservation> {
    const raw = await apiFetch<any>('/reservations', {
      method: 'POST',
      body: payload,
    });
    return adaptReservation(raw);
  },

  async list(params: ListReservationsParams = {}): Promise<ListReservationsResponse> {
    const raw = await apiFetch<any>(`/reservations${buildQuery(params)}`, {
      method: 'GET',
    });
    return {
      items: Array.isArray(raw?.items) ? raw.items.map(adaptReservation) : [],
      nextCursor: raw?.nextCursor ?? null,
    };
  },

  async get(id: string): Promise<Reservation> {
    const raw = await apiFetch<any>(`/reservations/${id}`, { method: 'GET' });
    return adaptReservation(raw);
  },

  async update(id: string, payload: UpdateReservationRequest): Promise<Reservation> {
    const raw = await apiFetch<any>(`/reservations/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return adaptReservation(raw);
  },

  async cancel(id: string): Promise<Reservation> {
    const raw = await apiFetch<any>(`/reservations/${id}`, {
      method: 'DELETE',
    });
    return adaptReservation(raw);
  },
};
