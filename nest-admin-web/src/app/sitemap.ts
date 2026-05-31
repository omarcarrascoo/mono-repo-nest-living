import type { MetadataRoute } from "next";
import { SERVICES } from "@/content/services";

const BASE = "https://nestliving.app";

/**
 * Indexamos las páginas públicas de marketing: landing, hub de servicios y
 * cada servicio individual. Dashboard y login siguen privados (los excluye
 * `robots.ts`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE}/app-residentes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/app-administradores`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/servicios`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...SERVICES.map((s) => ({
      url: `${BASE}/servicios/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
