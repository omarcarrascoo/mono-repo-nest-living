"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
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
 *
 * Mobile: el menú principal se oculta y aparece un botón hamburger que
 * abre un drawer fullscreen con los links + el CTA. Cierra al navegar o
 * al hacer Esc.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar con Escape + bloquear scroll del body cuando está abierto.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b text-editorial-ink transition-colors duration-300",
          scrolled || mobileOpen
            ? "border-hairline bg-paper/85 backdrop-blur-md"
            : "border-transparent bg-paper/0",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            aria-label="Nest Living"
            className="block"
            onClick={() => setMobileOpen(false)}
          >
            <Logo variant="dark" width={104} />
          </Link>

          {/* ---- Nav inline en desktop ---- */}
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

          {/* ---- CTA + hamburger ---- */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="btn-ink hidden rounded-full px-5 py-2.5 text-sm font-semibold sm:inline-flex"
            >
              Iniciar sesión
            </Link>

            {/* Botón hamburger — solo mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-editorial-ink transition-colors hover:bg-paper-2 md:hidden"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ---- Drawer fullscreen mobile ---- */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-paper md:hidden"
          // Padding-top reserva la altura del header para que no quede
          // tapado por la navbar fija.
          style={{ paddingTop: "4.5rem" }}
        >
          <div className="flex h-full flex-col">
            <nav className="flex flex-col px-5">
              {LINKS.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-display flex items-baseline gap-4 border-b border-hairline py-5 text-3xl text-editorial-ink"
                >
                  <span className="index-num text-base text-teal-dark">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* CTA grande al fondo del drawer */}
            <div className="mt-auto px-5 pb-10">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-ink flex w-full items-center justify-center rounded-full py-4 text-base font-semibold"
              >
                Iniciar sesión
              </Link>
              <p className="mt-4 text-center text-xs text-editorial-soft">
                Acceso solo para administradores de club.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
