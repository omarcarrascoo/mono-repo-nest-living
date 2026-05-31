import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav } from "@/components/marketing/LandingNav";
import { StoreBadge } from "@/components/marketing/StoreBadge";
import { AppFeatureSection } from "@/components/marketing/AppFeatureSection";
import { Logo } from "@/components/ui/Logo";
import { RESIDENT_SECTIONS } from "@/content/app-pages";

const APPSTORE_URL = "https://apps.apple.com/search?term=nest%20living";
const PLAYSTORE_URL =
  "https://play.google.com/store/search?q=nest%20living&c=apps";

export const metadata: Metadata = {
  title: "App para residentes — Nest Living",
  description:
    "Reservas, comunidad, pagos y delivery para tus residentes. Una app móvil pensada para que la vida en comunidad sea más simple. Disponible en iOS y Android.",
  alternates: { canonical: "/app-residentes" },
  openGraph: {
    type: "website",
    title: "App para residentes — Nest Living",
    description:
      "La app móvil que tus residentes van a abrir todos los días. Reservas, comunidad, pagos y delivery — en un solo lugar.",
    url: "/app-residentes",
    images: [
      {
        url: "/screenshots/home-explora.png",
        width: 496,
        height: 963,
        alt: "App para residentes de Nest Living",
      },
    ],
  },
};

export default function AppResidentesPage() {
  return (
    <div className="min-h-screen bg-paper text-editorial-ink">
      <LandingNav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-36 md:pt-44">
        <p className="eyebrow">App móvil · iOS y Android</p>
        <h1 className="font-display mt-6 max-w-5xl text-[2.7rem] leading-[1.02] md:text-[6rem] md:leading-[0.98]">
          La app que tus residentes{" "}
          <em className="italic text-teal-dark">van a abrir todos los días.</em>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-editorial-soft md:text-xl">
          Reservas, comunidad, pagos y delivery — cada pantalla pensada para
          que la vida en comunidad sea más simple. Aquí cómo se ve, una
          pantalla a la vez.
        </p>

        {/* Badges + atajo a admin */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <StoreBadge store="appstore" href={APPSTORE_URL} variant="dark" />
          <StoreBadge
            store="playstore"
            href={PLAYSTORE_URL}
            variant="dark"
          />
          <Link
            href="/app-administradores"
            className="link-underline text-sm font-semibold text-editorial-ink"
          >
            Conoce la app de administradores →
          </Link>
        </div>
      </section>

      {/* 12 SECCIONES — UNA POR PANTALLA */}
      <div className="border-t border-hairline">
        {RESIDENT_SECTIONS.map((section, i) => (
          <AppFeatureSection
            key={section.imageSrc ?? section.title}
            index={i}
            frame="phone"
            {...section}
          />
        ))}
      </div>

      {/* CTA FINAL */}
      <section className="bg-paper-2/40">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center">
          <p className="eyebrow">Lleva Nest Living a tu comunidad</p>
          <h2 className="font-display mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] md:text-[4rem] md:leading-[0.98]">
            Tus residentes, listos en{" "}
            <em className="italic text-teal-dark">una descarga.</em>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <StoreBadge store="appstore" href={APPSTORE_URL} variant="dark" />
            <StoreBadge
              store="playstore"
              href={PLAYSTORE_URL}
              variant="dark"
            />
          </div>
          <div className="mt-8">
            <Link
              href="/login"
              className="link-underline text-base font-semibold text-editorial-ink"
            >
              Iniciar sesión como administrador →
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
