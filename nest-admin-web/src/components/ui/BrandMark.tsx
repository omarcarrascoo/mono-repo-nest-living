import { cn } from "@/lib/cn";

/**
 * Marca de NestQuest: un "nido" geométrico en degradado teal→lima.
 * SVG inline para que herede color y escale sin assets externos.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, #2dd4bf 0%, #10b981 55%, #115e59 100%)",
        boxShadow: "0 6px 18px -6px rgba(16,185,129,0.55)",
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[62%] w-[62%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Casa / nido estilizado */}
        <path
          d="M4 11.5 12 5l8 6.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.2 10.8V18a1 1 0 0 0 1 1h9.6a1 1 0 0 0 1-1v-7.2"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="14.2" r="1.8" fill="white" />
      </svg>
    </span>
  );
}
