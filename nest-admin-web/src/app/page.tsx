import Link from "next/link";
import { ParticleSkylineHero } from "@/components/marketing/ParticleSkylineHero";
import { ParticleCardHero } from "@/components/marketing/ParticleCardHero";
import { ParticleCommunityHero } from "@/components/marketing/ParticleCommunityHero";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarCheck,
  MessageSquareHeart,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { LandingNav } from "@/components/marketing/LandingNav";
import { StoreBadge } from "@/components/marketing/StoreBadge";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

/**
 * Landing pública de Nest Living. Estilo editorial sobre blanco, con fondos
 * alternados (papel / tinta oscura) para que las secciones no se sientan
 * repetitivas. Copy orientado a venta + SEO (headings jerárquicos, JSON-LD).
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-editorial-ink">
      <StructuredData />
      <LandingNav />

      <Hero />
      <Surfaces />
      <Problem />
      <Solution />
      <Features />
      <Differentiator />
      <Margins />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ============================ 1 · HERO ============================ */
/**
 * Hero editorial inmersivo. El skyline ocupa todo el fondo del hero
 * (full-bleed). El copy flota encima, con un fade superior y radial-gradient
 * sutil para mantener legibilidad sin tapar la ciudad.
 *
 * Capas, de atrás hacia adelante:
 *   1. Canvas Three.js (absolute inset-0, captura cursor vía window)
 *   2. Fade vertical superior (paper → transparente) — protege el titular
 *   3. Acento teal radial (esquina inferior izquierda)
 *   4. Copy editorial: marca de portada arriba, titular monumental,
 *      bajada + CTAs anclados al final
 */
function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-paper text-editorial-ink">
      {/* ================= 1. CANVAS DE FONDO — full-bleed ================= */}
      <div className="absolute inset-0 z-0">
        <ParticleSkylineHero />
      </div>

      {/* ================= 2. FADE SUPERIOR (legibilidad) ================= */}
      {/* Gradiente paper sólido arriba → transparente al 60% del hero, para
          que el titular tenga contraste sin esconder la ciudad. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[55%]"
        style={{
          background:
            "linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper) 30%, rgba(247, 246, 242, 0.7) 60%, transparent 100%)",
        }}
      />

      {/* ================= 3. ACENTO TEAL (esquina inferior) ================= */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(45% 45% at 8% 92%, rgba(45,212,191,0.12) 0%, transparent 65%)",
        }}
      />

      {/* ================= 4. COPY EDITORIAL ================= */}
      <div className="pointer-events-none relative z-20 flex min-h-[100svh] flex-col">
        {/* ---- Marca de portada ---- */}
        <div className="mx-auto w-full max-w-7xl px-5 pt-36 md:pt-40">
          <div className="grid grid-cols-12 items-end gap-x-4">
            <div className="col-span-12 md:col-span-3">
              <span className="font-display animate-float-up block text-[5.5rem] leading-none tracking-[-0.04em] text-teal-dark/90 md:text-[8rem]">
                01
              </span>
            </div>
            <div className="animate-float-up col-span-12 mt-4 flex items-baseline gap-4 md:col-span-9 md:mt-0 [animation-delay:60ms]">
              <span className="h-px flex-none w-16 bg-hairline" />
              <p className="eyebrow">
                Edición 01 · Plataforma residencial · Mx
              </p>
            </div>
          </div>
        </div>

        {/* ---- Titular asimétrico ---- */}
        <div className="mx-auto mt-10 w-full max-w-7xl px-5 md:mt-14">
          <h1 className="font-display animate-float-up text-[3.4rem] leading-[0.92] tracking-[-0.025em] text-editorial-ink [animation-delay:120ms] md:text-[8rem]">
            <span className="block">Vivir</span>
            <span className="block pl-[12%] italic text-teal-dark md:pl-[18%]">
              en comunidad
            </span>
            <span className="block pl-[4%] md:pl-[6%]">
              debería ser{" "}
              <em className="not-italic underline decoration-teal decoration-[3px] underline-offset-[10px]">
                más simple
              </em>
              .
            </span>
          </h1>
        </div>

        {/* ---- Caption Fig. 01 (anclado bajo el titular) ---- */}
        <p className="mx-auto mt-8 w-full max-w-7xl px-5 text-xs text-editorial-soft md:mt-10">
          Fig. 01 — Comunidad como ciudad.{" "}
          <span className="hidden md:inline">
            Pasa el cursor por encima para desorganizarla.
          </span>
        </p>

        {/* ---- Footer del hero: bajada + CTAs ---- */}
        <div className="mt-auto pb-10 md:pb-14">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-end gap-x-4 gap-y-5 border-t border-hairline px-5 pt-6 md:pt-8">
            <p className="col-span-12 text-base leading-relaxed text-editorial-soft md:col-span-7 md:text-lg">
              Una{" "}
              <strong className="font-semibold text-editorial-ink">
                app móvil para tus residentes
              </strong>
              , otra{" "}
              <strong className="font-semibold text-editorial-ink">
                para tu equipo
              </strong>{" "}
              y un{" "}
              <strong className="font-semibold text-editorial-ink">
                portal web para administradores
              </strong>
              .
            </p>

            <div className="pointer-events-auto animate-float-up col-span-12 flex flex-wrap items-center gap-x-5 gap-y-3 md:col-span-5 md:justify-end [animation-delay:240ms]">
              <Link
                href="/login"
                className="btn-ink group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Iniciar sesión
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#superficies"
                className="link-underline text-sm font-semibold text-editorial-ink"
              >
                Descargar las apps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== 2 · PROBLEMA (franja tinta) ===================== */
