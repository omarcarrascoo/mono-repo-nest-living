/**
 * Contenido de las páginas dedicadas a las apps.
 *
 *   - /app-residentes  — 12 secciones, una por screenshot real.
 *   - /app-administradores — secciones por módulo del portal web (sin
 *     screenshots por ahora; cuando las dropees, basta agregar `imageSrc`,
 *     `imageWidth` y `imageHeight` a cada item).
 *
 * Las dimensiones (width/height) son las reales del archivo PNG, para que
 * Next/Image sirva la versión correcta sin warnings.
 */

import type { AppSectionData } from "@/components/marketing/AppFeatureSection";

// ============================================================
// APP RESIDENTES
// ============================================================

export const RESIDENT_SECTIONS: AppSectionData[] = [
  {
    eyebrow: "Inicio",
    title: "Tu comunidad, en una pantalla.",
    titleAccent: "en una pantalla",
    body: "Saludo personal, búsqueda inteligente y un explorador de amenidades por categorías. Lo que tu residente busca, lo encuentra al primer tap.",
    imageSrc: "/screenshots/home-explora-removebg-preview.png",
    imageAlt:
      "Pantalla de inicio con saludo, badge del club activo y explorador de amenidades por categorías",
    imageWidth: 358,
    imageHeight: 696,
  },
  {
    eyebrow: "Reservas",
    title: "Reservar el gimnasio en segundos.",
    titleAccent: "en segundos",
    body: "Cada amenidad con su foto, descripción y reglas. El residente abre, lee y reserva — sin llamar a recepción ni ir al lobby.",
    imageSrc: "/screenshots/reserva-gym-removebg-preview.png",
    imageAlt:
      "Detalle del gimnasio con descripción, ubicación y botón principal de reservar",
    imageWidth: 356,
    imageHeight: 700,
  },
  {
    eyebrow: "Reservas",
    title: "Ve las fechas disponibles, sin llamadas.",
    titleAccent: "sin llamadas",
    body: "Calendario y horarios en tiempo real. Si está libre, está libre. Si está ocupado, se nota. Cero reservas dobles.",
    imageSrc: "/screenshots/reserva-fechas-removebg-preview.png",
    imageAlt:
      "Calendario y franjas horarias disponibles para reservar una amenidad",
    imageWidth: 363,
    imageHeight: 687,
  },
  {
    eyebrow: "Reservas",
    title: "Tus reservas, todas en un lugar.",
    titleAccent: "todas en un lugar",
    body: "Activas, próximas y pasadas. El residente se mantiene al tanto y cancela cuando lo necesita, sin pasar por administración.",
    imageSrc: "/screenshots/administra-reservas-removebg-preview.png",
    imageAlt:
      "Lista de reservas del residente con su estado y fecha",
    imageWidth: 353,
    imageHeight: 708,
  },
  {
    eyebrow: "Comunidad",
    title: "Anuncios oficiales sobre el ruido.",
    titleAccent: "sobre el ruido",
    body: "Un muro vecinal donde lo importante destaca: anuncios oficiales arriba, conversación de vecinos abajo. Adiós a las cadenas de WhatsApp.",
    imageSrc: "/screenshots/muro-vecinal-removebg-preview.png",
    imageAlt:
      "Muro vecinal con un anuncio oficial destacado y publicaciones de residentes",
    imageWidth: 357,
    imageHeight: 699,
  },
  {
    eyebrow: "Comunidad",
    title: "Publicar es de un tap.",
    titleAccent: "de un tap",
    body: "Los residentes comparten dudas, eventos o anécdotas. La administración mantiene el contexto, no se mezcla todo en un mismo grupo.",
    imageSrc: "/screenshots/publica-muro-removebg-preview.png",
    imageAlt:
      "Composer para publicar al muro con campo de título, contenido e imagen",
    imageWidth: 358,
    imageHeight: 697,
  },
  {
    eyebrow: "Pagos",
    title: "Pagos justos, sin sorpresas.",
    titleAccent: "sin sorpresas",
    body: "Estado de cuenta claro, métodos de pago integrados y recibos al instante. Pagar el mantenimiento deja de ser un trámite.",
    imageSrc: "/screenshots/pagos-integrados-removebg-preview.png",
    imageAlt:
      "Pantalla de pagos integrados con saldo, cuotas y métodos disponibles",
    imageWidth: 365,
    imageHeight: 684,
  },
  {
    eyebrow: "Delivery",
    title: "Delivery dentro de tu app.",
    titleAccent: "dentro de tu app",
    body: "Si tu club tiene cocina, mini-súper o servicios internos, viven aquí. Catálogo navegable con producto destacado del día.",
    imageSrc: "/screenshots/delivery-home-removebg-preview.png",
    imageAlt:
      "Home del módulo de delivery con producto destacado y categorías",
    imageWidth: 357,
    imageHeight: 699,
  },
  {
    eyebrow: "Delivery",
    title: "Cada producto, con su receta.",
    titleAccent: "con su receta",
    body: "Foto generosa, precio claro y modificadores configurables. Tamaños, salsas o extras — sin discusiones a la hora de cobrar.",
    imageSrc: "/screenshots/delivery-producto-removebg-preview.png",
    imageAlt:
      "Detalle del producto chilaquiles verdes con foto, precio y opciones",
    imageWidth: 359,
    imageHeight: 695,
  },
  {
    eyebrow: "Delivery",
    title: "Confirmas y listo.",
    titleAccent: "y listo",
    body: "Resumen del pedido, método de pago y confirmación. La cocina recibe la orden con foto, modificadores y notas — cero malentendidos.",
    imageSrc: "/screenshots/delivery-confirma-removebg-preview.png",
    imageAlt:
      "Pantalla de confirmación del pedido con resumen y método de pago",
    imageWidth: 363,
    imageHeight: 687,
  },
  {
    eyebrow: "Delivery",
    title: "Tu cocina opera con claridad.",
    titleAccent: "con claridad",
    body: "El operador ve la cola de pedidos, modifica estados y notifica al residente. Sin papelitos, sin gritos, sin cuentas a mano.",
    imageSrc: "/screenshots/delivery-admin-removebg-preview.png",
    imageAlt:
      "Vista del operador de cocina administrando los pedidos entrantes",
    imageWidth: 358,
    imageHeight: 698,
  },
  {
    eyebrow: "Notificaciones",
    title: "Notificaciones en vivo.",
    titleAccent: "en vivo",
    body: "Anuncios, recordatorios de reservas, cambios de estado de pedidos. Lo importante llega al teléfono — el resto, no estorba.",
    imageSrc: "/screenshots/notificaciones-removebg-preview.png",
    imageAlt:
      "Bandeja de notificaciones con avisos del club y recordatorios",
    imageWidth: 353,
    imageHeight: 707,
  },
];

