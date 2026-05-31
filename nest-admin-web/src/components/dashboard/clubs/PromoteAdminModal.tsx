"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Club } from "@/types/api";

/**
 * Promueve a un usuario existente como admin de un club. El backend recibe el
 * `userId` (ObjectId de Mongo). No hay endpoint para buscar usuarios globales,
 * así que se pega el ID directamente — flujo pensado para el super admin que ya
 * lo conoce (p.ej. del registro en la app).
 */
export function PromoteAdminModal({
  open,
  club,
  onClose,
  onSubmit,
}: {
  open: boolean;
  club: Club | null;
  onClose: () => void;
  onSubmit: (clubId: string, userId: string) => Promise<void>;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Promover administrador">
      {open && club && (
        <PromoteForm
          key={club.id}
          club={club}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function PromoteForm({
  club,
  onClose,
  onSubmit,
}: {
  club: Club;
  onClose: () => void;
  onSubmit: (clubId: string, userId: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!userId.trim()) {
      setError("Pega el ID del usuario.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(club.id, userId.trim());
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos promover al usuario.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Asigna a un usuario como{" "}
        <strong className="font-semibold text-ink">administrador</strong> de{" "}
        <strong className="font-semibold text-ink">{club.name}</strong>. El
        usuario debe tener una cuenta en NestQuest.
      </p>

      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          ID del usuario
        </label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Ej. 665f1a2b3c4d5e6f7a8b9c0d"
          autoFocus
          className="input font-mono text-sm"
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          Es el identificador de Mongo del usuario. Quedará activo como admin de
          inmediato.
        </p>
      </div>

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
          ) : (
            "Promover a admin"
          )}
        </Button>
      </div>
    </div>
  );
}
