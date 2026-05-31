"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/cn";

/**
 * Selector de club activo. Solo lista las membresías **activas** (el JWT solo
 * puede apuntar a un club donde el user es miembro activo). Cambiar de club
 * re-emite el JWT vía switch-club y recarga los datos de las pantallas.
 */
export function ClubSwitcher() {
  const memberships = useAuthStore((s) => s.memberships);
  const activeClubId = useAuthStore((s) => s.activeClubId);
  const switchClub = useAuthStore((s) => s.switchClub);

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const active = memberships.filter((m) => m.status === "active");
  const current = memberships.find((m) => m.clubId === activeClubId);
  const currentName = current?.club?.name ?? "Sin club activo";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSwitch(clubId: string) {
    if (clubId === activeClubId) {
      setOpen(false);
      return;
    }
    setSwitching(clubId);
    try {
      await switchClub(clubId);
      // Recarga dura para que todas las pantallas re-fetcheen con el club nuevo.
      window.location.reload();
    } catch {
      setSwitching(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 border border-hairline bg-paper px-3 py-2.5 text-left transition-colors hover:bg-paper-2"
      >
        <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center border border-hairline text-base text-teal-dark">
          {currentName.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block text-[9px]">Club activo</span>
          <span className="font-display mt-0.5 block truncate text-base leading-tight text-editorial-ink">
            {currentName}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-editorial-soft" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden border border-hairline bg-paper shadow-2xl shadow-black/10">
          {active.length === 0 ? (
            <p className="px-3 py-3 text-sm text-editorial-soft">
              No tienes clubs activos.
            </p>
          ) : (
            active.map((m) => {
              const selected = m.clubId === activeClubId;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSwitch(m.clubId)}
                  disabled={switching !== null}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-hairline px-3 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-paper-2",
                    selected && "bg-paper-2/60",
                  )}
                >
                  <span className="font-display flex h-8 w-8 shrink-0 items-center justify-center border border-hairline text-sm text-teal-dark">
                    {(m.club?.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-editorial-ink">
                      {m.club?.name ?? "Club"}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wider text-editorial-soft">
                      {m.role === "admin"
                        ? "Administrador"
                        : m.role === "kitchen_operator"
                          ? "Operador"
                          : "Residente"}
                    </span>
                  </span>
                  {switching === m.clubId ? (
                    <Loader2 className="h-4 w-4 animate-spin text-teal-dark" />
                  ) : selected ? (
                    <Check className="h-4 w-4 text-teal-dark" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
