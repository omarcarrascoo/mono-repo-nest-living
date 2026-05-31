import Image from "next/image";
import { Screenshot } from "@/content/screenshots";
import { cn } from "@/lib/cn";

/**
 * Una screenshot de la app envuelta con leyenda. Las imágenes ya vienen con
 * el frame de iPhone, así que solo añadimos un sombreado sutil y la
 * tipografía editorial al pie. `priority` se pasa solo a la primera para no
 * forzar precarga de todas.
 */
export function PhoneShowcase({
  shot,
  priority,
  className,
}: {
  shot: Screenshot;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col items-start", className)}>
      <div className="relative w-full">
        <Image
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          sizes="(max-width: 640px) 75vw, (max-width: 1024px) 30vw, 280px"
          priority={priority}
          className="h-auto w-full select-none drop-shadow-[0_30px_60px_rgba(11,18,15,0.35)]"
        />
      </div>
      <figcaption className="mt-5 max-w-[18rem]">
        <p className="font-display text-xl leading-snug text-editorial-ink md:text-[1.6rem]">
          {shot.caption}
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * Carrusel horizontal scrolleable para la landing. En desktop muestra varias
 * pantallas a la vez; en móvil scrollea sin friction con snap-x.
 */
export function AppGalleryScroll({
  items,
  className,
}: {
  items: Screenshot[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scroll-px-5 snap-x snap-mandatory overflow-x-auto pb-6",
        // Sangra el scroll fuera del contenedor para que se sienta editorial.
        "-mx-5 px-5 md:-mx-12 md:px-12",
        className,
      )}
      role="region"
      aria-label="Galería visual de la app de Nest Living"
    >
      <ul className="flex w-max items-end gap-8 md:gap-12">
        {items.map((shot, i) => (
          <li
            key={shot.src}
            className="w-[260px] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
          >
            <PhoneShowcase shot={shot} priority={i === 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Grid sobrio para las páginas de servicio: 2-3 pantallas alineadas, con la
 * leyenda debajo. Sin scroll horizontal — caben en el ancho de la sección.
 */
export function AppGalleryGrid({
  items,
  className,
}: {
  items: Screenshot[];
  className?: string;
}) {
  if (items.length === 0) return null;
  // Decide grid según cuántas pantallas haya: 1, 2, o 3+.
  const cols =
    items.length === 1
      ? "grid-cols-1 max-w-xs"
      : items.length === 2
        ? "grid-cols-2 max-w-2xl"
        : "grid-cols-2 md:grid-cols-3 max-w-4xl";
  return (
    <div className={cn("mx-auto grid gap-10 md:gap-12", cols, className)}>
      {items.map((shot, i) => (
        <PhoneShowcase key={shot.src} shot={shot} priority={i === 0} />
      ))}
    </div>
  );
}
