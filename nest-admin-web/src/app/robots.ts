import type { MetadataRoute } from "next";

const BASE = "https://nestliving.app";

/** La landing es indexable; las áreas privadas (dashboard, login) no. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
