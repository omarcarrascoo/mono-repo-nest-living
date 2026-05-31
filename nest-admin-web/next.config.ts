import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Permitimos cualquier hostname HTTPS: las amenidades, productos y posts
     * pueden traer URLs de imagen de orígenes arbitrarios (los admins pegan
     * URLs externas, no solo nuestro bucket). Mantenemos HTTPS obligatorio
     * — no permitimos `http`.
     *
     * Trade-off: si en el futuro queremos forzar que toda imagen pase por
     * Supabase / R2, basta con cambiar este wildcard por entradas específicas
     * como `images.unsplash.com` o `*.supabase.co`.
     */
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
