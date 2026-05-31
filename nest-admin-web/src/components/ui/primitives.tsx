import { cn } from "@/lib/cn";

/**
 * Primitivos del dashboard, en estética editorial.
 *
 * Decisiones intencionales:
 *   - Sin sombras, sin radios fuertes — definimos las superficies con
 *     hairlines (1px sobre `--color-hairline`).
 *   - Card y EmptyState usan `bg-paper` (papel cálido) en vez de blanco frío.
 *   - Mantuvimos `rounded-sm` (~2px) para que las esquinas no parezcan
 *     bordes "afilados" pero no se sientan tan suaves como antes.
 */

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-hairline bg-paper",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Encabezado de sección reutilizable: eyebrow + título serif + acción. */
export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="font-display text-2xl leading-tight text-editorial-ink md:text-[2rem]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm text-editorial-soft">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Estado vacío editorial: número índice gigante + título serif + descripción. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden border border-dashed border-hairline bg-paper-2/40 px-6 py-16 text-center">
      <span className="font-display absolute -bottom-6 right-4 select-none text-[8rem] leading-none text-teal-dark/10">
        00
      </span>
      <span className="relative flex h-12 w-12 items-center justify-center border border-hairline bg-paper text-editorial-soft">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-display relative mt-5 text-2xl leading-tight text-editorial-ink">
        {title}
      </p>
      {description && (
        <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-editorial-soft">
          {description}
        </p>
      )}
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  // El primario en el dashboard es la versión "ink" del marketing — sólido,
  // tipográfico, sin gradiente. Más sobrio para vistas de trabajo.
  primary: "btn-ink text-white",
  secondary:
    "border border-hairline bg-paper text-editorial-ink hover:bg-paper-2 transition-colors",
  ghost:
    "text-editorial-soft hover:bg-paper-2 hover:text-editorial-ink transition-colors",
  danger:
    "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
