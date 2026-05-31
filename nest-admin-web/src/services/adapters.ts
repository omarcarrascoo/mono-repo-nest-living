import {
  AdminReservation,
  Amenity,
  AmenityStatus,
  AuthUser,
  CartItem,
  CartItemModifier,
  Category,
  Club,
  ClubMember,
  ClubPrivacy,
  CommunityAuthor,
  CommunityPost,
  CommunityPostType,
  GlobalRole,
  Membership,
  MembershipStatus,
  Order,
  OrderStatus,
  OrderStatusEvent,
  PaymentSelection,
  Product,
  ProductCategory,
  ProductOption,
  ProductOptionGroup,
  ProductStatus,
  ReactionSummary,
  Reservation,
  ReservationStatus,
  Role,
} from "@/types/api";

/**
 * Adapters Mongo → cliente. El backend devuelve `_id`; aquí lo normalizamos a
 * `id` antes de que toque el store, igual que `nest-mobile/services/adapters.ts`.
 *
 * `Raw` es la forma sin tipar que llega de la red. Usamos un índice a `unknown`
 * (no `any`) y leemos cada campo con helpers tolerantes: es el único borde de
 * deserialización del cliente, así que el tipado laxo se queda contenido aquí.
 */
type Raw = Record<string, unknown>;

/** Lee una propiedad de un valor desconocido tratándolo como objeto. */
const get = (v: unknown, key: string): unknown =>
  v && typeof v === "object" ? (v as Raw)[key] : undefined;

/** A string (o undefined si null/undefined). */
const str = (v: unknown): string | undefined =>
  v === undefined || v === null ? undefined : String(v);

/** Primer id no vacío entre `_id` e `id`. */
const idOf = (v: unknown): string =>
  str(get(v, "_id")) ?? str(get(v, "id")) ?? "";

export function adaptAuthUser(raw: Raw): AuthUser {
  const favs = raw.favoriteAmenityIds;
  return {
    id: idOf(raw),
    email: str(raw.email) ?? "",
    fullName: str(raw.fullName) ?? "",
    globalRole: (raw.globalRole ?? null) as GlobalRole,
    dateOfBirth: str(raw.dateOfBirth),
    status: str(raw.status),
    avatar: str(raw.avatar),
    timezone: str(raw.timezone),
    notificationPreferences:
      raw.notificationPreferences as AuthUser["notificationPreferences"],
    favoriteAmenityIds: Array.isArray(favs) ? favs.map(String) : [],
  };
}

export function adaptClub(raw: Raw): Club {
  return {
    id: idOf(raw),
    name: str(raw.name) ?? "",
    description: str(raw.description),
    joinCode: str(raw.joinCode),
    privacy: (raw.privacy ?? "public") as ClubPrivacy,
    status: str(raw.status),
    createdAt: str(raw.createdAt),
  };
}

export function adaptMembership(raw: Raw): Membership {
  // El BE puede mandar:
  // (a) GET /clubs/me/memberships → { clubId: string, club: {...} }   (flat)
  // (b) Mongoose populate raw      → { clubId: { _id, name, ... } }  (nested)
  let clubId = "";
  let club: Membership["club"];

  if (raw.clubId && typeof raw.clubId === "object") {
    const c = raw.clubId;
    clubId = idOf(c);
    club = {
      id: clubId,
      name: str(get(c, "name")) ?? "",
      privacy: (get(c, "privacy") ?? "public") as ClubPrivacy,
      description: str(get(c, "description")) ?? null,
    };
  } else {
    clubId = str(raw.clubId) ?? "";
    if (raw.club && typeof raw.club === "object") {
      const c = raw.club;
      club = {
        id: str(get(c, "id")) ?? str(get(c, "_id")) ?? clubId,
        name: str(get(c, "name")) ?? "",
        privacy: (get(c, "privacy") ?? "public") as ClubPrivacy,
        description: str(get(c, "description")) ?? null,
      };
    }
  }

  return {
    id: idOf(raw),
    userId:
      raw.userId && typeof raw.userId === "object"
        ? idOf(raw.userId)
        : (str(raw.userId) ?? ""),
    clubId,
    role: (raw.role ?? "user") as Role,
    status: (raw.status ?? "pending") as MembershipStatus,
    unitNumber: str(raw.unitNumber),
    approvedAt: str(raw.approvedAt),
    createdAt: str(raw.createdAt),
    club,
  };
}

