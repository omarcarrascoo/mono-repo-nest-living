"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Club, ClubPrivacy, CreateClubRequest } from "@/types/api";
import { cn } from "@/lib/cn";

type ClubDto = CreateClubRequest & { joinCode?: string };

/**
 * Crea o edita un club. Si `club` viene, es edición (PATCH); si es null, es
 * creación (POST). El form interno se monta con `key` para tomar el estado
 * inicial de props sin un effect (regla react-hooks/set-state-in-effect).
 */
export function ClubFormModal({
  open,
  club,
  onClose,
  onSubmit,
}: {
  open: boolean;
  club: Club | null;
  onClose: () => void;
  onSubmit: (dto: ClubDto) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title={club ? "Editar club" : "Nuevo club"}>
      {open && (
        <ClubForm
          key={club?.id ?? "new"}
          club={club}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function ClubForm({
  club,
  onClose,
  onSubmit,
}: {
  club: Club | null;
  onClose: () => void;
  onSubmit: (dto: ClubDto) => Promise<void>;
}) {
  const isEdit = club !== null;

  const [name, setName] = useState(club?.name ?? "");
  const [description, setDescription] = useState(club?.description ?? "");
  const [privacy, setPrivacy] = useState<ClubPrivacy>(club?.privacy ?? "public");
  const [joinCode, setJoinCode] = useState(club?.joinCode ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dto: ClubDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        privacy,
      };
      if (isEdit && joinCode.trim()) dto.joinCode = joinCode.trim();
      await onSubmit(dto);
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos guardar el club.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Nombre del club">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Residencial Las Palmas"
          autoFocus
          className="input"
        />
      </Field>

      <Field label="Descripción" optional>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Una línea sobre la comunidad…"
          rows={3}
          className="input resize-none py-3"
          style={{ height: "auto" }}
        />
      </Field>

      <Field label="Privacidad">
        <div className="grid grid-cols-2 gap-2">
          {(["public", "private"] as ClubPrivacy[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrivacy(p)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                privacy === p
                  ? "border-teal bg-teal/[0.08] text-teal-dark"
                  : "border-line text-ink-soft hover:bg-canvas",
              )}
            >
              {p === "public" ? "Pública" : "Privada"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-soft">
          {privacy === "public"
            ? "Al unirse con el código, los miembros quedan activos al instante."
            : "Las solicitudes quedan pendientes hasta que un admin las aprueba."}
        </p>
      </Field>

      {isEdit ? (
        <Field label="Código de acceso (joinCode)">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="4-16 caracteres alfanuméricos"
            className="input font-mono tracking-wider"
          />
        </Field>
      ) : (
        <p className="rounded-xl bg-canvas px-4 py-3 text-xs text-ink-soft">
          El código de acceso se generará automáticamente. Podrás verlo y
          editarlo después de crear el club.
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            "Guardar cambios"
          ) : (
            "Crear club"
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
