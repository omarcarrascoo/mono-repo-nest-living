import Image from "next/image";
import { cn } from "@/lib/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background:
          "linear-gradient(135deg, #2dd4bf 0%, #10b981 60%, #115e59 100%)",
      }}
    >
      {initials(name)}
    </span>
  );
}
