import { cn } from "@/lib/cn";

type Tone = "neutral" | "teal" | "ok" | "warn" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  teal: "bg-teal/12 text-teal-dark",
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
