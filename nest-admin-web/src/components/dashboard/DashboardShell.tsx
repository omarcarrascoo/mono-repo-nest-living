"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ShieldAlert, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/cn";

/**
 * Cascarón de todas las pantallas del dashboard. Resuelve el guard y los tres
 * estados visibles: cargando, sin permisos de admin, y contenido.
 *
 * `requireAdmin` (default true) exige rol admin / super_admin; pásalo en false
 * para pantallas que cualquier sesión autenticada puede ver.
 */
export function DashboardShell({
  title,
  children,
  requireAdmin = true,
}: {
  title: string;
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { ready, isAdmin } = useRequireAdmin(
    requireAdmin ? "admin" : "authenticated",
  );
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cargando sesión / redirigiendo a login.
  if (!hydrated || status === "loading" || status === "idle") {
    return <FullScreenLoader />;
  }

  if (status === "authenticated" && requireAdmin && !isAdmin) {
    return <NoAccess />;
  }

  if (!ready) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex min-h-screen bg-paper text-editorial-ink">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-hairline bg-paper-2/50 lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-editorial-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-paper-2/95 shadow-2xl backdrop-blur">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-editorial-soft hover:bg-paper"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
    </div>
  );
}

function NoAccess() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 text-editorial-ink">
      <div className="w-full max-w-md border border-hairline bg-paper-2/40 p-10 text-center">
        <p className="eyebrow">Acceso restringido</p>
        <span className="font-display mt-4 inline-block text-amber-700/70">
          <ShieldAlert className="h-9 w-9" />
        </span>
        <h1 className="font-display mt-3 text-3xl leading-tight md:text-4xl">
          Tu cuenta no tiene acceso{" "}
          <em className="italic text-teal-dark">de administrador</em>.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-editorial-soft">
          Iniciaste sesión como{" "}
          <strong className="font-semibold text-editorial-ink">
            {user?.fullName}
          </strong>
          , pero esta consola es solo para administradores de club. Si crees
          que es un error, pide a tu super administrador que te asigne el rol.
        </p>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className={cn(
            "mt-7 inline-flex items-center justify-center gap-2 border border-hairline px-5 py-3",
            "text-sm font-semibold text-editorial-ink transition-colors hover:bg-paper-2",
          )}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
