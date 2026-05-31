/**
 * Catálogo de screenshots de la app de residentes (`nest-mobile`).
 *
 * Las imágenes vienen ya con el frame de iPhone, así que no las metemos en un
 * mockup adicional — solo las mostramos sobre fondo limpio.
 *
 * Cada screenshot tiene un `tag` que identifica su tema y permite filtrar
 * por servicio (ver `byTag` y `forService`).
 */

export type ScreenshotTag =
  | "home"
  | "reservas"
  | "comunidad"
  | "pagos"
  | "delivery"
  | "notificaciones";

export interface Screenshot {
  /** Path bajo /public. */
  src: string;
  /** Texto alternativo, también sirve como overline visual. */
  alt: string;
  /** Título corto que aparece como leyenda. */
  caption: string;
  /** Tag para agrupar / filtrar. */
  tag: ScreenshotTag;
  /** Píxeles reales del archivo (todas son ~500x980). */
  width: number;
  height: number;
}

export const SCREENSHOTS: Screenshot[] = [
  {
    src: "/screenshots/home-explora.png",
    alt: "Home de la app de residentes mostrando un saludo personal y el explorador de amenidades con tabs por categoría",
    caption: "Tu comunidad cabe en una pantalla.",
    tag: "home",
    width: 496,
    height: 963,
  },
  {
    src: "/screenshots/reserva-gym.png",
    alt: "Detalle de la amenidad gimnasio con descripción, ubicación y botón para reservar",
    caption: "Reservar el gimnasio en segundos.",
    tag: "reservas",
    width: 494,
    height: 970,
  },
  {
    src: "/screenshots/reserva-fechas.png",
    alt: "Pantalla con calendario y horarios disponibles para reservar una amenidad",
    caption: "Ve las fechas disponibles, sin llamadas.",
    tag: "reservas",
    width: 521,
    height: 984,
  },
  {
    src: "/screenshots/administra-reservas.png",
    alt: "Lista de reservas activas y pasadas del residente",
    caption: "Tus reservas, todas en un lugar.",
    tag: "reservas",
    width: 491,
    height: 985,
  },
  {
    src: "/screenshots/muro-vecinal.png",
    alt: "Muro vecinal con anuncios oficiales destacados y publicaciones de vecinos",
    caption: "Anuncios oficiales sobre el ruido del WhatsApp.",
    tag: "comunidad",
    width: 499,
    height: 978,
  },
  {
    src: "/screenshots/publica-muro.png",
    alt: "Composer para publicar en el muro de la comunidad con título, contenido e imagen",
    caption: "Publicar es de un tap.",
    tag: "comunidad",
    width: 505,
    height: 982,
  },
  {
    src: "/screenshots/pagos-integrados.png",
    alt: "Pantalla de pagos integrados con saldo, cuotas y métodos disponibles",
    caption: "Pagos justos, sin sorpresas.",
    tag: "pagos",
    width: 523,
    height: 981,
  },
  {
    src: "/screenshots/delivery-home.png",
    alt: "Home del módulo de delivery con productos destacados del día y categorías",
    caption: "Delivery dentro de tu app.",
    tag: "delivery",
    width: 501,
    height: 981,
  },
  {
    src: "/screenshots/delivery-producto.png",
    alt: "Detalle del producto chilaquiles verdes con foto, precio y opciones",
    caption: "Cada producto, con su receta.",
    tag: "delivery",
    width: 506,
    height: 980,
  },
  {
    src: "/screenshots/delivery-confirma.png",
    alt: "Pantalla de confirmación del pedido con resumen e instrucciones de pago",
    caption: "Confirmas y listo.",
    tag: "delivery",
    width: 520,
    height: 983,
  },
  {
    src: "/screenshots/delivery-admin.png",
    alt: "Vista del operador de cocina administrando los pedidos entrantes",
    caption: "Tu cocina opera con claridad.",
    tag: "delivery",
    width: 509,
    height: 992,
  },
  {
    src: "/screenshots/notificaciones.png",
    alt: "Bandeja de notificaciones con avisos del club, recordatorios de reservas y mensajes",
    caption: "Notificaciones en vivo.",
    tag: "notificaciones",
    width: 490,
    height: 981,
  },
];

/** Helper: filtra por uno o varios tags. */
export function byTag(...tags: ScreenshotTag[]): Screenshot[] {
  const set = new Set(tags);
  return SCREENSHOTS.filter((s) => set.has(s.tag));
}

/**
 * Mapeo de slug de servicio → tags relevantes. Cada página de servicio recoge
 * los screenshots de aquí.
 */
const SERVICE_TAGS: Record<string, ScreenshotTag[]> = {
  residentes: ["home", "comunidad"],
  amenidades: ["reservas"],
  finanzas: ["pagos"],
  mantenimiento: ["notificaciones", "comunidad"],
  comunidad: ["comunidad", "notificaciones"],
  delivery: ["delivery"],
};

export function forService(slug: string): Screenshot[] {
  const tags = SERVICE_TAGS[slug];
  if (!tags) return [];
  return byTag(...tags);
}
