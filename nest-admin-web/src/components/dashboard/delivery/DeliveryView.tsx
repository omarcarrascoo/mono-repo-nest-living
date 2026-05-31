"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import {
  Loader2,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TabNav, TabItem } from "@/components/ui/TabNav";
import { ProductFormModal } from "./ProductFormModal";
import { CategoryFormModal } from "./CategoryFormModal";
import { OrdersTab } from "./OrdersTab";
import {
  Product,
  ProductCategory,
  ProductStatus,
} from "@/types/api";
import { deliveryService } from "@/services/delivery.service";
import { useAsyncData } from "@/hooks/use-async-data";
import { formatMxn } from "@/lib/currency";

type Tab = "products" | "categories" | "orders";

const TABS: TabItem<Tab>[] = [
  { key: "products", label: "Productos" },
  { key: "categories", label: "Categorías" },
  { key: "orders", label: "Órdenes" },
];

export function DeliveryView() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow">Cocina y comercio</p>
        <h2 className="font-display mt-3 text-3xl leading-tight text-editorial-ink md:text-[2.6rem]">
          Delivery <em className="italic text-teal-dark">interno</em>
        </h2>
        <p className="mt-3 max-w-md text-sm text-editorial-soft">
          Catálogo y operación de la cocina o comercio de tu club.
        </p>
      </div>

      <TabNav items={TABS} active={tab} onChange={setTab} />

      {tab === "products" && <ProductsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "orders" && <OrdersTab />}
    </div>
  );
}

/* ============================ PRODUCTS ============================ */

const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  available: "Disponible",
  sold_out: "Agotado",
  hidden: "Oculto",
};

const PRODUCT_STATUS_TONE: Record<
  ProductStatus,
  "ok" | "warn" | "danger" | "neutral"
> = {
  available: "ok",
  sold_out: "warn",
  hidden: "neutral",
};

function ProductsTab() {
  const fetchProducts = useCallback(() => deliveryService.listProducts(), []);
  const fetchCategories = useCallback(
    () => deliveryService.listCategories(),
    [],
  );
  const productsState = useAsyncData<Product[]>(fetchProducts);
  const categoriesState = useAsyncData<ProductCategory[]>(fetchCategories);

  const products = productsState.data ?? [];
  const categories = categoriesState.data ?? [];
  const catName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Sin categoría";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [removing, setRemoving] = useState<Product | null>(null);

  async function handleSubmit(dto: Partial<Product>) {
    if (editing) {
      await deliveryService.updateProduct(editing.id, dto);
    } else {
      await deliveryService.createProduct(dto);
    }
    productsState.reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      {productsState.loading && products.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aún no hay productos"
          description="Crea el primer producto del catálogo de tu club."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              <div className="relative aspect-[16/10] bg-canvas">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-soft">
                    <Package className="h-10 w-10" />
                  </div>
                )}
                <span className="absolute right-3 top-3">
                  <Badge tone={PRODUCT_STATUS_TONE[p.status]}>
                    {PRODUCT_STATUS_LABEL[p.status]}
                  </Badge>
                </span>
                {p.featured && (
                  <span className="absolute left-3 top-3">
                    <Badge tone="teal">Destacado</Badge>
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="truncate font-bold text-ink">{p.name}</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  {catName(p.categoryId)}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-ink">
                    {formatMxn(p.price)}
                  </span>
                  {p.originalPrice && (
                    <span className="text-sm text-ink-soft line-through">
                      {formatMxn(p.originalPrice)}
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    className="flex-1 px-3 py-2 text-xs"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setRemoving(p)}
                    className="px-2.5 py-2 text-red-600 hover:bg-red-50"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        product={editing}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            await deliveryService.removeProduct(removing.id);
            productsState.reload();
          }
        }}
        title="Eliminar producto"
        message={`Vas a eliminar "${removing?.name}". Las órdenes pasadas no se afectan, pero los residentes ya no podrán pedirlo.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}

/* ============================ CATEGORIES ============================ */

function CategoriesTab() {
  const fetch = useCallback(() => deliveryService.listCategories(), []);
  const { data, loading, reload } = useAsyncData<ProductCategory[]>(fetch);
  const categories = data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [removing, setRemoving] = useState<ProductCategory | null>(null);

  async function handleSubmit(dto: Partial<ProductCategory>) {
    if (editing) {
      await deliveryService.updateCategory(editing.id, dto);
    } else {
      await deliveryService.createCategory(dto);
    }
    reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Aún no hay categorías"
          description="Las categorías agrupan los productos del menú."
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/[0.10] text-teal-dark">
                  <Tag className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    /{c.slug}
                    {typeof c.productCount === "number" &&
                      ` · ${c.productCount} producto${c.productCount === 1 ? "" : "s"}`}
                  </p>
                </div>
                {!c.active && <Badge tone="neutral">Inactiva</Badge>}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                  className="px-3 py-2"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setRemoving(c)}
                  className="px-2.5 py-2 text-red-600 hover:bg-red-50"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <CategoryFormModal
        open={formOpen}
        category={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            await deliveryService.removeCategory(removing.id);
            reload();
          }
        }}
        title="Eliminar categoría"
        message={`Vas a eliminar la categoría "${removing?.name}". Asegúrate de que no tenga productos asociados.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
