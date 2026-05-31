import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePage } from "@/components/services/ServicePage";
import { getServiceBySlug, SERVICES } from "@/content/services";

/**
 * Pre-renderiza una página por servicio en build time. Como `SERVICES` es un
 * arreglo estático del proyecto, todas las rutas son estáticas — sin
 * cliente-side fetch ni revalidación.
 */
export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  const title = `${service.name} — Nest Living`;
  const description = service.summary;
  const url = `/servicios/${service.slug}`;

  return {
    title,
    description,
    keywords: service.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "es_MX",
      siteName: "Nest Living",
      title,
      description,
      url,
      images: [
        {
          url: service.heroImage,
          width: 1200,
          height: 630,
          alt: service.heroImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [service.heroImage],
    },
  };
}

export default async function ServicioDinamico({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();
  return <ServicePage service={service} />;
}
