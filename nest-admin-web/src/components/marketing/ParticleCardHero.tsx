"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";

const ParticleCardCanvas = dynamic(
  () => import("./ParticleCardCanvas").then((m) => m.ParticleCardCanvas),
  { ssr: false },
);

export function ParticleCardHero({ className }: { className?: string }) {
  return <ParticleCardCanvas className={cn("h-full w-full", className)} />;
}
