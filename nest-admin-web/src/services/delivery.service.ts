import { apiFetch } from "@/lib/api/client";
import {
  Order,
  OrderListFilter,
  OrderStatus,
  Product,
  ProductCategory,
} from "@/types/api";
import {
  adaptOrder,
  adaptProduct,
  adaptProductCategory,
} from "./adapters";

function buildQuery(p: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Servicio de delivery para staff. Cubre:
 *   - CRUD de productos y categorías (rol admin).
 *   - Listado y cambio de estado de órdenes (admin + kitchen_operator).
 *
 * El listado de productos del backend acepta `q`, `category`, `status` y
 * `featured`; lo dejamos abierto para reusarlo en filtros.
 */
export const deliveryService = {
  // ---- Categorías ----
  async listCategories(): Promise<ProductCategory[]> {
    const raw = await apiFetch<unknown[]>("/delivery/categories");
    return Array.isArray(raw)
      ? raw.map((c) => adaptProductCategory(c as Record<string, unknown>))
      : [];
  },
  async createCategory(payload: Partial<ProductCategory>): Promise<ProductCategory> {
    const raw = await apiFetch<Record<string, unknown>>("/delivery/categories", {
      method: "POST",
      body: payload,
    });
    return adaptProductCategory(raw);
  },
  async updateCategory(
    id: string,
    payload: Partial<ProductCategory>,
  ): Promise<ProductCategory> {
    const raw = await apiFetch<Record<string, unknown>>(
      `/delivery/categories/${id}`,
      { method: "PUT", body: payload },
    );
    return adaptProductCategory(raw);
  },
  async removeCategory(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/delivery/categories/${id}`, {
      method: "DELETE",
    });
  },

  // ---- Productos ----
  async listProducts(
    opts: { q?: string; category?: string; status?: string } = {},
  ): Promise<Product[]> {
    const qs = buildQuery({
      q: opts.q,
      category: opts.category,
      status: opts.status,
    });
    const raw = await apiFetch<unknown>(`/delivery/products${qs}`);
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { items?: unknown[] })?.items)
        ? (raw as { items: unknown[] }).items
        : [];
    return items.map((p) => adaptProduct(p as Record<string, unknown>));
  },
  async createProduct(payload: Partial<Product>): Promise<Product> {
    const raw = await apiFetch<Record<string, unknown>>("/delivery/products", {
      method: "POST",
      body: payload,
    });
    return adaptProduct(raw);
  },
  async updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
    const raw = await apiFetch<Record<string, unknown>>(
      `/delivery/products/${id}`,
      { method: "PUT", body: payload },
    );
    return adaptProduct(raw);
  },
  async removeProduct(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/delivery/products/${id}`, {
      method: "DELETE",
    });
  },

  // ---- Órdenes (staff) ----
  async listOrders(
    opts: {
      status?: OrderStatus;
      filter?: OrderListFilter;
      userId?: string;
    } = {},
  ): Promise<Order[]> {
    const qs = buildQuery({
      status: opts.status,
      filter: opts.filter,
      userId: opts.userId,
    });
    const raw = await apiFetch<unknown[]>(`/delivery/orders${qs}`);
    return Array.isArray(raw)
      ? raw.map((o) => adaptOrder(o as Record<string, unknown>))
      : [];
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<Order> {
    const raw = await apiFetch<Record<string, unknown>>(
      `/delivery/orders/${id}/status`,
      { method: "PATCH", body: { status, ...(note ? { note } : {}) } },
    );
    return adaptOrder(raw);
  },
};
