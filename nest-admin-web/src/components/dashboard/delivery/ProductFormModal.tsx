"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Product, ProductCategory, ProductStatus } from "@/types/api";
import { cn } from "@/lib/cn";

const STATUS_OPTS: { value: ProductStatus; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "sold_out", label: "Agotado" },
  { value: "hidden", label: "Oculto" },
];

export function ProductFormModal({
  open,
  product,
  categories,
  onClose,
  onSubmit,
}: {
  open: boolean;
  product: Product | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSubmit: (dto: Partial<Product>) => Promise<void>;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "Editar producto" : "Nuevo producto"}
    >
      {open && (
        <ProductForm
          key={product?.id ?? "new"}
          product={product}
          categories={categories}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSubmit: (dto: Partial<Product>) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  const [price, setPrice] = useState(
    product?.price ? String(product.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState(
    product?.originalPrice ? String(product.originalPrice) : "",
  );
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? "",
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "available",
  );
  const [prepTime, setPrepTime] = useState(product?.prepTime ?? "");
  const [featured, setFeatured] = useState(!!product?.featured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    if (!categoryId) {
      setError("Selecciona una categoría.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dto: Partial<Product> = {
        name: name.trim(),
        description: description.trim() || undefined,
        image: image ?? undefined,
        price: priceNum,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        categoryId,
        status,
        prepTime: prepTime.trim() || undefined,
        featured,
      };
      await onSubmit(dto);
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos guardar el producto.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ImageUploader
        value={image}
        onChange={setImage}
        kind="product"
        label="Foto del producto"
      />

      <Field label="Nombre">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Pizza margherita"
          autoFocus
          className="input"
        />
      </Field>

      <Field label="Descripción" optional>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ingredientes, características, porciones…"
          rows={3}
          className="input resize-none py-3"
          style={{ height: "auto" }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio (MXN)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="input"
          />
        </Field>
        <Field label="Precio anterior" optional>
          <input
            type="number"
            min={0}
            step="0.01"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="Para mostrar oferta"
            className="input"
          />
        </Field>
      </div>

      <Field label="Categoría">
        {categories.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No hay categorías. Crea una primero en la pestaña Categorías.
          </p>
        ) : (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Tiempo de preparación" optional>
        <input
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          placeholder="Ej. 20-30 min"
          className="input"
        />
      </Field>

      <Field label="Estado">
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
                status === s.value
                  ? "border-teal bg-teal/[0.08] text-teal-dark"
                  : "border-line text-ink-soft hover:bg-canvas",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4 rounded accent-teal-700"
        />
        <span className="text-sm font-semibold text-ink">
          Marcar como destacado del día
        </span>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || categories.length === 0}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : product ? (
            "Guardar cambios"
          ) : (
            "Crear producto"
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-ink-soft">(opcional)</span>
        )}
      </label>
      {children}
    </div>
  );
}