function Problem() {
  return (
    <section className="dark-scope bg-editorial-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-end">
          <div>
            <p className="eyebrow text-white/55">El problema</p>
            <h2 className="font-display mt-5 text-3xl leading-tight text-paper md:text-[3.4rem] md:leading-[1.05]">
              La administración residencial sigue viviendo en el pasado.
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-white/70">
            <p>
              En muchas comunidades, los pagos se revisan a mano, las solicitudes
              de mantenimiento se pierden, los reportes financieros llegan tarde
              y la comunicación depende de mensajes dispersos. Eso genera
              confusión, poca transparencia y una experiencia frustrante para
              todos.
            </p>
            <p className="text-paper">
              Nest Living nace para cambiar eso. No con más burocracia
              disfrazada de software —ya tenemos suficiente sufrimiento
              administrativo— sino con una plataforma que simplifica lo esencial.
            </p>
          </div>
        </div>

        {/* Tira de "dolores" */}
        <ul className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 md:grid-cols-4">
          {[
            "Pagos revisados a mano",
            "Mantenimiento que se pierde",
            "Reportes que llegan tarde",
            "WhatsApp como sistema oficial",
          ].map((pain) => (
            <li
              key={pain}
              className="bg-editorial-ink p-6 text-[15px] leading-snug text-white/75"
            >
              <span aria-hidden className="block text-2xl text-white/30">
                ✕
              </span>
              <span className="mt-3 block">{pain}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ===================== 3 · SOLUCIÓN ===================== */
function Solution() {
  return (
    <section id="solucion" className="mx-auto max-w-6xl px-5 py-24">
      <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">La solución</p>
          <span className="index-num mt-4 block text-5xl">01</span>
        </div>
        <div>
          <h2 className="font-display text-3xl leading-tight md:text-[3.4rem] md:leading-[1.05]">
            Una plataforma para que la comunidad funcione mejor.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-editorial-soft">
            Nest Living reúne las operaciones clave de una comunidad residencial
            en un solo sistema. Desde el registro de residentes hasta el
            seguimiento de pagos, mantenimiento, reservas, proveedores y métricas
            financieras: todo diseñado para que la administración sea más clara,
            rápida y confiable.
          </p>

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-hairline pt-8">
            {["Menos caos.", "Más visibilidad.", "Mejores decisiones."].map(
              (claim, i) => (
                <p
                  key={claim}
                  className="font-display text-2xl text-editorial-ink md:text-3xl"
                >
                  <span className="index-num mr-2 text-lg">0{i + 1}</span>
                  {claim}
                </p>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== 4 · SUPERFICIES (3 puertas) ===================== */
/**
 * Una sección que explica que Nest Living son tres superficies que se hablan
 * entre sí: la app del residente, la app del equipo/staff y el portal web del
 * administrador. Cada tarjeta tiene su propio CTA: las apps llevan a stores,
 * el portal lleva a `/login`.
 */
function Surfaces() {
  // URLs de las stores. Mientras las apps no estén publicadas dejamos el
  // CTA habilitado pero apuntando a las búsquedas — cuando salgan, basta con
  // sustituir aquí los enlaces y todo el sitio queda al día.
  const RESIDENT_IOS = "https://apps.apple.com/search?term=nest%20living";
  const RESIDENT_ANDROID =
    "https://play.google.com/store/search?q=nest%20living&c=apps";
  const STAFF_IOS = "https://apps.apple.com/search?term=nest%20living%20staff";
  const STAFF_ANDROID =
    "https://play.google.com/store/search?q=nest%20living%20staff&c=apps";

  return (
    <section
      id="superficies"
      className="border-y border-hairline bg-paper-2/70"
    >
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">Tres puertas, una misma comunidad</p>
          <h2 className="font-display mt-5 text-3xl leading-tight md:text-[3.4rem] md:leading-[1.04]">
            Nest Living vive en{" "}
            <em className="italic text-teal-dark">tres lugares</em>.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-editorial-soft">
            Cada persona de tu comunidad entra por la puerta que le toca. Un
            mismo sistema, tres experiencias pensadas para lo que cada quien
            necesita resolver.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {/* ---- Residentes ---- */}
          <SurfaceCard
            tag="App móvil"
            number="01"
            title="Para residentes"
            body="Reserva amenidades, paga el mantenimiento, reporta una fuga y entérate de los anuncios. Todo desde el bolsillo, sin pelear con grupos de WhatsApp."
            highlight="Lo que tu comunidad ha pedido siempre."
            stores={{
              ios: RESIDENT_IOS,
              android: RESIDENT_ANDROID,
            }}
            learnMore={{
              label: "Conocer la app →",
              href: "/app-residentes",
            }}
          />

          {/* ---- Equipo / Staff ---- */}
          <SurfaceCard
            tag="App móvil"
            number="02"
            title="Para tu equipo"
            body="Recepción, vigilancia, mantenimiento y cocina operan en sus propios módulos. Cada quien ve solo lo suyo, sin distracciones ni accesos de más."
            highlight="Operar es más rápido cuando la herramienta es la correcta."
            stores={{
              ios: STAFF_IOS,
              android: STAFF_ANDROID,
            }}
          />

          {/* ---- Admin: portal web ---- */}
          <SurfaceCard
            tag="Portal web"
            number="03"
            title="Para administradores"
            body="El centro de control. Aprueba residentes, gestiona reservas, controla pedidos y manda anuncios oficiales — desde cualquier navegador."
            highlight="Dejas de administrar con hojas de cálculo."
            cta={{
              label: "Iniciar sesión",
              href: "/login",
            }}
            learnMore={{
              label: "Conocer la consola →",
              href: "/app-administradores",
            }}
            featured
          />
        </div>
      </div>
    </section>
  );
}

interface SurfaceCardProps {
  tag: string;
  number: string;
  title: string;
  body: string;
  highlight: string;
  stores?: { ios: string; android: string };
  cta?: { label: string; href: string };
  /** Enlace secundario tipo "Conocer la app →" debajo del CTA principal. */
  learnMore?: { label: string; href: string };
  featured?: boolean;
}

function SurfaceCard({
  tag,
  number,
  title,
  body,
  highlight,
  stores,
  cta,
  learnMore,
  featured,
}: SurfaceCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-sm border p-7 md:p-9",
        featured
          ? "border-editorial-ink bg-editorial-ink text-paper"
          : "border-hairline bg-paper",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
            featured
              ? "border-white/25 text-white/75"
              : "border-hairline text-editorial-soft",
          )}
        >
          {tag}
        </span>
        <span
          className={cn(
            "index-num text-3xl",
            featured && "text-teal",
          )}
        >
          {number}
        </span>
      </div>

      <h3
        className={cn(
          "font-display mt-8 text-3xl leading-tight md:text-[2.4rem]",
          featured ? "text-paper" : "text-editorial-ink",
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "mt-4 text-[15px] leading-relaxed",
          featured ? "text-white/75" : "text-editorial-soft",
        )}
      >
        {body}
      </p>

      <p
        className={cn(
          "mt-5 border-l-2 pl-3 text-sm italic",
          featured
            ? "border-teal/60 text-white/85"
            : "border-teal/40 text-editorial-soft",
        )}
      >
        {highlight}
      </p>

      {/* CTAs al pie */}
      <div className="mt-auto pt-8">
        {stores && (
          <div className="flex flex-wrap gap-2">
            <StoreBadge store="appstore" href={stores.ios} variant="dark" />
            <StoreBadge
              store="playstore"
              href={stores.android}
              variant="dark"
            />
          </div>
        )}
        {cta && (
          <Link
            href={cta.href}
            className="btn-paper group inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold"
          >
            {cta.label}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
        {learnMore && (
          <Link
            href={learnMore.href}
            className={cn(
              "link-underline mt-4 inline-block text-sm font-semibold",
              featured ? "text-white/85 hover:text-white" : "text-editorial-ink",
            )}
          >
            {learnMore.label}
          </Link>
        )}
      </div>
    </article>
  );
}

/* ===================== 5 · FUNCIONES (índice sumario) ===================== */
function Features() {
  return (
    <section id="funciones" className="mx-auto max-w-6xl px-5 py-24">
      <div className="flex items-end justify-between gap-6 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow">Servicios</p>
          <h2 className="font-display mt-3 max-w-xl text-3xl leading-tight md:text-5xl">
            Seis módulos. Una sola plataforma.
          </h2>
        </div>
        <Link
          href="/servicios"
          className="link-underline hidden text-sm font-semibold text-editorial-ink md:block"
        >
          Ver todos →
        </Link>
      </div>

      <ol>
        {FEATURES.map((f, i) => (
          <li key={f.title}>
            <Link
              href={`/servicios/${f.slug}`}
              className="group grid grid-cols-[auto_1fr] items-start gap-5 border-b border-hairline py-7 transition-colors hover:bg-paper-2/40 md:grid-cols-[5rem_1fr_auto] md:items-center md:gap-8 md:px-3 md:-mx-3"
            >
              <span className="index-num text-2xl md:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display flex items-center gap-3 text-2xl text-editorial-ink md:text-3xl">
                  <f.icon className="h-6 w-6 shrink-0 text-teal-dark" />
                  {f.title}
                </h3>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-editorial-soft md:text-base">
                  {f.body}
                </p>
              </div>
              <ArrowUpRight className="col-span-2 hidden h-6 w-6 text-editorial-soft transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-dark md:col-span-1 md:block" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: "Gestión de residentes",
    body: "Registra residentes, unidades, contactos y roles dentro de la comunidad de forma ordenada y segura.",
    slug: "residentes",
  },
  {
    icon: CalendarCheck,
    title: "Amenidades y reservas",
    body: "Administra espacios comunes, horarios, disponibilidad y solicitudes de uso en tiempo real.",
    slug: "amenidades",
  },
  {
    icon: Banknote,
    title: "Finanzas y pagos",
    body: "Consulta pagos, adeudos, historial financiero, presupuestos y métricas clave desde un dashboard claro.",
    slug: "finanzas",
  },
  {
    icon: Wrench,
    title: "Mantenimiento",
    body: "Crea, asigna y da seguimiento a solicitudes de mantenimiento sin perder visibilidad del proceso.",
    slug: "mantenimiento",
  },
  {
    icon: MessageSquareHeart,
    title: "Comunidad y comunicación",
    body: "Anuncios oficiales, broadcasts segmentados y conversaciones con contexto. Sin cadenas de WhatsApp.",
    slug: "comunidad",
  },
  {
    icon: Truck,
    title: "Delivery interno",
    body: "Catálogo, productos y flujo de órdenes para la cocina o el comercio interno de tu club.",
    slug: "delivery",
  },
];

/* ============ 6 · DIFERENCIADOR / VISIÓN (editorial) ============ */
/**
 * Misma gramática del hero: número índice gigante, eyebrow con guía,
 * titular asimétrico en tres líneas, imagen como Fig. 02 con caption.
 * Sobre paper — la franja tinta se reserva para "Problema".
 */
function Differentiator() {
  return (
    <section className="relative isolate overflow-hidden bg-paper text-editorial-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-24 md:py-32">
        {/* ============ ROW SUPERIOR: marca de portada ============ */}
        <div className="grid grid-cols-12 items-end gap-x-4">
          <div className="col-span-12 md:col-span-3">
            <span className="font-display block text-[5rem] leading-none tracking-[-0.04em] text-teal-dark/90 md:text-[7rem]">
              06
            </span>
          </div>
          <div className="col-span-12 mt-4 flex items-baseline gap-4 md:col-span-9 md:mt-0">
            <span className="h-px flex-none w-16 bg-hairline" />
            <p className="eyebrow">Más que administración · Visión</p>
          </div>
        </div>

        {/* ============ TITULAR ASIMÉTRICO ============ */}
        <h2 className="font-display mt-12 text-[3rem] leading-[0.94] tracking-[-0.025em] text-editorial-ink md:mt-16 md:text-[7rem]">
          <span className="block">Comunidad</span>
          <span className="block pl-[10%] italic text-teal-dark md:pl-[16%]">
            inteligente,
          </span>
          <span className="block pl-[3%] md:pl-[5%]">
            no solo{" "}
            <em className="not-italic underline decoration-teal decoration-[3px] underline-offset-[10px]">
              administrada
            </em>
            .
          </span>
        </h2>

        {/* ============ CUERPO + FIG. 02 — split asimétrico ============ */}
        <div className="mt-16 grid grid-cols-12 gap-x-4 gap-y-12 md:mt-24">
          {/* Columna izquierda: copy con sangría editorial */}
          <div className="col-span-12 md:col-span-7 md:col-start-1 md:pr-10">
            <p className="dropcap text-lg leading-relaxed text-editorial-soft md:text-xl">
              Nest Living no solo organiza datos. Ayuda a entender cómo vive,
              opera y evoluciona una comunidad. Conecta finanzas, relaciones y
              operación diaria para convertir la administración en una
              experiencia más simple, transparente y humana.
            </p>
            <p className="mt-8 border-l-2 border-teal pl-5 text-xl leading-snug text-editorial-ink md:text-2xl">
              Porque una comunidad no es solo un edificio. Es{" "}
              <em className="italic text-teal-dark">gente compartiendo</em>{" "}
              espacios, responsabilidades y decisiones.
            </p>
          </div>

          {/* Columna derecha: Fig. 02 — figuras humanas en partículas 3D */}
          <figure className="col-span-12 md:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-hairline bg-paper">
              <ParticleCommunityHero />
              {/* Acento teal sutil en la base — guiño de marca */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(45% 35% at 50% 95%, rgba(45,212,191,0.10) 0%, transparent 60%)",
                }}
              />
            </div>
            <figcaption className="mt-3 flex items-baseline gap-3 border-t border-hairline pt-3 text-xs text-editorial-soft">
              <span className="eyebrow shrink-0 text-[10px]">Fig. 02</span>
              <span className="h-px flex-1 bg-hairline" />
              <span>Gente compartiendo. Pasa el cursor para sentirlo.</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ============ 7 · MÁRGENES (inventario + utilidad con barras 3D) ============ */
/**
 * Misma gramática editorial que el hero / Differentiator: número índice
 * gigante, eyebrow con guía, titular asimétrico en tres líneas, hairlines.
 * El arte 3D (ParticleCardHero, una tarjeta de crédito en partículas)
 * vive en columna lateral como Fig. 03, con caption editorial.
 */
function Margins() {
  return (
    <section className="relative isolate overflow-hidden bg-paper text-editorial-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-24 md:py-32">
        {/* ---- Marca de portada ---- */}
        <div className="grid grid-cols-12 items-end gap-x-4">
          <div className="col-span-12 md:col-span-3">
            <span className="font-display block text-[5rem] leading-none tracking-[-0.04em] text-teal-dark/90 md:text-[7rem]">
              07
            </span>
          </div>
          <div className="col-span-12 mt-4 flex items-baseline gap-4 md:col-span-9 md:mt-0">
            <span className="h-px flex-none w-16 bg-hairline" />
            <p className="eyebrow">Inventario · Utilidad · Proveedores</p>
          </div>
        </div>

        {/* ---- Titular asimétrico ---- */}
        <h2 className="font-display mt-12 text-[2.6rem] leading-[0.96] tracking-[-0.025em] text-editorial-ink md:mt-16 md:text-[6rem]">
          <span className="block">Saber cuánto vendes</span>
          <span className="block pl-[6%] italic text-editorial-soft md:pl-[10%]">
            está bien.
          </span>
          <span className="mt-3 block pl-[2%] md:mt-4 md:pl-[4%]">
            Saber cuánto{" "}
            <em className="not-italic italic text-teal-dark">ganas</em>,{" "}
            <em className="not-italic underline decoration-teal decoration-[3px] underline-offset-[10px]">
              mejor
            </em>
            .
          </span>
        </h2>

        {/* ---- Split: copy + canvas ---- */}
        <div className="mt-16 grid grid-cols-12 gap-x-4 gap-y-12 md:mt-24 md:items-start">
          {/* Columna izquierda: argumento */}
          <div className="col-span-12 md:col-span-6 md:pr-10">
            <p className="dropcap text-lg leading-relaxed text-editorial-soft md:text-xl">
              Muchos negocios venden, pero no siempre saben exactamente cuánto
              ganan. Y esa es una forma elegante de caminar hacia problemas
              financieros con una sonrisa.
            </p>
            <p className="mt-8 border-l-2 border-teal pl-5 text-xl leading-snug text-editorial-ink md:text-2xl">
              Con Nest Living tu inventario, tus proveedores y tu margen viven
              en el <em className="italic text-teal-dark">mismo lugar</em>.
            </p>
          </div>

          {/* Columna derecha: Fig. 03 — tarjeta de crédito 3D en partículas */}
          <figure className="col-span-12 md:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-hairline bg-paper">
              <ParticleCardHero />
              {/* Acento teal sutil esquina inferior izquierda */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(40% 50% at 8% 92%, rgba(45,212,191,0.10) 0%, transparent 60%)",
                }}
              />
            </div>
            <figcaption className="mt-3 flex items-baseline gap-3 border-t border-hairline pt-3 text-xs text-editorial-soft">
              <span className="eyebrow shrink-0 text-[10px]">Fig. 03</span>
              <span className="h-px flex-1 bg-hairline" />
              <span>
                Tu utilidad, en partículas. Pasa el cursor para desorganizarla.
              </span>
            </figcaption>
          </figure>
        </div>

        {/* ---- Sumario de funciones ---- */}
        <div className="mt-20 border-t border-hairline pt-12 md:mt-28">
          <p className="eyebrow mb-8">Qué incluye el módulo</p>
          <ol className="grid grid-cols-1 gap-px overflow-hidden border border-hairline bg-hairline md:grid-cols-2">
            {MARGIN_ITEMS.map((it, i) => (
              <li
                key={it.title}
                className="flex items-baseline gap-4 bg-paper px-6 py-5 md:px-8 md:py-6"
              >
                <span className="index-num shrink-0 text-2xl tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl leading-tight text-editorial-ink md:text-2xl">
                    {it.title}
                  </h3>
                  {it.body && (
                    <p className="mt-1 text-sm leading-relaxed text-editorial-soft">
                      {it.body}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const MARGIN_ITEMS: { title: string; body?: string }[] = [
  { title: "Registro de proveedores" },
  { title: "Productos por proveedor" },
  { title: "Costos de compra · historial" },
  { title: "Órdenes de compra" },
  { title: "Entradas de inventario" },
  { title: "Márgenes por producto" },
  { title: "Comparación de proveedores" },
  { title: "Alertas de cambios de costo" },
  { title: "Reportes de utilidad" },
  { title: "Productos rentables · de bajo margen" },
];

/* ===================== 8 · CTA FINAL ===================== */
function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-28 text-center">
      <p className="eyebrow">La nueva forma de vivir y administrar comunidades</p>
      <h2 className="font-display mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] md:text-[4.2rem] md:leading-[0.98]">
        Haz que tu comunidad funcione <em className="italic text-teal-dark">como debería.</em>
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-lg text-editorial-soft">
        Centraliza la administración residencial, mejora la comunicación y toma
        decisiones con información clara.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className="btn-ink inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold"
        >
          Empieza con Nest Living
          <ArrowRight className="h-5 w-5" />
        </Link>
        <a
          href="#solucion"
          className="link-underline text-base font-semibold text-editorial-ink"
        >
          Solicita una demo
        </a>
      </div>
    </section>
  );
}

/* ===================== FOOTER ===================== */
function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 md:flex-row">
        <Logo variant="dark" width={108} aria-label="Nest Living" />
        <p className="max-w-md text-center text-sm text-editorial-soft md:text-left">
          Administración residencial simple, transparente y humana.
        </p>
        <Link
          href="/login"
          className="link-underline text-sm font-semibold text-editorial-ink"
        >
          Iniciar sesión →
        </Link>
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-editorial-soft">
          © {new Date().getFullYear()} Nest Living. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}

/* ===================== SEO · JSON-LD ===================== */
function StructuredData() {
  const json = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nest Living",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Administración residencial",
    operatingSystem: "Web",
    description:
      "Nest Living centraliza pagos, mantenimiento, comunicación, reservas, residentes y métricas financieras de comunidades residenciales en una sola plataforma.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "MXN",
      description: "Solicita una demo de Nest Living.",
    },
    featureList: [
      "Gestión de residentes",
      "Pagos y finanzas",
      "Mantenimiento",
      "Amenidades y reservas",
      "Proveedores",
      "Reportes inteligentes",
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD para motores de búsqueda; contenido estático y seguro.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
