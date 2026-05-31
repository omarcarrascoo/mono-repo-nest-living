import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { LandingNav } from "@/components/marketing/LandingNav";
import { Logo } from "@/components/ui/Logo";
import { ServiceContent, SERVICES } from "@/content/services";
import { cn } from "@/lib/cn";

/**
 * Página completa de un servicio. Recibe el contenido y lo arma con secciones
 * cuyo layout varía según el índice del servicio para que no se sienta
 * repetitivo entre páginas hermanas (foto a la izquierda vs derecha, fondos
 * alternos, orden de bloques distinto).
 */
export function ServicePage({ service }: { service: ServiceContent }) {
  const idx = SERVICES.findIndex((s) => s.slug === service.slug);
  // Layout-flips para variar la composición entre servicios.
  const flip = idx % 2 === 1;

  return (
    <div className="min-h-screen bg-paper text-editorial-ink">
      <StructuredData service={service} />
      <LandingNav />

      <ServiceHero service={service} />
      <Breadcrumb service={service} />
      <Problem service={service} />
      <HowItWorks service={service} flip={flip} />
      <Features service={service} />
      <PullQuote service={service} />
      <Benefits service={service} flip={flip} />
      <Faq service={service} />
      <CrossSell currentSlug={service.slug} />
      <FinalCta service={service} />
      <Footer />
    </div>
  );
}

