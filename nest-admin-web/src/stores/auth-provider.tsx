"use client";

import { useEffect } from "react";
import { useAuthStore } from "./auth-store";

/**
 * Hidrata el auth-store en el primer render del cliente. Montado una sola vez
 * en el root layout. No bloquea el render (la landing es pública); las páginas
 * protegidas esperan a `hydrated` vía `useRequireAdmin`.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrate, hydrated]);

  return <>{children}</>;
}