/**
 * Acepta dos shapes:
 * - Flat (GET /users/directory): { membershipId, id, email, fullName, ... }
 * - Anidado (GET /clubs/:clubId/memberships): { id (=membershipId), role,
 *   status, unitNumber, user: { id, fullName, email, avatar } }
 */
export function adaptClubMember(raw: Raw): ClubMember {
  const u = raw.user;
  return {
    membershipId:
      str(raw.membershipId) ?? str(raw._id) ?? str(raw.id) ?? "",
    id:
      str(get(u, "id")) ??
      str(get(u, "_id")) ??
      str(raw.userId) ??
      str(raw.id) ??
      "",
    email: str(raw.email) ?? str(get(u, "email")) ?? "",
    fullName: str(raw.fullName) ?? str(get(u, "fullName")) ?? "",
    avatar: str(raw.avatar) ?? str(get(u, "avatar")),
    role: (raw.role ?? "user") as Role,
    unitNumber: str(raw.unitNumber),
    status: (raw.status ?? "active") as MembershipStatus,
  };
}

// ============================================================
// Amenities + Categories
// ============================================================

const num = (v: unknown, def = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : def;
const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function adaptAmenity(raw: Raw): Amenity {
  return {
    id: idOf(raw),
    clubId: str(raw.clubId) ?? "",
    categoryId: str(raw.categoryId),
    title: str(raw.title) ?? "",
    description: str(raw.description) ?? "",
    image: str(raw.image) ?? "",
    location: str(raw.location) ?? "",
    rating: num(raw.rating, 0),
    reviews: num(raw.reviews, 0),
    status: (raw.status ?? "available") as AmenityStatus,
    nextSlot: str(raw.nextSlot),
    availableSlots: arr<string>(raw.availableSlots).map(String),
    capacity: typeof raw.capacity === "number" ? raw.capacity : undefined,
    schedule: raw.schedule as Amenity["schedule"],
    slotDurationMinutes:
      typeof raw.slotDurationMinutes === "number"
        ? raw.slotDurationMinutes
        : undefined,
    maxConcurrentReservations:
      typeof raw.maxConcurrentReservations === "number"
        ? raw.maxConcurrentReservations
        : undefined,
    maxPerUserPerDay:
      typeof raw.maxPerUserPerDay === "number"
        ? raw.maxPerUserPerDay
        : undefined,
    bookingLeadMinutes:
      typeof raw.bookingLeadMinutes === "number"
        ? raw.bookingLeadMinutes
        : undefined,
    bookingHorizonDays:
      typeof raw.bookingHorizonDays === "number"
        ? raw.bookingHorizonDays
        : undefined,
    timezone: str(raw.timezone),
    features: arr<{ icon: string; label: string }>(raw.features),
    rules: arr<string>(raw.rules).map(String),
  };
}

export function adaptCategory(raw: Raw): Category {
  return {
    id: idOf(raw),
    clubId: str(raw.clubId) ?? "",
    name: str(raw.name) ?? "",
    slug: str(raw.slug) ?? "",
    icon: str(raw.icon) ?? "grid",
    color: str(raw.color) ?? "#0f766e",
    sortOrder: num(raw.sortOrder, 0),
    active: raw.active !== false,
    amenityCount:
      typeof raw.amenityCount === "number" ? raw.amenityCount : undefined,
  };
}

// ============================================================
// Reservations
// ============================================================

export function adaptReservation(raw: Raw): Reservation {
  // amenityId puede venir populado como objeto o como string.
  let amenityId = "";
  let amenityTitle: string | undefined;
  let amenityImage: string | undefined;
  let amenityLocation: string | undefined;
  if (raw.amenityId && typeof raw.amenityId === "object") {
    const a = raw.amenityId;
    amenityId = idOf(a);
    amenityTitle = str(get(a, "title"));
    amenityImage = str(get(a, "image"));
    amenityLocation = str(get(a, "location"));
  } else {
    amenityId = str(raw.amenityId) ?? "";
  }

  return {
    id: idOf(raw),
    amenityId,
    amenityTitle: str(raw.amenityTitle) ?? amenityTitle,
    amenityImage: str(raw.amenityImage) ?? amenityImage,
    amenityLocation: str(raw.amenityLocation) ?? amenityLocation,
    userId: str(raw.userId) ?? "",
    clubId: str(raw.clubId) ?? "",
    startTime: str(raw.startTime) ?? "",
    endTime: str(raw.endTime) ?? "",
    status: (raw.status ?? "confirmed") as ReservationStatus,
    notes: str(raw.notes),
    cancelledAt: str(raw.cancelledAt),
    cancelledBy: str(raw.cancelledBy),
    reminderSentAt: str(raw.reminderSentAt),
    createdAt: str(raw.createdAt),
  };
}

export function adaptAdminReservation(raw: Raw): AdminReservation {
  const base = adaptReservation(raw);
  let user: AdminReservation["user"];
  if (raw.userId && typeof raw.userId === "object") {
    const u = raw.userId;
    user = {
      id: idOf(u),
      fullName: str(get(u, "fullName")) ?? "",
      email: str(get(u, "email")) ?? "",
      avatar: str(get(u, "avatar")),
      unitNumber: str(get(u, "unitNumber")),
    };
    base.userId = user.id;
  }
  return { ...base, user };
}

// ============================================================
// Delivery
// ============================================================

export function adaptProductCategory(raw: Raw): ProductCategory {
  return {
    id: idOf(raw),
    clubId: str(raw.clubId) ?? "",
    name: str(raw.name) ?? "",
    slug: str(raw.slug) ?? "",
    icon: str(raw.icon) ?? "package",
    color: str(raw.color),
    sortOrder: num(raw.sortOrder, 0),
    active: raw.active !== false,
    productCount:
      typeof raw.productCount === "number" ? raw.productCount : undefined,
  };
}

function adaptProductOption(raw: unknown): ProductOption {
  const r = (raw ?? {}) as Raw;
  return {
    id: str(r.id) ?? str(r._id) ?? "",
    name: str(r.name) ?? "",
    priceDelta: num(r.priceDelta, 0),
    available: r.available !== false,
    default: typeof r.default === "boolean" ? r.default : undefined,
  };
}

function adaptProductOptionGroup(raw: unknown): ProductOptionGroup {
  const r = (raw ?? {}) as Raw;
  return {
    id: str(r.id) ?? str(r._id) ?? "",
    name: str(r.name) ?? "",
    mode: r.mode === "multiple" ? "multiple" : "single",
    required: !!r.required,
    minSelections:
      typeof r.minSelections === "number" ? r.minSelections : undefined,
    maxSelections:
      typeof r.maxSelections === "number" ? r.maxSelections : undefined,
    options: arr(r.options).map(adaptProductOption),
  };
}

export function adaptProduct(raw: Raw): Product {
  const categoryId =
    raw.categoryId && typeof raw.categoryId === "object"
      ? idOf(raw.categoryId)
      : str(raw.categoryId) ?? "";

  return {
    id: idOf(raw),
    clubId: str(raw.clubId) ?? "",
    categoryId,
    name: str(raw.name) ?? "",
    description: str(raw.description),
    image: str(raw.image),
    price: num(raw.price, 0),
    originalPrice:
      typeof raw.originalPrice === "number" ? raw.originalPrice : undefined,
    status: (raw.status ?? "available") as ProductStatus,
    rating: typeof raw.rating === "number" ? raw.rating : undefined,
    reviewCount:
      typeof raw.reviewCount === "number" ? raw.reviewCount : undefined,
    prepTime: str(raw.prepTime),
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]).map(String) : undefined,
    optionGroups: arr(raw.optionGroups).map(adaptProductOptionGroup),
    featured: typeof raw.featured === "boolean" ? raw.featured : undefined,
  };
}

