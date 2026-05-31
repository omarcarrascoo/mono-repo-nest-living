/**
 * Contenido de las páginas de servicio. Una sola fuente de verdad para:
 *   - el hub /servicios
 *   - las páginas dinámicas /servicios/[slug]
 *   - los enlaces desde la landing
 *   - el JSON-LD que se inyecta para SEO
 *
 * Cada página comparte el mismo "esqueleto" pero monta las secciones con
 * variaciones de layout para no sentirse repetitiva (lo decide el componente).
 */

export interface ServiceFeature {
  title: string;
  description: string;
}

export interface ServiceStep {
  title: string;
  description: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceContent {
  /** Slug en URL: /servicios/<slug> */
  slug: string;
  /** Nombre corto del servicio. */
  name: string;
  /** Eyebrow que aparece arriba del hero (kicker editorial). */
  eyebrow: string;
  /** Título grande del hero — el "gancho". */
  headline: string;
  /** Palabra del headline en cursiva teal (acento). Si vacío, no aplica. */
  headlineAccent: string;
  /** Bajada del hero, 2 líneas. */
  subheadline: string;
  /** URL absoluta de la imagen hero (Unsplash). */
  heroImage: string;
  /** Alt SEO. */
  heroImageAlt: string;
  /** Resumen corto que aparece en /servicios y en metadata. */
  summary: string;
  /** Sección "el problema" — copia humana, sin marketing. */
  problem: { eyebrow: string; title: string; body: string; pains: string[] };
  /** Cómo funciona en 3 pasos. */
  howItWorks: ServiceStep[];
  /** Funcionalidades concretas, 5-6. */
  features: ServiceFeature[];
  /** Beneficios medibles / cualitativos. */
  benefits: string[];
  /** Cita / frase aspiracional. */
  pullQuote: string;
  /** FAQ con 5 preguntas para SEO (FAQPage schema). */
  faqs: ServiceFaq[];
  /** Keywords para metadata. */
  keywords: string[];
}

export const SERVICES: ServiceContent[] = [
  // ============================================================
  // 1 — RESIDENTES
  // ============================================================
  {
    slug: "residentes",
    name: "Gestión de residentes",
    eyebrow: "Servicio · 01",
    headline: "Tus residentes,",
    headlineAccent: "ordenados.",
    subheadline:
      "Un directorio vivo de quién vive en tu comunidad: aprueba solicitudes, asigna unidades y administra roles sin perder de vista a nadie.",
    heroImage:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop",
    heroImageAlt:
      "Equipo de administración de un edificio residencial revisando documentos en una mesa",
    summary:
      "Aprueba solicitudes, asigna unidades, administra roles y mantén un directorio confiable de quién vive en tu comunidad.",
    problem: {
      eyebrow: "Por qué importa",
      title: "Cuando el directorio no es de fiar, todo lo demás se rompe.",
      body: "Las hojas de cálculo se desactualizan al primer cambio de inquilino. Los grupos de WhatsApp dejan ver a personas que ya no viven ahí. La administración termina actuando con información que no refleja la realidad — y los residentes pagan el precio.",
      pains: [
        "Solicitudes de acceso que se quedan días sin responder",
        "Unidades duplicadas o sin asignar",
        "Roles confusos: ¿quién es admin, quién no?",
        "Salidas de inquilinos que nadie registra",
      ],
    },
    howItWorks: [
      {
        title: "El residente solicita acceso",
        description:
          "Con el código de tu club, cualquier persona puede pedir unirse desde la app. Tú decides si es club público (acceso inmediato) o privado (requiere aprobación).",
      },
      {
        title: "Tú revisas y apruebas",
        description:
          "Cada solicitud llega a tu bandeja con nombre, correo y fecha de nacimiento. Apruebas, rechazas o pides más información en un click — sin salir de la consola.",
      },
      {
        title: "Asignas unidad y rol",
        description:
          "Tras aprobar, asignas el departamento y el rol (residente, admin, operador). El residente entra, ve sus reservas y empieza a usar la comunidad.",
      },
    ],
    features: [
      {
        title: "Bandeja de solicitudes",
        description:
          "Un solo lugar para pendientes. Filtra por estado y resuelve solicitudes nuevas en segundos.",
      },
      {
        title: "Roles granulares",
        description:
          "Residente, administrador y operador de cocina. Cada rol ve y puede tocar exactamente lo que necesita.",
      },
      {
        title: "Asignación de unidad",
        description:
          "Edita el número de unidad, torre o piso de cada miembro sin perder el historial.",
      },
      {
        title: "Multi-club seguro",
        description:
          "Si administras varios edificios, cambias de club en un click. Los datos están aislados por diseño.",
      },
      {
        title: "Búsqueda inteligente",
        description:
          "Por nombre, correo o número de unidad. Encuentras a cualquier residente al instante.",
      },
      {
        title: "Auditoría sin esfuerzo",
        description:
          "Ves cuándo se aprobó cada membresía y quién lo hizo, para cumplir reglamento interno.",
      },
    ],
    benefits: [
      "Reduces a minutos lo que antes tomaba días",
      "Eliminas accesos de exresidentes que nadie había dado de baja",
      "Tienes un directorio que sirve para auditorías y juntas vecinales",
      "Tus residentes nuevos empiezan a usar la comunidad el mismo día",
    ],
    pullQuote:
      "Una comunidad ordenada empieza por saber, sin dudas, quién es parte de ella.",
    faqs: [
      {
        question: "¿Puedo aprobar residentes desde mi celular?",
        answer:
          "Sí. La consola de Nest Living es web responsive: funciona igual en computadora, tablet o celular. Las solicitudes pendientes aparecen en la bandeja apenas las marcas como tales.",
      },
      {
        question: "¿Qué pasa cuando un inquilino se va?",
        answer:
          "Lo quitas del club en un click. Su acceso a reservas, delivery y el feed de la comunidad se desactiva al instante, pero el historial queda registrado para tus reportes.",
      },
      {
        question: "¿Puedo tener varios administradores en un mismo club?",
        answer:
          "Sí, sin límite. Puedes promover a otros administradores para repartir el trabajo y la consola registra quién aprobó cada solicitud para mantener la trazabilidad.",
      },
      {
        question: "¿Los residentes ven el directorio completo?",
        answer:
          "No. El directorio es solo para administradores. Los residentes ven a sus vecinos en el feed de la comunidad cuando publican, pero no acceden al listado completo ni a sus correos.",
      },
      {
        question: "¿Qué pasa si alguien intenta unirse con un código viejo?",
        answer:
          "Si cambias el código de acceso de tu club, los códigos anteriores dejan de funcionar al instante. Quien ya esté dentro mantiene su membresía; los nuevos solo entran con el código vigente.",
      },
    ],
    keywords: [
      "gestión de residentes",
      "administración de condominios",
      "directorio de residentes",
      "aprobación de inquilinos",
      "roles de administración residencial",
    ],
  },

  // ============================================================
  // 2 — AMENIDADES
  // ============================================================
  {
    slug: "amenidades",
    name: "Amenidades y reservas",
    eyebrow: "Servicio · 02",
    headline: "Reservar la alberca",
    headlineAccent: "no debería ser un drama.",
    subheadline:
      "Crea espacios reservables con horarios, capacidad y reglas claras. Tus residentes los apartan en segundos desde la app, y tú ves la ocupación en tiempo real.",
    heroImage:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2070&auto=format&fit=crop",
    heroImageAlt:
      "Alberca techada en un conjunto residencial moderno, lista para reservas",
    summary:
      "Crea amenidades, define horarios y reglas, y permite que tus residentes las reserven al instante. Visualiza la ocupación en tiempo real.",
    problem: {
      eyebrow: "Por qué importa",
      title: "El gimnasio lleno, el salón doble-reservado, la alberca sin nadie.",
      body: "Cuando las reservas viven en una libreta o en mensajes sueltos, todo se vuelve frágil. Dos familias llegan al mismo tiempo. Alguien “apartó” el salón sin decirle a nadie. Y los espacios buenos terminan quedando subutilizados o sobre-reservados.",
      pains: [
        "Reservas dobles o triples sobre el mismo horario",
        "Pelea de pasillo cuando dos familias llegan a la vez",
        "Imposible saber qué tan ocupada está una amenidad",
        "Reglas de uso que nadie lee porque están en un PDF perdido",
      ],
    },
    howItWorks: [
      {
        title: "Creas la amenidad",
        description:
          "Subes una foto, defines horario, capacidad, duración mínima del slot y las reglas. La publicas y aparece en la app de tus residentes.",
      },
      {
        title: "Tus residentes reservan",
        description:
          "Ven los horarios disponibles en tiempo real y reservan en dos taps. Reciben confirmación y un recordatorio antes de su turno.",
      },
      {
        title: "Tú ves todo en vivo",
        description:
          "El dashboard te muestra ocupación por hora, top de amenidades más usadas y tasa de cancelación. Decides con datos, no con intuición.",
      },
    ],
    features: [
      {
        title: "Horarios semanales",
        description:
          "Define apertura y cierre por día. Cierra una amenidad por mantenimiento sin afectar el resto.",
      },
      {
        title: "Capacidad y aforo",
        description:
          "Limita reservas concurrentes y reservas por residente al día para evitar acaparamiento.",
      },
      {
        title: "Reglas visibles",
        description:
          "Las reglas las ve el residente justo antes de reservar. Adiós “es que no sabía”.",
      },
      {
        title: "Imágenes ilimitadas",
        description:
          "Sube fotos del espacio. Una amenidad bonita se reserva más — y también se cuida más.",
      },
      {
        title: "Estados configurables",
        description:
          "Disponible, ocupada o en mantenimiento. Comunicas el estado sin enviar un solo mensaje.",
      },
      {
        title: "Categorías",
        description:
          "Agrupa por tipo: deportivas, sociales, fitness, terrazas. Tus residentes filtran sin esfuerzo.",
      },
    ],
    benefits: [
      "Eliminas las reservas dobles para siempre",
      "Aumentas el uso de amenidades subutilizadas",
      "Reduces quejas y discusiones de pasillo",
      "Tomas decisiones de inversión con datos reales de uso",
    ],
    pullQuote:
      "Las amenidades dejan de ser un campo de batalla y vuelven a ser lo que deberían: un beneficio de vivir aquí.",
    faqs: [
      {
        question: "¿Hay límite de amenidades por club?",
        answer:
          "No. Puedes crear las que necesites: alberca, gimnasio, salón de eventos, cancha de pádel, terraza, sala de juntas, parrilla… Cada una con sus propias reglas.",
      },
      {
        question: "¿Puedo cobrar por una reserva?",
        answer:
          "El módulo de pagos está integrado. Puedes marcar una amenidad como gratuita o asignarle un costo por slot, y el cargo aparece reflejado en el estado de cuenta del residente.",
      },
      {
        question: "¿Cómo evito que un residente acapare una amenidad?",
        answer:
          "Configuras un máximo de reservas por usuario por día. Si lo excede, el sistema bloquea la nueva reserva y le avisa por qué.",
      },
      {
        question: "¿Los residentes pueden cancelar sus propias reservas?",
        answer:
          "Sí, con el plazo que tú definas. Tú también puedes cancelar cualquier reserva como administrador, y el residente recibe una notificación push automática con el motivo.",
      },
      {
        question: "¿Funciona para amenidades con turnos largos, como salones?",
        answer:
          "Sí. Puedes configurar la duración mínima del slot — desde 30 minutos hasta varias horas — y permitir reservas de múltiples slots seguidos para eventos largos.",
      },
    ],
    keywords: [
      "reserva de amenidades",
      "software de amenidades residenciales",
      "reservas de áreas comunes",
      "gestión de espacios comunes",
      "alberca gimnasio salón reservar",
    ],
  },

  // ============================================================
  // 3 — FINANZAS
  // ============================================================
  {
    slug: "finanzas",
    name: "Finanzas y pagos",
    eyebrow: "Servicio · 03",
    headline: "Cuotas, presupuestos y morosidad,",
    headlineAccent: "sin migrañas.",
    subheadline:
      "Da seguimiento a pagos, cuotas, fondo de reserva y métricas financieras desde un dashboard que tu comité y tus residentes entienden a la primera.",
    heroImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2070&auto=format&fit=crop",
    heroImageAlt:
      "Reporte financiero limpio con gráficos de pagos y presupuesto residencial",
    summary:
      "Pagos, cuotas, morosidad, fondo de reserva y reportes claros. La salud financiera de tu comunidad, en un lugar.",
    problem: {
      eyebrow: "Por qué importa",
      title: "Si las finanzas no se entienden, la confianza se rompe.",
      body: "Los reportes financieros llegan tarde, vienen en formatos imposibles, o simplemente no llegan. Los residentes desconfían. Los comités gastan juntas enteras intentando descifrar una hoja de Excel. Y cuando alguien debe, nadie sabe cuánto, desde cuándo, ni por qué.",
      pains: [
        "Estados de cuenta que llegan dos meses tarde",
        "Morosidad que solo se descubre cuando ya es grave",
        "Fondo de reserva sin trazabilidad",
        "Comité que pelea con el administrador por entender los números",
      ],
    },
    howItWorks: [
      {
        title: "Configuras las cuotas",
        description:
          "Defines cuota ordinaria, extraordinaria, fondo de reserva y conceptos especiales. El sistema los aplica automáticamente cada periodo.",
      },
      {
        title: "Los residentes pagan",
        description:
          "Pago en línea, transferencia o efectivo. Cada pago se asocia a la unidad correcta y actualiza el estado de cuenta al instante.",
      },
      {
        title: "Tú y el comité ven la verdad",
        description:
          "Dashboard con ingresos del mes, morosidad por unidad, fondo de reserva y comparativos. Reportes listos para junta vecinal.",
      },
    ],
    features: [
      {
        title: "Estados de cuenta claros",
        description:
          "Cada residente ve su historial de pagos, cargos y saldos sin tener que pedirlo.",
      },
      {
        title: "Recordatorios automáticos",
        description:
          "Notificación push antes del corte y al primer día de morosidad. Menos cobranza manual.",
      },
      {
        title: "Fondo de reserva trazable",
        description:
          "Cada peso entra y sale con destino registrado. Auditoría sin sorpresas.",
      },
      {
        title: "Métricas de comunidad",
        description:
          "Tasa de morosidad, ingreso promedio, gastos por categoría. Lo que un comité necesita en 5 minutos.",
      },
      {
        title: "Reportes exportables",
        description:
          "PDF y Excel listos para junta vecinal o contabilidad externa.",
      },
      {
        title: "Multi-usuario seguro",
        description:
          "Tesorero, administrador y comité ven solo lo que les corresponde, con bitácora de quién consulta qué.",
      },
    ],
    benefits: [
      "Reduces la morosidad con avisos automáticos antes del vencimiento",
      "Cierras juntas vecinales sin pelear por los números",
      "Construyes confianza mostrando finanzas en tiempo real",
      "Liberas a tu administrador de horas semanales en cobranza manual",
    ],
    pullQuote:
      "La transparencia financiera no es un lujo. Es la base sobre la que se construye una comunidad que se respeta.",
    faqs: [
      {
        question: "¿Qué métodos de pago acepta Nest Living?",
        answer:
          "Tarjeta de crédito y débito, transferencia bancaria SPEI y efectivo registrado por el administrador. Todos los métodos quedan registrados con el mismo nivel de detalle.",
      },
      {
        question: "¿Puedo emitir factura desde la plataforma?",
        answer:
          "Sí. Cada pago puede generar una factura electrónica con los datos fiscales del residente, y se envía automáticamente por correo.",
      },
      {
        question: "¿Cómo manejo cuotas extraordinarias?",
        answer:
          "Creas una cuota extraordinaria con monto, plazo y unidades aplicables. Los residentes la ven en su estado de cuenta y reciben aviso. Útil para reparaciones grandes o derramas.",
      },
      {
        question: "¿Quién puede ver los reportes financieros?",
        answer:
          "Tú decides. Por defecto solo el administrador y el comité tienen acceso completo. Los residentes ven únicamente su propio estado de cuenta.",
      },
      {
        question: "¿Qué pasa si me equivoco al registrar un pago?",
        answer:
          "Puedes corregirlo. Cada movimiento mantiene un historial: quien lo creó, quien lo modificó y cuándo. Nada se borra silenciosamente; queda como auditable.",
      },
    ],
    keywords: [
      "pagos de mantenimiento",
      "cuotas residenciales",
      "morosidad condominio",
      "fondo de reserva",
      "estado de cuenta residente",
      "reportes financieros condominio",
    ],
  },

  // ============================================================
  // 4 — MANTENIMIENTO
  // ============================================================
  {
    slug: "mantenimiento",
    name: "Mantenimiento",
    eyebrow: "Servicio · 04",
    headline: "Reportar una fuga",
    headlineAccent: "y que se arregle.",
    subheadline:
      "Solicitudes que no se pierden, técnicos asignados con un click, residentes informados en cada paso. La operación de tu comunidad, sin tickets fantasma.",
    heroImage:
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?q=80&w=2070&auto=format&fit=crop",
    heroImageAlt:
      "Técnico de mantenimiento revisando una instalación de un edificio residencial",
    summary:
      "Crea, asigna y da seguimiento a solicitudes de mantenimiento sin que nada se quede en el olvido.",
    problem: {
      eyebrow: "Por qué importa",
      title: "El edificio se desgasta. Lo que se ignora hoy, se paga doble mañana.",
      body: "Una fuga reportada en el grupo de WhatsApp se pierde entre fotos de cumpleaños. El técnico nunca llega porque nadie le mandó la dirección. El residente vuelve a quejarse, esta vez molesto. Y cada problema chico se vuelve uno grande porque nadie tiene el control.",
      pains: [
        "Reportes que se pierden en chats y correos",
        "Técnicos sin información de qué arreglar ni dónde",
        "Residentes que no saben si su queja fue atendida",
        "Cero historial: el siguiente administrador empieza de cero",
      ],
    },
    howItWorks: [
      {
        title: "El residente reporta",
        description:
          "Desde su app, manda foto, descripción y ubicación exacta dentro del edificio. La solicitud llega a tu bandeja con todo el contexto.",
      },
      {
        title: "Asignas y agendas",
        description:
          "Eliges un técnico de tu lista de proveedores, defines fecha y prioridad. El técnico recibe el ticket con foto y dirección.",
      },
      {
        title: "Cierras y documentas",
        description:
          "Al terminar, marcas el ticket como resuelto y agregas notas o foto del arreglo. El residente recibe confirmación. Todo queda en historial para auditoría.",
      },
    ],
    features: [
      {
        title: "Tickets con foto y ubicación",
        description:
          "El residente reporta con contexto desde el primer momento. Adiós a “arreglar la cosa que está rota”.",
      },
      {
        title: "Asignación a proveedores",
        description:
          "Cada técnico recibe solo lo suyo. Sin reenviar correos, sin perder ventanas de atención.",
      },
      {
        title: "Estados claros",
        description:
          "Reportado, asignado, en progreso, resuelto. El residente sabe siempre dónde va su solicitud.",
      },
      {
        title: "Prioridad por urgencia",
        description:
          "Distinguir una bombilla fundida de una fuga que está dañando la unidad de abajo.",
      },
      {
        title: "Notas de cierre",
        description:
          "Foto y comentario del técnico al terminar. Útil para garantías y para la siguiente vez.",
      },
      {
        title: "Historial perpetuo",
        description:
          "Cada amenidad, cada unidad y cada proveedor mantiene su historial completo de mantenimientos.",
      },
    ],
    benefits: [
      "Reduces el tiempo de respuesta de días a horas",
      "Eliminas la fricción residente–administrador en quejas operativas",
      "Construyes una bitácora real para auditorías y planeación",
      "Detectas problemas recurrentes y los resuelves de raíz",
    ],
    pullQuote:
      "Una comunidad bien mantenida no se nota. Lo que se nota es cuando deja de estarlo.",
    faqs: [
      {
        question: "¿Los residentes pueden ver el avance de su solicitud?",
        answer:
          "Sí. Cada cambio de estado dispara una notificación push, y el residente ve el ticket completo en su app: foto que envió, técnico asignado, fecha estimada y notas de cierre.",
      },
      {
        question: "¿Puedo tener un equipo interno de mantenimiento?",
        answer:
          "Por supuesto. Puedes registrar tanto proveedores externos como personal interno. Cada uno con su propia agenda, costos y especialidad.",
      },
      {
        question: "¿Se pueden generar tickets recurrentes?",
        answer:
          "Sí. Para mantenimientos preventivos (limpieza de cisternas, fumigación, revisión de bombas) configuras un calendario y los tickets se generan automáticamente.",
      },
      {
        question: "¿Cómo manejo costos de cada solicitud?",
        answer:
          "Cada ticket puede llevar costo estimado y costo real al cierre. Esos números fluyen al módulo de finanzas para que el comité vea cuánto se gasta en mantenimiento por categoría.",
      },
      {
        question: "¿Qué pasa con las garantías?",
        answer:
          "Cada ticket cerrado guarda notas y foto. Si el problema reaparece dentro del periodo de garantía del proveedor, lo encuentras en segundos por unidad o tipo de falla.",
      },
    ],
    keywords: [
      "reportes de mantenimiento condominio",
      "tickets de mantenimiento residencial",
      "gestión de proveedores condominio",
      "mantenimiento preventivo edificio",
      "solicitudes de servicio residentes",
    ],
  },

  // ============================================================
  // 5 — COMUNIDAD
  // ============================================================
  {
    slug: "comunidad",
    name: "Comunidad y comunicación",
    eyebrow: "Servicio · 05",
    headline: "Anuncios oficiales,",
    headlineAccent: "no cadenas de WhatsApp.",
    subheadline:
      "Un feed con la voz oficial de la administración, broadcasts segmentados a tu push y conversaciones que tienen contexto. La comunicación que tu comunidad merece.",
    heroImage:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2070&auto=format&fit=crop",
    heroImageAlt:
      "Vecinos conversando en el lobby de su edificio residencial moderno",
    summary:
      "Un feed oficial, broadcasts segmentados y conversaciones con contexto. Comunicación que se entiende y se queda.",
    problem: {
      eyebrow: "Por qué importa",
      title: "El grupo de WhatsApp es el peor sistema de comunicación inventado para una comunidad.",
      body: "Mensajes oficiales mezclados con stickers y memes. Información crítica perdida en 200 notificaciones diarias. Residentes que se enteran tarde de lo importante, o que se enteran por terceros. Y un administrador agotado de repetir lo mismo cinco veces al día.",
      pains: [
        "Anuncios oficiales perdidos entre conversación informal",
        "Residentes silenciados en grupos por “demasiado ruido”",
        "Imposible saber quién leyó un aviso importante",
        "Cero historial: lo que pasó hace 3 meses se perdió",
      ],
    },
    howItWorks: [
      {
        title: "Publicas el anuncio",
        description:
          "Eliges entre publicación normal o anuncio oficial. Le pones título, contenido, etiqueta y foto si aplica. Lo fijas si es crítico.",
      },
      {
        title: "Tus residentes lo reciben",
        description:
          "Aparece en su feed, ordenado por relevancia. Si es urgente, mandas un push segmentado: a todos, a una torre o a un residente específico.",
      },
      {
        title: "Conversan con contexto",
        description:
          "Los residentes pueden reaccionar y responder en hilos, sin contaminar el resto del feed. Cada conversación queda atada a su tema.",
      },
    ],
    features: [
      {
        title: "Anuncios oficiales destacados",
        description:
          "Visualmente distintos del feed informal. Imposibles de confundir con un meme.",
      },
      {
        title: "Broadcasts segmentados",
        description:
          "A toda la comunidad, a una torre, o a un residente específico. Push directo al teléfono.",
      },
      {
        title: "Hilos de respuesta",
        description:
          "Cada publicación tiene su propia conversación. Sin contaminar el feed general.",
      },
      {
        title: "Reacciones",
        description:
          "Emojis para que los residentes acusen recibo de un anuncio sin necesidad de comentar.",
      },
      {
        title: "Anclar al inicio",
        description:
          "Lo crítico se queda visible. Lo viejo cede su lugar.",
      },
      {
        title: "Etiquetas y filtros",
        description:
          "Mantenimiento, eventos, seguridad, finanzas. Tus residentes encuentran lo que buscan.",
      },
    ],
    benefits: [
      "Tus avisos críticos llegan al 100% de los residentes",
      "Liberas tu WhatsApp personal del trabajo",
      "Construyes un historial de comunicación que sirve para auditorías",
      "Reduces malentendidos y “yo no sabía”",
    ],
    pullQuote:
      "Una comunidad que se comunica bien es una comunidad que se cuida bien.",
    faqs: [
      {
        question: "¿Mi anuncio llega como notificación push?",
        answer:
          "Si publicas un anuncio oficial, sí. También puedes enviar un broadcast push independiente sin publicar al feed, útil para avisos urgentes que no necesitan quedar en la línea de tiempo.",
      },
      {
        question: "¿Puedo segmentar a quién le llega un push?",
        answer:
          "Sí. Tres audiencias: toda la comunidad, residentes de una torre o piso específico, o un residente individual.",
      },
      {
        question: "¿Los residentes pueden publicar?",
        answer:
          "Tú lo decides. Por defecto pueden publicar en el feed, pero los anuncios oficiales solo los puede crear un administrador. Visualmente se distinguen para que nadie los confunda.",
      },
      {
        question: "¿Qué pasa con los datos de WhatsApp que ya tenemos?",
        answer:
          "No los importamos automáticamente — sería ruidoso y poco útil. Lo que sí hacemos es ayudarte a que el feed se vuelva el lugar oficial: con anuncios destacados y broadcasts segmentados, el grupo de WhatsApp se va vaciando solo.",
      },
      {
        question: "¿Puedo borrar publicaciones?",
        answer:
          "Sí, como administrador puedes borrar tus propias publicaciones y las inapropiadas de cualquier residente. La acción queda registrada para auditoría.",
      },
    ],
    keywords: [
      "comunicación residencial",
      "anuncios condominio",
      "feed comunidad residencial",
      "broadcast push residentes",
      "alternativa whatsapp condominio",
    ],
  },

  // ============================================================
  // 6 — DELIVERY
  // ============================================================
  {
    slug: "delivery",
    name: "Delivery interno",
    eyebrow: "Servicio · 06",
    headline: "Pedir desde el sillón,",
    headlineAccent: "comer en la mesa.",
    subheadline:
      "Un catálogo y un flujo de pedidos para la cocina de tu club, el mini-súper o los servicios internos. Tus residentes piden desde la app, tu staff opera desde la consola.",
    heroImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
    heroImageAlt:
      "Mesa servida con platillos preparados en la cocina del club residencial",
    summary:
      "Catálogo, productos, modificadores y flujo de órdenes para la cocina o el mini-súper interno de tu comunidad.",
    problem: {
      eyebrow: "Por qué importa",
      title: "Tener una cocina excelente y operarla con un grupo de WhatsApp.",
      body: "Pedidos que se confunden, modificadores que nadie escucha bien, cuentas que se calculan a mano y se cobran tres días después. Tu cocina es buena, pero la operación cuesta más de lo que vale.",
      pains: [
        "Pedidos perdidos entre llamadas y mensajes",
        "Modificadores (sin cebolla, doble queso) que se ignoran",
        "Cobranza a mano, errores de cuentas",
        "Cero visibilidad de qué se vende, qué no, y a qué hora",
      ],
    },
    howItWorks: [
      {
        title: "Configuras el menú",
        description:
          "Categorías, productos, fotos, precios y modificadores (tamaño, salsas, extras). Marcas el destacado del día y listo.",
      },
      {
        title: "Tus residentes piden",
        description:
          "Desde su app eligen, configuran modificadores y deciden cómo pagar: terminal o efectivo (con cambio calculado). El pedido aparece en tu consola al instante.",
      },
      {
        title: "Tu cocina opera con claridad",
        description:
          "Cada orden con su número, items, modificadores y notas. Avanzas el estado: confirmada → en preparación → en camino → entregada. Sin papeles, sin gritos.",
      },
    ],
    features: [
      {
        title: "Catálogo con categorías",
        description:
          "Pizzas, bebidas, postres, mini-súper. Un menú navegable que tus residentes entienden.",
      },
      {
        title: "Modificadores potentes",
        description:
          "Tamaños, ingredientes extra, salsas. Single o multi-selección, con reglas de mínimo y máximo.",
      },
      {
        title: "Producto destacado del día",
        description:
          "Marcas un producto como destacado y aparece en grande en la home de la app.",
      },
      {
        title: "Flujo de estados",
        description:
          "Pendiente, confirmada, en preparación, en camino, entregada. Tu cocina y tus residentes saben siempre dónde está cada orden.",
      },
      {
        title: "Pago en terminal o efectivo",
        description:
          "Selección al pedir. Si es efectivo, el residente indica con qué denominación paga y se calcula el cambio.",
      },
      {
        title: "Operadores de cocina",
        description:
          "Rol específico para tu staff: ven solo el módulo de delivery, no el resto del panel.",
      },
    ],
    benefits: [
      "Reduces errores en pedidos y cobros a casi cero",
      "Acortas el tiempo entre pedido y entrega",
      "Liberas a tu staff de tomar pedidos por teléfono o WhatsApp",
      "Sabes con datos qué se vende, qué hora pico tienes y qué retirar del menú",
    ],
    pullQuote:
      "Vender bien lo que ya vendes es la forma más barata de crecer.",
    faqs: [
      {
        question: "¿Sirve para mini-súper, no solo cocina?",
        answer:
          "Sí. El módulo es genérico: cualquier catálogo de productos con categorías y modificadores funciona. Cocina, mini-súper, servicio de tintorería, lo que tu club ofrezca.",
      },
      {
        question: "¿Cómo manejo productos agotados?",
        answer:
          "Marcas el producto como “agotado” y desaparece del menú de los residentes hasta que lo reactives. Las órdenes activas que ya lo incluían no se afectan.",
      },
      {
        question: "¿Mi staff de cocina puede usar Nest Living sin ser admin?",
        answer:
          "Sí. Le asignas el rol “operador de cocina” y solo ve el módulo de Delivery: órdenes y cambio de estado. No accede a residentes, finanzas ni nada más.",
      },
      {
        question: "¿Hay límite de productos en el catálogo?",
        answer:
          "No. Puedes tener tantas categorías y productos como necesites, con tantos modificadores como cada uno requiera.",
      },
      {
        question: "¿Cómo se cobra al residente?",
        answer:
          "Al pedir, el residente elige terminal (cargo a tarjeta directo) o efectivo. Si es efectivo, indica con qué denominación va a pagar y la app calcula el cambio para que tu staff lo prepare.",
      },
    ],
    keywords: [
      "delivery interno residencial",
      "pedidos cocina club",
      "menú digital condominio",
      "catálogo productos residentes",
      "operación cocina club residencial",
    ],
  },
];

/** Helper: encuentra un servicio por slug. */
export function getServiceBySlug(slug: string): ServiceContent | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
