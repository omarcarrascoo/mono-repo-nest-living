import { cn } from "@/lib/cn";

type Store = "appstore" | "playstore";

interface Props {
  store: Store;
  href: string;
  /** "light" para fondos oscuros (badge negro/blanco), "dark" para fondos claros. */
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Badge "descargar en…" inspirado en los oficiales pero con tipografía propia,
 * para no infringir trademarks. Sirve igual para iOS (App Store) y Android
 * (Google Play). Apple/Google no permiten clones exactos de sus badges fuera
 * de los kits oficiales — esta versión cumple la convención visual sin
 * copiar el asset.
 */
export function StoreBadge({ store, href, variant = "light", className }: Props) {
  const eyebrow = store === "appstore" ? "Descárgalo en el" : "Disponible en";
  const name = store === "appstore" ? "App Store" : "Google Play";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${eyebrow} ${name}`}
      className={cn(
        "group inline-flex h-14 items-center gap-3 rounded-2xl border px-5 transition-all hover:scale-[1.02]",
        variant === "light"
          ? "border-white/20 bg-black/85 text-white hover:bg-black"
          : "border-editorial-ink bg-editorial-ink text-white hover:bg-black",
        className,
      )}
    >
      {store === "appstore" ? <AppleMark /> : <PlayMark />}
      <span className="flex flex-col leading-none">
        <span className="text-[10px] font-medium tracking-wider opacity-75">
          {eyebrow}
        </span>
        <span className="mt-1 text-base font-semibold tracking-tight">
          {name}
        </span>
      </span>
    </a>
  );
}

function AppleMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-7 w-7 shrink-0"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.42 2.22-1.13 3.02-.85.96-2.23 1.7-3.36 1.62-.13-1.1.4-2.26 1.07-3 .77-.85 2.2-1.5 3.42-1.64ZM20.5 17.4c-.55 1.27-.81 1.83-1.51 2.95-.98 1.56-2.36 3.5-4.07 3.52-1.52.02-1.91-.99-3.97-.98-2.06.02-2.5 1-4.02.98-1.71-.03-3.02-1.78-4-3.34-2.74-4.36-3.03-9.48-1.34-12.2 1.2-1.94 3.1-3.07 4.88-3.07 1.81 0 2.95 1 4.45 1 1.46 0 2.34-1 4.43-1 1.58 0 3.26.87 4.45 2.36-3.91 2.14-3.27 7.74.7 9.78Z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-7 w-7 shrink-0"
    >
      <defs>
        <linearGradient id="playA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#0066FF" />
        </linearGradient>
        <linearGradient id="playB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFCE00" />
          <stop offset="100%" stopColor="#FF9100" />
        </linearGradient>
        <linearGradient id="playC" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00F176" />
          <stop offset="100%" stopColor="#00C853" />
        </linearGradient>
        <linearGradient id="playD" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF3A44" />
          <stop offset="100%" stopColor="#C31162" />
        </linearGradient>
      </defs>
      {/* Triángulo dividido en 4 paneles del Play. Trazado simplificado. */}
      <path d="M3.5 2.3 13.6 12 3.5 21.7c-.3-.3-.5-.7-.5-1.2V3.5c0-.5.2-.9.5-1.2Z" fill="url(#playA)" />
      <path d="M17.5 8.4 13.6 12l3.9 3.6 3.4-1.95c1-.55 1-1.95 0-2.5Z" fill="url(#playB)" />
      <path d="M3.5 2.3c.3-.3.7-.4 1.1-.2l12.9 6.3-3.9 3.6Z" fill="url(#playC)" />
      <path d="M3.5 21.7c.3.3.7.4 1.1.2l12.9-6.3-3.9-3.6Z" fill="url(#playD)" />
    </svg>
  );
}
