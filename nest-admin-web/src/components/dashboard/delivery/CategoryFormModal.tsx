"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { ProductCategory } from "@/types/api";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function CategoryFormModal({
  open,
  category,
  onClose,
  onSubmit,
}: {
  open: boolean;
  category: ProductCategory | null;
  onClose: () => void;
  onSubmit: (dto: Partial<ProductCategory>) => Promise<void>;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Editar categoría" : "Nueva categoría"}
    >
      {open && (
        <CategoryForm
          key={category?.id ?? "new"}
          category={category}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function CategoryForm({
  category,
  onClose,
  onSubmit,
}: {
  category: ProductCategory | null;
  onClose: () => void;
  onSubmit: (dto: Partial<ProductCategory>) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "package");
  const [active, setActive] = useState(category?.active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        icon: icon.trim() || "package",
        active,
      });
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos guardar la categoría.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Nombre
        </label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!category) setSlug(slugify(e.target.value));
          }}
          placeholder="Ej. Pizzas, Bebidas, Postres"
          autoFocus
          className="input"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Slug
        </label>
        <input
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder="se genera del nombre"
          className="input font-mono text-sm"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Identificador URL-friendly. Solo letras minúsculas, números y guiones.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Icono <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="ej. pizza, coffee, package"
          className="input"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded accent-teal-700"
        />
        <span className="text-sm font-semibold text-ink">
          Categoría activa (visible para los residentes)
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
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : category ? (
            "Guardar cambios"
          ) : (
            "Crear categoría"
          )}
        </Button>
      </div>
    </div>
  );
}
