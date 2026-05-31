/**
 * Resolución del API_URL del backend (fly-api).
 *
 * En el frontend móvil esto se auto-detecta desde el host de Expo; aquí, al ser
 * web, basta con `NEXT_PUBLIC_API_URL` (build-time, embebido en el bundle) y un
 * fallback al deploy de Render.
 */
const DEFAULT_API_URL = "https://mono-repo-nest-living.onrender.com";

function resolveApiUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  return DEFAULT_API_URL;
}

export const ENV = {
  API_URL: resolveApiUrl(),
};
