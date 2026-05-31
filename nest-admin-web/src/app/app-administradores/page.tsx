import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingNav } from "@/components/marketing/LandingNav";
import { AppFeatureSection } from "@/components/marketing/AppFeatureSection";
import {
  AdminPanelPreview,
  type AdminPanelView,
} from "@/components/marketing/AdminPanelPreview";
import { Logo } from "@/components/ui/Logo";
import { ADMIN_SECTIONS } from "@/content/app-pages";

/**
 * Mapeo 1:1 entre el orden de ADMIN_SECTIONS y la `view` del mockup
 * desktop. Si reordenas las secciones, mueve también el array.
 */
const ADMIN_VIEWS: AdminPanelView[] = [
  "residents",
  "reservations",
  "amenities",
  "community",
  "products",
  "orders",
  "notifications",
];

export const metadata: Metadata = {
  title: "Portal web para administradores — Nest Living",
  description:
    "El portal web para administrar tu club. Aprueba residentes, gestiona amenidades, controla pedidos y manda anuncios oficiales desde cualquier navegador.",
  alternates: { canonical: "/app-administradores" },
  openGraph: {
    type: "website",
    title: "Portal web para administradores — Nest Living",
    description:
      "Aprueba residentes, gestiona amenidades y reservas, controla pedidos y manda anuncios — desde cualquier navegador.",
    url: "/app-administradores",
  },
};

export default function AppAdministradoresPage() {
  return (
    <div className="min-h-screen bg-paper text-editorial-ink">
      <LandingNav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-36 md:pt-44">
        <p className="eyebrow">Portal web · navegador</p>
        <h1 className="font-display mt-6 max-w-5xl text-[2.7rem] leading-[1.02] md:text-[6rem] md:leading-[0.98]">
          La consola para{" "}
          <em className="italic text-teal-dark">
            administrar tu comunidad.
          </em>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-editorial-soft md:text-xl">
          Aprueba residentes, gestiona amenidades, controla pedidos y manda
          anuncios oficiales — todo desde el navegador. Sin instalar nada,
          desde cualquier computadora.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="btn-ink group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold"
          >
            Iniciar sesión
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/app-residentes"
            className="link-underline text-sm font-semibold text-editorial-ink"
          >
            Conoce la app de residentes →
          </Link>
        </div>
      </section>

      {/* SECCIONES POR MÓDULO — cada una con su mockup DESKTOP REAL hecho
          con código (no screenshots). El mapping ADMIN_VIEWS[i] decide qué
          vista del panel se muestra al lado del copy. `frame="screen"` deja
          el grid 50/50 para que el mockup ancho respire. */}
      <div className="border-t border-hairline">
        {ADMIN_SECTIONS.map((section, i) => (
          <AppFeatureSection
            key={section.title}
            index={i}
            frame="screen"
            eyebrow={section.eyebrow}
            title={section.title}
            titleAccent={section.titleAccent}
            body={section.body}
            mockup={<AdminPanelPreview view={ADMIN_VIEWS[i]} />}
          />
        ))}
      </div>

      {/* CTA FINAL */}
      <section className="bg-paper-2/40">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center">
          <p className="eyebrow">Empieza hoy</p>
          <h2 className="font-display mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] md:text-[4rem] md:leading-[0.98]">
            Tu comunidad,{" "}
            <em className="italic text-teal-dark">bajo control.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-editorial-soft md:text-lg">
            Inicia sesión con tu cuenta de administrador y toma el control de
            tu club desde cualquier navegador.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn-ink inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold"
            >
              Entrar al portal
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/servicios"
              className="link-underline text-base font-semibold text-editorial-ink"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 md:flex-row">
          <Logo variant="dark" width={108} aria-label="Nest Living" />
          <p className="text-sm text-editorial-soft">
            © {new Date().getFullYear()} Nest Living
          </p>
          <Link
            href="/"
            className="link-underline text-sm font-semibold text-editorial-ink"
          >
            ← Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