/* ============================ HERO ============================ */
function ServiceHero({ service }: { service: ServiceContent }) {
  return (
    <section className="dark-scope relative -mt-px h-[80svh] min-h-[560px] w-full overflow-hidden bg-editorial-ink text-paper">
      <Image
        src={service.heroImage}
        alt={service.heroImageAlt}
        fill
        priority
        sizes="100vw"
        className="hero-image object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/85" />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(60% 60% at 18% 30%, rgba(45,212,191,0.25) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col px-5">
        <div className="animate-float-up flex items-center gap-4 pt-36 text-white/65 md:pt-44">
          <span className="h-px flex-none w-12 bg-white/40" />
          <p className="eyebrow text-white/65">{service.eyebrow}</p>
        </div>

        <h1 className="font-display animate-float-up mt-5 max-w-5xl text-[2.8rem] leading-[1] tracking-[-0.02em] text-paper [animation-delay:160ms] md:text-[6rem]">
          {service.headline}{" "}
          <span className="italic text-teal">{service.headlineAccent}</span>
        </h1>

        <p className="animate-float-up mt-8 max-w-2xl text-lg leading-relaxed text-white/80 [animation-delay:240ms] md:text-xl">
          {service.subheadline}
        </p>

        <div className="mt-auto pb-12 md:pb-16">
          <div className="animate-float-up flex flex-wrap items-center gap-3 [animation-delay:320ms]">
            <Link
              href="/login"
              className="btn-paper group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold"
            >
              Conoce Nest Living
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/servicios"
              className="link-underline text-base font-semibold text-white"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ BREADCRUMB ============================ */
function Breadcrumb({ service }: { service: ServiceContent }) {
  return (
    <nav
      aria-label="Migas de pan"
      className="border-b border-hairline bg-paper-2/40"
    >
      <ol className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-4 text-xs text-editorial-soft">
        <li>
          <Link href="/" className="link-underline">
            Inicio
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href="/servicios" className="link-underline">
            Servicios
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li
          aria-current="page"
          className="truncate font-semibold text-editorial-ink"
        >
          {service.name}
        </li>
      </ol>
    </nav>
  );
}

/* ============================ PROBLEMA ============================ */
function Problem({ service }: { service: ServiceContent }) {
  return (
    <section className="dark-scope bg-editorial-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <p className="eyebrow text-white/55">{service.problem.eyebrow}</p>
            <span className="index-num mt-4 block text-5xl text-teal">01</span>
          </div>
          <div>
            <h2 className="font-display text-3xl leading-tight text-paper md:text-[3.2rem] md:leading-[1.05]">
              {service.problem.title}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              {service.problem.body}
            </p>
          </div>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-2 md:grid-cols-4">
          {service.problem.pains.map((pain) => (
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

/* ============================ CÓMO FUNCIONA ============================ */
function HowItWorks({
  service,
  flip,
}: {
  service: ServiceContent;
  flip: boolean;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="max-w-3xl">
        <p className="eyebrow">Cómo funciona</p>
        <h2 className="font-display mt-5 text-3xl leading-tight md:text-[3.2rem] md:leading-[1.05]">
          De reportar a resolver, en tres movimientos.
        </h2>
      </div>

      <ol
        className={cn(
          "mt-16 grid gap-px overflow-hidden rounded-sm border border-hairline bg-hairline md:grid-cols-3",
          flip && "md:[direction:rtl]",
        )}
      >
        {service.howItWorks.map((step, i) => (
          <li
            key={step.title}
            className="bg-paper p-8 [direction:ltr] md:p-10"
          >
            <span className="index-num text-3xl">0{i + 1}</span>
            <h3 className="font-display mt-5 text-2xl leading-tight text-editorial-ink">
              {step.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-editorial-soft">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ============================ FUNCIONALIDADES ============================ */
function Features({ service }: { service: ServiceContent }) {
  return (
    <section className="border-y border-hairline bg-paper-2/60">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="flex items-end justify-between gap-6 border-b border-hairline pb-6">
          <h2 className="font-display max-w-xl text-3xl leading-tight md:text-5xl">
            Lo que viene incluido.
          </h2>
          <p className="eyebrow hidden shrink-0 md:block">Funcionalidades</p>
        </div>

        <ul>
          {service.features.map((f, i) => (
            <li
              key={f.title}
              className="grid grid-cols-[auto_1fr] items-start gap-5 border-b border-hairline py-7 md:grid-cols-[5rem_1fr_auto] md:items-center md:gap-8"
            >
              <span className="index-num text-2xl md:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-xl text-editorial-ink md:text-2xl">
                  {f.title}
                </h3>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-editorial-soft">
                  {f.description}
                </p>
              </div>
              <ArrowUpRight className="col-span-2 hidden h-5 w-5 text-editorial-soft md:col-span-1 md:block" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================ PULL QUOTE ============================ */
function PullQuote({ service }: { service: ServiceContent }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-28 text-center">
      <span aria-hidden className="font-display text-7xl text-teal-dark/40">
        “
      </span>
      <blockquote className="font-display -mt-2 text-3xl leading-[1.2] text-editorial-ink md:text-5xl md:leading-[1.15]">
        {service.pullQuote}
      </blockquote>
    </section>
  );
}

/* ============================ BENEFICIOS ============================ */
function Benefits({
  service,
  flip,
}: {
  service: ServiceContent;
  flip: boolean;
}) {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2">
        <figure
          className={cn(
            "relative aspect-[4/5] overflow-hidden rounded-sm",
            flip ? "order-2" : "order-2 md:order-1",
          )}
        >
          <Image
            src={service.heroImage}
            alt={service.heroImageAlt}
            fill
            sizes="(max-width: 768px) 90vw, 45vw"
            className="object-cover"
          />
          <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-sm text-white/90">
            {service.name}
          </figcaption>
        </figure>

        <div className={cn("order-1", !flip && "md:order-2")}>
          <p className="eyebrow">Beneficios</p>
          <h2 className="font-display mt-5 text-3xl leading-tight md:text-5xl">
            Lo que cambia desde el primer día.
          </h2>
          <ul className="mt-10 space-y-5">
            {service.benefits.map((b) => (
              <li key={b} className="flex items-start gap-4">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal-dark">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <p className="text-lg leading-relaxed text-editorial-ink">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */
function Faq({ service }: { service: ServiceContent }) {
  return (
    <section className="border-t border-hairline bg-paper-2/40">
      <div className="mx-auto max-w-4xl px-5 py-24">
        <p className="eyebrow text-center">Preguntas frecuentes</p>
        <h2 className="font-display mt-5 text-center text-3xl leading-tight md:text-5xl">
          Lo que la gente pregunta antes de empezar.
        </h2>

        <dl className="mt-14 divide-y divide-hairline border-y border-hairline">
          {service.faqs.map((f) => (
            <details key={f.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6">
                <dt className="font-display text-xl text-editorial-ink md:text-2xl">
                  {f.question}
                </dt>
                <span
                  aria-hidden
                  className="font-display shrink-0 text-3xl text-teal-dark transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <dd className="mt-4 max-w-3xl text-[15px] leading-relaxed text-editorial-soft md:text-base">
                {f.answer}
              </dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ============================ CROSS-SELL ============================ */
function CrossSell({ currentSlug }: { currentSlug: string }) {
  const others = SERVICES.filter((s) => s.slug !== currentSlug).slice(0, 3);
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="flex items-end justify-between gap-6 border-b border-hairline pb-6">
          <h2 className="font-display max-w-xl text-3xl leading-tight md:text-4xl">
            Otros servicios para tu comunidad.
          </h2>
          <Link
            href="/servicios"
            className="link-underline text-sm font-semibold text-editorial-ink"
          >
            Ver todos →
          </Link>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-hairline bg-hairline md:grid-cols-3">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={`/servicios/${s.slug}`}
              className="group block bg-paper p-7 transition-colors hover:bg-paper-2/60"
            >
              <p className="eyebrow">{s.eyebrow}</p>
              <h3 className="font-display mt-4 text-2xl leading-tight text-editorial-ink">
                {s.name}
              </h3>
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
      </div>
    </section>
  );
}

/* ============================ CTA FINAL ============================ */
function FinalCta({ service }: { service: ServiceContent }) {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-5xl px-5 py-28 text-center">
        <p className="eyebrow">Empieza hoy</p>
        <h2 className="font-display mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] md:text-[4rem] md:leading-[0.98]">
          Lleva {service.name.toLowerCase()} a tu comunidad.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-editorial-soft">
          Una conversación de 20 minutos basta para que veas Nest Living
          funcionando en una comunidad como la tuya.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="btn-ink inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold"
          >
            Empezar ahora
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
  );
}

/* ============================ FOOTER ============================ */
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

/* ============================ JSON-LD ============================ */
function StructuredData({ service }: { service: ServiceContent }) {
  const baseUrl = "https://nestliving.app";
  const url = `${baseUrl}/servicios/${service.slug}`;

  // Service schema + BreadcrumbList + FAQPage como un solo grafo.
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: service.name,
        description: service.summary,
        url,
        provider: {
          "@type": "Organization",
          name: "Nest Living",
          url: baseUrl,
        },
        areaServed: { "@type": "Country", name: "Mexico" },
        serviceType: "Administración residencial",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Servicios",
            item: `${baseUrl}/servicios`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.name,
            item: url,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: service.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
