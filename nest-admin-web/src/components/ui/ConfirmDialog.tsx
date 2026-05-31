"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./primitives";

/**
 * Diálogo de confirmación para acciones destructivas (rechazar, quitar).
 * `onConfirm` puede ser async; muestra spinner mientras resuelve.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-[15px] leading-relaxed text-ink-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={handle}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
