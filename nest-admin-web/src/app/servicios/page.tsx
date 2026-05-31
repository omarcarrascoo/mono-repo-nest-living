import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LandingNav } from "@/components/marketing/LandingNav";
import { Logo } from "@/components/ui/Logo";
import { SERVICES } from "@/content/services";

export const metadata: Metadata = {
  title: "Servicios — Nest Living",
  description:
    "Conoce los seis servicios de Nest Living: residentes, amenidades, finanzas, mantenimiento, comunidad y delivery. La plataforma completa para administrar tu comunidad residencial.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    type: "website",
    title: "Servicios — Nest Living",
    description:
      "Seis servicios diseñados para que la administración residencial deje de ser una pesadilla.",
    url: "/servicios",
  },
};

export default function ServiciosHub() {
  return (
    <div className="min-h-screen bg-paper text-editorial-ink">
      <LandingNav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pt-36 pb-12 md:pt-44">
        <p className="eyebrow">Catálogo de servicios</p>
        <h1 className="font-display mt-6 max-w-5xl text-[2.7rem] leading-[1.02] md:text-[6rem] md:leading-[0.98]">
          Seis servicios. <em className="italic text-teal-dark">Una sola</em> plataforma.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-editorial-soft md:text-xl">
          Cada módulo de Nest Living resuelve algo concreto que hoy se hace mal,
          a mano o con herramientas que no fueron pensadas para una comunidad.
          Aquí están todos.
        </p>
      </section>

      {/* SUMARIO */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-px overflow-hidden rounded-sm border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Link
              key={s.slug}
              href={`/servicios/${s.slug}`}
              className="group block bg-paper p-7 transition-colors hover:bg-paper-2/60"
            >
              <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-sm bg-paper-2">
                <Image
                  src={s.heroImage}
                  alt={s.heroImageAlt}
                  fill
                  sizes="(max-width: 768px) 90vw, 360px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="eyebrow">
                Servicio · {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="font-display mt-3 text-2xl leading-tight text-editorial-ink md:text-3xl">
                {s.name}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-editorial-soft">
                {s.summary}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-dark">
                Ver servicio
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center">
          <p className="eyebrow">¿Listo para verlo en acción?</p>
          <h2 className="font-display mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] md:text-[4rem] md:leading-[0.98]">
            Tu comunidad merece estar bien administrada.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn-ink inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold"
            >
              Empieza con Nest Living
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/"
              className="link-underline text-base font-semibold text-editorial-ink"
            >
              Volver al inicio
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
            href="/login"
            className="link-underline text-sm font-semibold text-editorial-ink"
          >
            Iniciar sesión →
          </Link>
        </div>
      </footer>
    </div>
  );
}