// ============================================================
// APP MÓVIL · ADMINISTRADORES
// ============================================================
//
// Cada sección corresponde a una pantalla real de la app de administración.
// Las screenshots tienen ~500×980 (frame de iPhone). Cuando subas versiones
// con fondo transparente, sustituye el `imageSrc` por la nueva variante.
//
// Orden narrativo (no cronológico): empezamos por Residentes (la decisión
// más concreta del admin), seguimos por Reservas, Amenidades, Comunidad,
// Productos, Pedidos y cerramos con Notificaciones (operación en vivo).

export const ADMIN_SECTIONS: AppSectionData[] = [
  {
    eyebrow: "Residentes",
    title: "Aprueba a tus vecinos en un tap.",
    titleAccent: "en un tap",
    body: "Solicitudes pendientes con foto, unidad y correo. Aceptas, rechazas o asignas rol — sin hojas de cálculo, sin lista de espera mental.",
    imageSrc: "/screenshots/admin/acepta-residentes.png",
    imageAlt:
      "Pantalla de residentes con solicitudes pendientes y resumen del directorio",
    imageWidth: 497,
    imageHeight: 976,
  },
  {
    eyebrow: "Reservas",
    title: "Tus reservas, una capa más arriba.",
    titleAccent: "una capa más arriba",
    body: "Aprueba, reasigna o cancela reservas con override admin. Si la alberca tiene fila, la ves. Si nadie reserva el salón, también.",
    imageSrc: "/screenshots/admin/gestiona-reservas.png",
    imageAlt: "Pantalla de gestión de reservas con filtros y acciones admin",
    imageWidth: 520,
    imageHeight: 1004,
  },
  {
    eyebrow: "Amenidades",
    title: "Métricas que sí ayudan a decidir.",
    titleAccent: "a decidir",
    body: "Ocupación por hora, top de amenidades, tasa de cancelación. La diferencia entre 'creemos que la usa todo el mundo' y 'sabemos que la usan dos familias'.",
    imageSrc: "/screenshots/admin/metricas-amenidades.png",
    imageAlt:
      "Métricas de amenidades con ocupación, top de uso y tasa de cancelación",
    imageWidth: 497,
    imageHeight: 970,
  },
  {
    eyebrow: "Comunidad",
    title: "Anuncios que llegan, no que se pierden.",
    titleAccent: "no que se pierden",
    body: "Publica al muro, fija lo crítico, manda un push a toda la torre o a una sola unidad. La comunicación oficial deja de competir con stickers.",
    imageSrc: "/screenshots/admin/administra-comunidad.png",
    imageAlt:
      "Pantalla de comunidad con anuncios, posts y composer de broadcast",
    imageWidth: 490,
    imageHeight: 965,
  },
  {
    eyebrow: "Delivery · Catálogo",
    title: "El menú que tus residentes pueden pedir.",
    titleAccent: "pueden pedir",
    body: "Crea categorías, productos, modificadores y precio. Marca el destacado del día. Lo que publicas aquí aparece en la app del residente al instante.",
    imageSrc: "/screenshots/admin/gestiona-productos.png",
    imageAlt: "Gestión del catálogo de productos con categorías y destacados",
    imageWidth: 517,
    imageHeight: 978,
  },
  {
    eyebrow: "Delivery · Pedidos",
    title: "De pendiente a entregado, sin gritar.",
    titleAccent: "sin gritar",
    body: "Cada pedido con su número, items, modificadores, notas y forma de pago. Tu staff avanza el estado con un tap; el residente recibe su push.",
    imageSrc: "/screenshots/admin/administra-pedidos.png",
    imageAlt: "Lista de pedidos del staff con estado en vivo y total",
    imageWidth: 495,
    imageHeight: 974,
  },
  {
    eyebrow: "Notificaciones",
    title: "Actualizaciones en vivo.",
    titleAccent: "en vivo",
    body: "Quién pidió acceso, qué reserva entró, qué pedido cambió de estado. La operación de tu club, sin necesidad de mantener cinco pestañas abiertas.",
    imageSrc: "/screenshots/admin/actualizaciones-vivo.png",
    imageAlt:
      "Bandeja de notificaciones del admin con eventos en tiempo real",
    imageWidth: 518,
    imageHeight: 978,
  },
];
