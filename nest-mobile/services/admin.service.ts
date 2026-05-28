import { apiFetch } from '@/lib/api/client';
import {
  AdminListReservationsParams,
  AdminListReservationsResponse,
  AdminReservationStats,
  Amenity,
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
  DirectoryUser,
  Order,
  OrderListFilter,
  OrderStatus,
  Product,
  ProductCategory,
} from '@/types/api';
import {
  adaptAdminReservation,
  adaptAmenity,
  adaptDirectoryUser,
  adaptOrder,
  adaptProduct,
  adaptProductCategory,
} from './adapters';

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `?${qs}`;
}

export const adminService = {
  // ----- Notifications -----
  async broadcast(
    payload: BroadcastNotificationRequest,
  ): Promise<BroadcastNotificationResponse> {
    return apiFetch<BroadcastNotificationResponse>('/notifications/broadcast', {
      method: 'POST',
      body: payload,
    });
  },

  // ----- Users directory (picker for broadcast/user audience) -----
  async listUsers(q?: string): Promise<DirectoryUser[]> {
    const qs = buildQuery({ q });
    const raw = await apiFetch<any[]>(`/users/directory${qs}`);
    return Array.isArray(raw) ? raw.map(adaptDirectoryUser) : [];
  },

  // ----- Reservations -----
  async listReservations(
    params: AdminListReservationsParams = {},
  ): Promise<AdminListReservationsResponse> {
    const qs = buildQuery({
      filter: params.filter,
      userId: params.userId,
      amenityId: params.amenityId,
      cursor: params.cursor,
      limit: params.limit ? String(params.limit) : undefined,
    });
    const raw = await apiFetch<any>(`/reservations/admin/all${qs}`);
    return {
      items: Array.isArray(raw?.items) ? raw.items.map(adaptAdminReservation) : [],
      nextCursor: raw?.nextCursor ?? null,
    };
  },

  /**
   * Admin cancela cualquier reserva de la residencia. Reusa `DELETE
   * /reservations/:id`, que ya acepta admin override.
   */
  async cancelReservation(id: string) {
    const raw = await apiFetch<any>(`/reservations/${id}`, { method: 'DELETE' });
    return adaptAdminReservation(raw);
  },

  async getReservationStats(): Promise<AdminReservationStats> {
    const raw = await apiFetch<any>('/reservations/admin/stats');
    const totals = raw?.totals ?? {};
    const top = Array.isArray(raw?.topAmenities) ? raw.topAmenities : [];
    const hourOccupancyRaw = Array.isArray(raw?.hourOccupancy) ? raw.hourOccupancy : [];
    const hourOccupancy = Array.from({ length: 24 }, (_, i) =>
      typeof hourOccupancyRaw[i] === 'number' ? hourOccupancyRaw[i] : 0,
    );
    return {
      totals: {
        today: Number(totals.today ?? 0),
        week: Number(totals.week ?? 0),
        month: Number(totals.month ?? 0),
      },
      topAmenities: top.map((t: any) => ({
        amenityId: String(t.amenityId ?? t._id ?? ''),
        count: Number(t.count ?? 0),
        title: t.title ?? null,
      })),
      cancellationRate: Number(raw?.cancellationRate ?? 0),
      hourOccupancy,
    };
  },

  // ----- Amenities CRUD (admin) -----
  async createAmenity(payload: Partial<Amenity>): Promise<Amenity> {
    const raw = await apiFetch<any>('/amenities', {
      method: 'POST',
      body: payload,
    });
    return adaptAmenity(raw);
  },

  async updateAmenity(id: string, payload: Partial<Amenity>): Promise<Amenity> {
    const raw = await apiFetch<any>(`/amenities/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return adaptAmenity(raw);
  },

  async deleteAmenity(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/amenities/${id}`, { method: 'DELETE' });
  },

  // ----- Delivery products CRUD (admin) -----
  async createProduct(payload: Partial<Product>): Promise<Product> {
    const raw = await apiFetch<any>('/delivery/products', {
      method: 'POST',
      body: payload,
    });
    return adaptProduct(raw);
  },

  async updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
    const raw = await apiFetch<any>(`/delivery/products/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return adaptProduct(raw);
  },

  async deleteProduct(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/delivery/products/${id}`, {
      method: 'DELETE',
    });
  },

  // ----- Delivery product categories CRUD (admin) -----
  async listProductCategories(): Promise<ProductCategory[]> {
    const raw = await apiFetch<any[]>('/delivery/categories');
    return Array.isArray(raw) ? raw.map(adaptProductCategory) : [];
  },

  async createProductCategory(
    payload: Partial<ProductCategory>,
  ): Promise<ProductCategory> {
    const raw = await apiFetch<any>('/delivery/categories', {
      method: 'POST',
      body: payload,
    });
    return adaptProductCategory(raw);
  },

  async updateProductCategory(
    id: string,
    payload: Partial<ProductCategory>,
  ): Promise<ProductCategory> {
    const raw = await apiFetch<any>(`/delivery/categories/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return adaptProductCategory(raw);
  },

  async deleteProductCategory(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/delivery/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // ----- Orders staff list + status update -----
  async listOrders(opts: {
    status?: OrderStatus;
    filter?: OrderListFilter;
    userId?: string;
  } = {}): Promise<Order[]> {
    const qs = buildQuery({
      status: opts.status,
      filter: opts.filter,
      userId: opts.userId,
    });
    const raw = await apiFetch<any[]>(`/delivery/orders${qs}`);
    return Array.isArray(raw) ? raw.map(adaptOrder) : [];
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<Order> {
    const raw = await apiFetch<any>(`/delivery/orders/${id}/status`, {
      method: 'PATCH',
      body: { status, ...(note ? { note } : {}) },
    });
    return adaptOrder(raw);
  },
};
