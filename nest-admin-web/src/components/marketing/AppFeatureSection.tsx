import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Una sección dedicada a UNA pantalla de la app.
 *
 * - Cada pantalla tiene su propia sección (no las agrupamos en grids para
 *   evitar problemas de aspect ratio inconsistente entre screenshots).
 * - Lado de la imagen alterna automáticamente con `index` (par → derecha,
 *   impar → izquierda).
 * - Si no hay imagen aún, se muestra un placeholder limpio con el número
 *   gigante para que la página no se rompa visualmente.
 */
export interface AppSectionData {
  /** Eyebrow corto, ej. "Reservas · 02". Solo se muestra arriba del título. */
  eyebrow: string;
  /** Título serif (3-7 palabras, vendible). */
  title: string;
  /** Palabra (o frase corta) del título que se renderiza en cursiva teal. */
  titleAccent?: string;
  /** Bajada / cuerpo, 1-3 oraciones. */
  body: string;
  /** Path bajo /public, ej. "/screenshots/reserva-gym.png". */
  imageSrc?: string;
  /** Texto alternativo (SEO + accesibilidad). */
  imageAlt?: string;
  /** Píxeles reales del archivo, para que Next/Image sirva la versión correcta. */
  imageWidth?: number;
  imageHeight?: number;
}

interface Props extends AppSectionData {
  /** 0-indexed: pares = imagen a la derecha, impares = a la izquierda. */
  index: number;
  /** Variante visual: phone (las screenshots vienen ya con marco) o screen (web). */
  frame?: "phone" | "screen";
  /**
   * Mockup React (componente con marco propio). Si se pasa, sustituye a la
   * imagen — útil para vistas "vivas" hechas con código en vez de PNG.
   */
  mockup?: React.ReactNode;
}

export function AppFeatureSection({
  eyebrow,
  title,
  titleAccent,
  body,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  index,
  frame = "phone",
  mockup,
}: Props) {
  const flip = index % 2 === 1;
  // El número editorial al lado del eyebrow.
  const num = String(index + 1).padStart(2, "0");

  // Si el título trae acento, lo sustituimos por <em> teal.
  const renderedTitle = titleAccent && title.includes(titleAccent) ? (
    <>
      {title.split(titleAccent)[0]}
      <em className="italic text-teal-dark">{titleAccent}</em>
      {title.split(titleAccent)[1] ?? ""}
    </>
  ) : (
    title
  );

  return (
    <section
      className={cn(
        "border-b border-hairline",
        index % 4 === 1 && "bg-paper-2/40", // varía sutilmente cada cuatro
      )}
    >
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:gap-20 md:py-24",
          // En móvil siempre va texto arriba e imagen abajo.
          // Para `phone` damos más peso al texto: las screenshots son chicas
          // (~360×700) y, si la imagen ocupa la mitad de la fila, se ven
          // upscaled. Con 1.4/0.6 el phone queda en su tamaño natural.
          frame === "phone"
            ? "md:grid-cols-[1.4fr_0.6fr]"
            : "md:grid-cols-2",
        )}
      >
        {/* COPY */}
        <div className={cn("order-1", flip ? "md:order-2" : "md:order-1")}>
          <p className="eyebrow flex items-center gap-3">
            <span className="index-num text-2xl text-teal-dark">{num}</span>
            <span className="h-px w-10 bg-hairline" />
            {eyebrow}
          </p>
          <h2 className="font-display mt-6 text-[2.25rem] leading-[1.04] tracking-[-0.01em] md:text-[3.6rem] md:leading-[1.02]">
            {renderedTitle}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-editorial-soft md:text-xl">
            {body}
          </p>
        </div>

        {/* MOCKUP, IMAGEN o PLACEHOLDER (en ese orden de prioridad) */}
        <div className={cn("order-2", flip ? "md:order-1" : "md:order-2")}>
          {mockup ? (
            mockup
          ) : imageSrc && imageWidth && imageHeight ? (
            <PhoneFigure
              src={imageSrc}
              alt={imageAlt ?? title}
              width={imageWidth}
              height={imageHeight}
              frame={frame}
            />
          ) : (
            <Placeholder num={num} frame={frame} />
          )}
        </div>
      </div>
    </section>
  );
}

function PhoneFigure({
  src,
  alt,
  width,
  height,
  frame,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  frame: "phone" | "screen";
}) {
  // Las screenshots de phone ya vienen con frame de iPhone, así que solo le
  // ponemos sombra. Las de "screen" (web) van enmarcadas por nosotros.
  //
  // Tope de ancho a 240px (vs 384px que tenía antes). Las screenshots vienen
  // a ~360px de ancho real; renderizar más grande las hacía verse upscaled.
  // En móvil dejamos un poco más para que se aprecien, pero sin pasarse.
  if (frame === "phone") {
    return (
      <div className="mx-auto w-full max-w-[260px] md:max-w-[240px]">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 768px) 240px, 240px"
          className="h-auto w-full select-none drop-shadow-[0_28px_50px_rgba(11,18,15,0.32)]"
        />
      </div>
    );
  }
  // frame === "screen" — captura web sobre un marco oscuro discreto.
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-editorial-ink/5 shadow-[0_30px_60px_rgba(11,18,15,0.18)]">
      <div className="flex items-center gap-1.5 border-b border-hairline bg-paper-2/70 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 768px) 90vw, 600px"
        className="h-auto w-full select-none"
      />
    </div>
  );
}

function Placeholder({
  num,
  frame,
}: {
  num: string;
  frame: "phone" | "screen";
}) {
  // Mientras las screenshots no existen (ej. consola admin todavía sin
  // capturas), mostramos un bloque editorial con el número gigante. No queda
  // vacío, pero comunica que esa pantalla está en camino.
  return (
    <div
      className={cn(
        "relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-3xl border border-hairline bg-paper-2/60",
        frame === "phone" ? "aspect-[9/19] max-w-[240px]" : "aspect-[16/10]",
      )}
    >
      <span className="font-display select-none text-[10rem] leading-none text-teal-dark/15">
        {num}
      </span>
      <span className="absolute bottom-6 left-6 right-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-editorial-soft">
        Captura en camino
      </span>
    </div>
  );
}
