"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  LayoutDashboard,
  LayoutGrid,
  MessageSquareHeart,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ClubSwitcher } from "./ClubSwitcher";
import { selectIsSuperAdmin, useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  soon?: boolean;
  superAdmin?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/residents", label: "Residentes", icon: Users },
  { href: "/dashboard/amenities", label: "Amenidades", icon: LayoutGrid },
  { href: "/dashboard/reservations", label: "Reservas", icon: CalendarCheck },
  { href: "/dashboard/delivery", label: "Delivery", icon: ShoppingBag },
  { href: "/dashboard/community", label: "Comunidad", icon: MessageSquareHeart },
];

/**
 * Sidebar editorial. Detalles intencionales:
 *   - El logo real va arriba a un tamaño cómodo de leer.
 *   - Las secciones del menú se separan con un kicker en versalitas y una
 *     guía fina, no con cuadros / badges pesados.
 *   - El item activo se marca con una guía vertical teal a la izquierda
 *     (más editorial que un fondo lleno).
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);

  return (
    <div className="flex h-full flex-col gap-7 p-5">
      {/* Marca */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="block px-1 pt-2"
        aria-label="Nest Living"
      >
        <Logo variant="dark" width={104} />
      </Link>

      <ClubSwitcher />

      {/* Navegación */}
      <nav className="flex-1 space-y-0.5">
        <SectionLabel>Administración</SectionLabel>
        {NAV.map((item, idx) => (
          <NavLink
            key={item.href}
            item={item}
            num={idx + 1}
            active={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
            onNavigate={onNavigate}
          />
        ))}

        {isSuperAdmin && (
          <>
            <div className="pt-6">
              <SectionLabel>Plataforma</SectionLabel>
            </div>
            <NavLink
              item={{
                href: "/dashboard/clubs",
                label: "Clubs",
                icon: Building2,
                superAdmin: true,
              }}
              num={NAV.length + 1}
              active={pathname.startsWith("/dashboard/clubs")}
              onNavigate={onNavigate}
            />
          </>
        )}
      </nav>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow flex items-center gap-3 px-3 pb-3 pt-2 text-[10px]">
      <span>{children}</span>
      <span className="h-px flex-1 bg-hairline" />
    </p>
  );
}

function NavLink({
  item,
  num,
  active,
  onNavigate,
}: {
  item: NavItem;
  num: number;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <>
      {/* Guía vertical que aparece cuando el item está activo */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 transition-colors",
          active ? "bg-teal-dark" : "bg-transparent",
        )}
      />
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.superAdmin && (
        <span className="font-display text-xs italic text-teal-dark">
          super
        </span>
      )}
      <span
        className={cn(
          "index-num text-xs tabular-nums opacity-0 transition-opacity",
          active && "opacity-60",
        )}
        aria-hidden
      >
        {String(num).padStart(2, "0")}
      </span>
    </>
  );

  if (item.soon) {
    return (
      <span
        className="relative flex cursor-not-allowed items-center gap-3 px-3 py-2.5 text-sm font-medium text-editorial-soft/60"
        title="Próximamente"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "text-editorial-ink"
          : "text-editorial-soft hover:text-editorial-ink",
      )}
    >
      {content}
    </Link>
  );
}
