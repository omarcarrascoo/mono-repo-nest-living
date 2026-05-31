"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/app-residentes", label: "App residentes" },
  { href: "/app-administradores", label: "App admins" },
  { href: "/servicios", label: "Servicios" },
];

/**
 * Nav siempre claro (todas las páginas tienen hero sobre paper). Al hacer
 * scroll, añadimos backdrop blur + borde fino para sentir profundidad sin
 * cambiar el color base.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b text-editorial-ink transition-colors duration-300",
        scrolled
          ? "border-hairline bg-paper/85 backdrop-blur-md"
          : "border-transparent bg-paper/0",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Nest Living" className="block">
          <Logo variant="dark" width={104} />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-underline text-sm font-medium text-editorial-soft transition-colors hover:text-editorial-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="btn-ink rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}
