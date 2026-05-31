import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Lockup oficial de Nest Living (nido + wordmark "NEST LIVING").
 *
 * El PNG fuente vive en `/public/nest-living-logo.png` y es line-art **blanco**
 * con alfa. Sobre fondos claros lo invertimos por CSS (`filter: invert(1)`)
 * para evitar mantener dos exports del mismo logo.
 *
 * Aspect ratio nativo: 760×787 (~0.97). Pasamos `width` y dejamos que Next/CSS
 * derive la altura proporcional con `h-auto`.
 */
export function Logo({
  variant = "dark",
  width = 120,
  className,
  priority,
}: {
  variant?: "light" | "dark";
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/nest-living-logo.png"
      alt="Nest Living"
      width={width}
      height={Math.round(width * (787 / 760))}
      priority={priority}
      className={cn(
        "h-auto select-none",
        variant === "dark" && "[filter:invert(1)]",
        className,
      )}
    />
  );
}
