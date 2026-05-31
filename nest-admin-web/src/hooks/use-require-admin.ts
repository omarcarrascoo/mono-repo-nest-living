"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { selectIsAdmin, useAuthStore } from "@/stores/auth-store";

type Gate = "authenticated" | "admin";

interface RequireResult {
  ready: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Guard de cliente para las rutas del dashboard.
 *
 * - Espera a que el store hidrate (`hydrated`).
 * - Si no hay sesión → redirige a /login.
 * - `ready` es true solo cuando ya se puede renderizar contenido protegido.
 *
 * El gating fino por rol (mostrar/ocultar "sin permisos") lo decide la propia
 * pantalla con `isAdmin`, para poder enseñar una vista explicativa en vez de
 * un redirect abrupto. El backend valida el rol de todas formas.
 */
export function useRequireAdmin(gate: Gate = "authenticated"): RequireResult {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const isAdmin = useAuthStore(selectIsAdmin);
  const isSuperAdmin = useAuthStore((s) => s.user?.globalRole === "super_admin");

  useEffect(() => {
    if (!hydrated) return;
    if (status !== "authenticated") {
      router.replace("/login");
    }
  }, [hydrated, status, router]);

  const ready =
    hydrated &&
    status === "authenticated" &&
    (gate === "authenticated" || isAdmin);

  return { ready, isAdmin, isSuperAdmin };
}