function adaptCartItemModifier(raw: unknown): CartItemModifier {
  const r = (raw ?? {}) as Raw;
  return {
    groupId: str(r.groupId) ?? "",
    groupName: str(r.groupName) ?? "",
    optionId: str(r.optionId) ?? "",
    optionName: str(r.optionName) ?? "",
    priceDelta: num(r.priceDelta, 0),
  };
}

function adaptCartItem(raw: unknown, idx: number): CartItem {
  const r = (raw ?? {}) as Raw;
  return {
    lineId: str(r.lineId) ?? str(r._id) ?? `line-${idx}`,
    productId: str(r.productId) ?? "",
    name: str(r.name) ?? "",
    image: str(r.image),
    unitPrice: num(r.unitPrice, 0),
    quantity: num(r.quantity, 1),
    modifiers: arr(r.modifiers).map(adaptCartItemModifier),
    notes: str(r.notes),
    lineTotal: num(r.lineTotal, 0),
  };
}

function adaptPayment(raw: unknown): PaymentSelection {
  const r = (raw ?? {}) as Raw;
  return {
    method: r.method === "cash" ? "cash" : "terminal",
    cashDenomination:
      typeof r.cashDenomination === "number"
        ? (r.cashDenomination as PaymentSelection["cashDenomination"])
        : undefined,
  };
}

