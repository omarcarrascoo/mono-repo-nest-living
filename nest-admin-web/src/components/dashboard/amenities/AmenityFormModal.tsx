"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Amenity, AmenityStatus } from "@/types/api";
import { cn } from "@/lib/cn";

const STATUS_OPTS: { value: AmenityStatus; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "busy", label: "Ocupada" },
  { value: "maintenance", label: "Mantenimiento" },
];

export function AmenityFormModal({
  open,
  amenity,
  onClose,
  onSubmit,
}: {
  open: boolean;
  amenity: Amenity | null;
  onClose: () => void;
  onSubmit: (dto: Partial<Amenity>) => Promise<void>;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={amenity ? "Editar amenidad" : "Nueva amenidad"}
    >
      {open && (
        <AmenityForm
          key={amenity?.id ?? "new"}
          amenity={amenity}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function AmenityForm({
  amenity,
  onClose,
  onSubmit,
}: {
  amenity: Amenity | null;
  onClose: () => void;
  onSubmit: (dto: Partial<Amenity>) => Promise<void>;
}) {
  const [title, setTitle] = useState(amenity?.title ?? "");
  const [description, setDescription] = useState(amenity?.description ?? "");
  const [location, setLocation] = useState(amenity?.location ?? "");
  const [image, setImage] = useState<string | null>(amenity?.image ?? null);
  const [status, setStatus] = useState<AmenityStatus>(
    amenity?.status ?? "available",
  );
  const [capacity, setCapacity] = useState(
    amenity?.capacity ? String(amenity.capacity) : "",
  );
  const [rules, setRules] = useState(
    (amenity?.rules ?? []).join("\n"),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (title.trim().length < 2) {
      setError("El título debe tener al menos 2 caracteres.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dto: Partial<Amenity> = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        image: image ?? undefined,
        status,
        capacity: capacity ? Number(capacity) : undefined,
        rules: rules
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
      };
      await onSubmit(dto);
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos guardar la amenidad.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ImageUploader
        value={image}
        onChange={setImage}
        kind="amenity"
        label="Foto de la amenidad"
      />

      <Field label="Título">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Alberca techada"
          autoFocus
          className="input"
        />
      </Field>

      <Field label="Descripción" optional>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cómo es el espacio, qué se puede hacer en él…"
          rows={3}
          className="input resize-none py-3"
          style={{ height: "auto" }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ubicación" optional>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej. Torre A · piso 12"
            className="input"
          />
        </Field>
        <Field label="Capacidad" optional>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Ej. 20"
            className="input"
          />
        </Field>
      </div>

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

      <Field label="Reglas" optional>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          placeholder={"Una regla por línea\nEj. No se permiten mascotas\nUso máximo de 2 horas"}
          rows={4}
          className="input resize-none py-3"
          style={{ height: "auto" }}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Una regla por línea. Las verán tus residentes al reservar.
        </p>
      </Field>

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
          ) : amenity ? (
            "Guardar cambios"
          ) : (
            "Crear amenidad"
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
