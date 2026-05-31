"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";

/**
 * Wrapper client-side. `next/dynamic({ ssr: false })` solo es válido en
 * client components.
 */
const ParticleSkylineCanvas = dynamic(
  () =>
    import("./ParticleSkylineCanvas").then(
      (m) => m.ParticleSkylineCanvas,
    ),
  { ssr: false },
);

export function ParticleSkylineHero({
  className,
  color,
}: {
  className?: string;
  color?: string;
}) {
  return (
    <ParticleSkylineCanvas
      className={cn("h-full w-full", className)}
      color={color}
    />
  );
}