function adaptOrderStatusEvent(raw: unknown): OrderStatusEvent {
  const r = (raw ?? {}) as Raw;
  return {
    status: r.status as OrderStatus,
    at: str(r.at) ?? "",
    byUserId: str(r.byUserId),
    note: str(r.note),
  };
}

export function adaptOrder(raw: Raw): Order {
  return {
    id: idOf(raw),
    clubId: str(raw.clubId) ?? "",
    userId: str(raw.userId) ?? "",
    orderNumber: str(raw.orderNumber) ?? "",
    items: arr(raw.items).map(adaptCartItem),
    subtotal: num(raw.subtotal, 0),
    total: num(raw.total, 0),
    payment: raw.payment ? adaptPayment(raw.payment) : { method: "terminal" },
    cashChange:
      typeof raw.cashChange === "number" ? raw.cashChange : undefined,
    status: (raw.status ?? "pending") as OrderStatus,
    statusHistory: arr(raw.statusHistory).map(adaptOrderStatusEvent),
    notes: str(raw.notes),
    createdAt: str(raw.createdAt) ?? "",
    updatedAt: str(raw.updatedAt),
  };
}

// ============================================================
// Community
// ============================================================

/**
 * Mongo serializa el campo `reactions` como `{ emoji: ObjectId[] }`. Lo
 * convertimos a un summary `{ emoji: count }` y, si tenemos `currentUserId`,
 * derivamos `myReaction` (o null).
 */
function summarizeReactions(
  raw: unknown,
  currentUserId?: string,
): { summary: ReactionSummary; mine: string | null } {
  const summary: ReactionSummary = {};
  let mine: string | null = null;
  if (!raw || typeof raw !== "object") return { summary, mine };
  const obj = raw as Record<string, unknown>;
  for (const emoji of Object.keys(obj)) {
    const ids = obj[emoji];
    if (!Array.isArray(ids)) continue;
    summary[emoji] = ids.length;
    if (
      currentUserId &&
      mine === null &&
      ids.some((id) => String(id) === currentUserId)
    ) {
      mine = emoji;
    }
  }
  return { summary, mine };
}

function adaptCommunityAuthor(raw: Raw): CommunityAuthor {
  return {
    id: str(raw.authorId) ?? "",
    name: str(raw.authorName) ?? "Vecino",
    avatar: str(raw.authorAvatar),
    role: (raw.authorRole ?? "user") as Role,
  };
}

export function adaptCommunityPost(
  raw: Raw,
  currentUserId?: string,
): CommunityPost {
  const { summary, mine } = summarizeReactions(raw.reactions, currentUserId);
  return {
    id: idOf(raw),
    clubId: str(raw.clubId) ?? "",
    type: (raw.type ?? "post") as CommunityPostType,
    author: adaptCommunityAuthor(raw),
    tag: str(raw.tag),
    title: str(raw.title) ?? "",
    content: str(raw.content) ?? "",
    image: str(raw.image),
    pinned: !!raw.pinned,
    reactions: summary,
    myReaction: mine,
    repliesCount: num(raw.repliesCount, 0),
    createdAt: str(raw.createdAt) ?? "",
    updatedAt: str(raw.updatedAt),
  };
}
