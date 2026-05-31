"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/auth-store";

export function Topbar({
  title,
  onOpenMenu,
}: {
  title: string;
  onOpenMenu: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.activeMembershipRole);
  const isSuperAdmin = useAuthStore((s) => s.user?.globalRole === "super_admin");
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const roleLabel = isSuperAdmin
    ? "Super administrador"
    : role === "admin"
      ? "Administrador"
      : role === "kitchen_operator"
        ? "Operador de cocina"
        : "Residente";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-hairline bg-paper/85 px-4 backdrop-blur md:px-10">
      <button
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-editorial-soft transition-colors hover:bg-paper-2 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="font-display flex-1 truncate text-xl tracking-tight text-editorial-ink md:text-2xl">
        {title}
      </h1>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 border border-hairline py-1 pl-1 pr-3 transition-colors hover:bg-paper-2"
        >
          <Avatar name={user?.fullName ?? "?"} src={user?.avatar} size={32} />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-semibold leading-tight text-editorial-ink">
              {user?.fullName ?? "—"}
            </span>
            <span className="block text-[11px] uppercase leading-tight tracking-wider text-editorial-soft">
              {roleLabel}
            </span>
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden border border-hairline bg-paper shadow-2xl shadow-black/10">
            <div className="border-b border-hairline px-4 py-4">
              <p className="eyebrow">Sesión activa</p>
              <p className="font-display mt-2 truncate text-lg leading-tight text-editorial-ink">
                {user?.fullName}
              </p>
              <p className="mt-1 truncate text-xs text-editorial-soft">
                {user?.email}
              </p>
              {isSuperAdmin && (
                <span className="font-display mt-3 inline-flex items-center gap-1.5 italic text-teal-dark">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Super administrador
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
