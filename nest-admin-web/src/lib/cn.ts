/**
 * Une clases condicionalmente sin dependencias externas (clsx-lite).
 * Suficiente para componer Tailwind sin traer clsx/tailwind-merge.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
