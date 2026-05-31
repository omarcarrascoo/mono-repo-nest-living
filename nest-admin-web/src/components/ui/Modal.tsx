"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal centrado simple. Cierra con Escape o click en el backdrop. Sin portal
 * (basta para un dashboard); el contenido se monta sobre un overlay fijo.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center">
      <div
        className="fixed inset-0 bg-editorial-ink/45 backdrop-blur-sm"
        onClick={onClose}
      />
      {/*
       * Cap de altura al viewport con scroll interno: el header se queda
       * fijo arriba y el body es scrolleable. Sin esto, los formularios
       * largos (Amenidad, Producto) se cortaban arriba/abajo en pantallas
       * cortas — el modal heredaba la altura del contenido.
       */}
      <div className="relative z-10 flex max-h-[calc(100svh-4rem)] w-full max-w-md flex-col border border-hairline bg-paper shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-5">
          <h3 className="font-display text-xl tracking-tight text-editorial-ink">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-editorial-soft transition-colors hover:bg-paper-2"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
