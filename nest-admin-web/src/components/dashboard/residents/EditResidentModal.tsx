"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/Avatar";
import { ClubMember, Role } from "@/types/api";
import { ROLE_LABELS } from "./badges";
import { cn } from "@/lib/cn";

const ASSIGNABLE_ROLES: Role[] = ["user", "admin", "kitchen_operator"];

export function EditResidentModal({
  member,
  onClose,
  onSave,
}: {
  member: ClubMember | null;
  onClose: () => void;
  onSave: (
    membershipId: string,
    dto: { role: Role; unitNumber: string | null },
  ) => Promise<void>;
}) {
  return (
    <Modal open={member !== null} onClose={onClose} title="Editar residente">
      {/* El form se monta fresco por `key` cada vez que cambia el miembro, así
          el estado inicial viene de props sin necesidad de un effect. */}
      {member && (
        <EditForm
          key={member.membershipId}
          member={member}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}

function EditForm({
  member,
  onClose,
  onSave,
}: {
  member: ClubMember;
  onClose: () => void;
  onSave: (
    membershipId: string,
    dto: { role: Role; unitNumber: string | null },
  ) => Promise<void>;
}) {
  const [role, setRole] = useState<Role>(member.role);
  const [unit, setUnit] = useState(member.unitNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(member.membershipId, {
        role,
        unitNumber: unit.trim() ? unit.trim() : null,
      });
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos guardar los cambios.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Avatar name={member.fullName} src={member.avatar} size={44} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{member.fullName}</p>
          <p className="truncate text-sm text-ink-soft">{member.email}</p>
        </div>
      </div>

      {/* Rol */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Rol en el club
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ASSIGNABLE_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
                role === r
                  ? "border-teal bg-teal/[0.08] text-teal-dark"
                  : "border-line text-ink-soft hover:bg-canvas",
              )}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Unidad */}
      <div>
        <label
          htmlFor="unit"
          className="mb-2 block text-sm font-semibold text-ink"
        >
          Número de unidad
        </label>
        <input
          id="unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Ej. 402, Torre B-12…"
          className="input"
        />
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
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  );
}
