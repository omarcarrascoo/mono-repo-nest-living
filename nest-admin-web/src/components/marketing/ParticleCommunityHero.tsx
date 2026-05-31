"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";

const ParticleCommunityCanvas = dynamic(
  () =>
    import("./ParticleCommunityCanvas").then(
      (m) => m.ParticleCommunityCanvas,
    ),
  { ssr: false },
);

export function ParticleCommunityHero({
  className,
}: {
  className?: string;
}) {
  return (
    <ParticleCommunityCanvas className={cn("h-full w-full", className)} />
  );
}
