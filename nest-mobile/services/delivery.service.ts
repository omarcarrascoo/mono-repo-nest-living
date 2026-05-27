import { apiFetch } from '@/lib/api/client';
import {
  CreateOrderRequest,
  FeaturedProduct,
  ListProductsParams,
  Order,
  OrderListFilter,
  Product,
  ProductCategory,
} from '@/types/api';
import {
  adaptFeaturedProduct,
  adaptOrder,
  adaptProduct,
  adaptProductCategory,
} from './adapters';

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `?${qs}`;
}

export const deliveryService = {
  async listCategories(): Promise<ProductCategory[]> {
    const raw = await apiFetch<any[]>('/delivery/categories');
    return Array.isArray(raw) ? raw.map(adaptProductCategory) : [];
  },

  async listProducts(params: ListProductsParams = {}): Promise<Product[]> {
    const qs = buildQuery({
      q: params.q,
      category: params.category,
      status: params.status,
      featured: params.featured === undefined ? undefined : String(params.featured),
    });
    const raw = await apiFetch<{ items: any[] } | any[]>(`/delivery/products${qs}`);
    const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return items.map(adaptProduct);
  },

  async getProduct(id: string): Promise<Product> {
    const raw = await apiFetch<any>(`/delivery/products/${id}`);
    return adaptProduct(raw);
  },

  async getFeaturedOfDay(): Promise<FeaturedProduct | null> {
    try {
      const raw = await apiFetch<any>('/delivery/products/featured');
      if (!raw || !raw.product) return null;
      return adaptFeaturedProduct(raw);
    } catch {
      return null;
    }
  },

  async createOrder(payload: CreateOrderRequest): Promise<Order> {
    const raw = await apiFetch<any>('/delivery/orders', {
      method: 'POST',
      body: payload,
    });
    return adaptOrder(raw);
  },

  async listMyOrders(filter: OrderListFilter = 'all'): Promise<Order[]> {
    const qs = buildQuery({ filter });
    const raw = await apiFetch<any[]>(`/delivery/orders/me${qs}`);
    return Array.isArray(raw) ? raw.map(adaptOrder) : [];
  },

  async getOrder(id: string): Promise<Order> {
    const raw = await apiFetch<any>(`/delivery/orders/${id}`);
    return adaptOrder(raw);
  },
};
