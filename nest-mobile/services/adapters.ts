import {
  Amenity,
  AmenityStatus,
  AuthUser,
  AvailabilityResponse,
  AvailabilitySlot,
  CartItem,
  CartItemModifier,
  Category,
  CommunityAuthor,
  CommunityPost,
  CommunityPostType,
  CommunityReply,
  FeaturedProduct,
  Notification,
  NotificationKind,
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
} from '@/types/api';

type Raw = Record<string, any>;

export function adaptAmenity(raw: Raw): Amenity {
  return {
    id: raw._id ?? raw.id,
    residencyId: raw.residencyId,
    categoryId: raw.categoryId ? String(raw.categoryId) : undefined,
    title: raw.title ?? '',
    description: raw.description ?? '',
    image: raw.image ?? '',
    location: raw.location ?? '',
    rating: raw.rating ?? 0,
    reviews: raw.reviews ?? 0,
    status: (raw.status ?? 'available') as AmenityStatus,
    nextSlot: raw.nextSlot,
    availableSlots: Array.isArray(raw.availableSlots) ? raw.availableSlots : [],
    capacity: raw.capacity,
    schedule: raw.schedule,
    slotDurationMinutes: raw.slotDurationMinutes,
    maxConcurrentReservations: raw.maxConcurrentReservations,
    maxPerUserPerDay: raw.maxPerUserPerDay,
    bookingLeadMinutes: raw.bookingLeadMinutes,
    bookingHorizonDays: raw.bookingHorizonDays,
    timezone: raw.timezone,
    features: Array.isArray(raw.features) ? raw.features : [],
    rules: Array.isArray(raw.rules) ? raw.rules : [],
  };
}

export function adaptAuthUser(raw: Raw): AuthUser {
  return {
    id: raw._id ?? raw.id,
    email: raw.email,
    fullName: raw.fullName,
    role: raw.role,
    residencyId: raw.residencyId,
    status: raw.status,
    avatar: raw.avatar,
    unitNumber: raw.unitNumber,
    timezone: raw.timezone,
    notificationPreferences: raw.notificationPreferences,
    stats: raw.stats,
    lease: raw.lease,
    contacts: raw.contacts ?? [],
    documents: raw.documents ?? [],
  };
}

export function adaptCategory(raw: Raw): Category {
  return {
    id: raw._id ?? raw.id,
    residencyId: raw.residencyId,
    name: raw.name,
    slug: raw.slug,
    icon: raw.icon ?? 'grid',
    color: raw.color ?? '#0f766e',
    sortOrder: raw.sortOrder ?? 0,
    active: raw.active !== false,
    amenityCount: raw.amenityCount,
  };
}

export function adaptReservation(raw: Raw): Reservation {
  // amenityId puede venir populado como objeto o como string
  let amenityId = '';
  let amenityTitle: string | undefined;
  let amenityImage: string | undefined;
  let amenityLocation: string | undefined;
  if (raw.amenityId && typeof raw.amenityId === 'object') {
    amenityId = String(raw.amenityId._id ?? raw.amenityId.id ?? '');
    amenityTitle = raw.amenityId.title;
    amenityImage = raw.amenityId.image;
    amenityLocation = raw.amenityId.location;
  } else {
    amenityId = String(raw.amenityId ?? '');
  }

  return {
    id: raw._id ?? raw.id,
    amenityId,
    amenityTitle: raw.amenityTitle ?? amenityTitle,
    amenityImage: raw.amenityImage ?? amenityImage,
    amenityLocation: raw.amenityLocation ?? amenityLocation,
    userId: String(raw.userId ?? ''),
    residencyId: raw.residencyId,
    startTime: raw.startTime,
    endTime: raw.endTime,
    status: (raw.status ?? 'confirmed') as ReservationStatus,
    notes: raw.notes,
    cancelledAt: raw.cancelledAt,
    cancelledBy: raw.cancelledBy ? String(raw.cancelledBy) : undefined,
    reminderSentAt: raw.reminderSentAt,
    createdAt: raw.createdAt,
  };
}

export function adaptAvailabilitySlot(raw: Raw): AvailabilitySlot {
  return {
    startTime: raw.startTime,
    endTime: raw.endTime,
    available: !!raw.available,
    takenCount: raw.takenCount ?? 0,
    capacity: raw.capacity ?? 0,
    reason: raw.reason,
  };
}

export function adaptAvailability(raw: Raw): AvailabilityResponse {
  return {
    date: raw.date,
    timezone: raw.timezone,
    slots: Array.isArray(raw.slots) ? raw.slots.map(adaptAvailabilitySlot) : [],
  };
}

// ============================================================
// Delivery
// ============================================================

export function adaptProductCategory(raw: Raw): ProductCategory {
  return {
    id: raw._id ?? raw.id,
    residencyId: raw.residencyId,
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    icon: raw.icon ?? 'package',
    color: raw.color,
    sortOrder: raw.sortOrder ?? 0,
    active: raw.active !== false,
    productCount: raw.productCount,
  };
}

function adaptProductOption(raw: Raw): ProductOption {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: raw.name ?? '',
    priceDelta: typeof raw.priceDelta === 'number' ? raw.priceDelta : 0,
    available: raw.available !== false,
    default: raw.default,
  };
}

function adaptProductOptionGroup(raw: Raw): ProductOptionGroup {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: raw.name ?? '',
    mode: raw.mode === 'multiple' ? 'multiple' : 'single',
    required: !!raw.required,
    minSelections: raw.minSelections,
    maxSelections: raw.maxSelections,
    options: Array.isArray(raw.options) ? raw.options.map(adaptProductOption) : [],
  };
}

export function adaptProduct(raw: Raw): Product {
  const categoryId =
    raw.categoryId && typeof raw.categoryId === 'object'
      ? String(raw.categoryId._id ?? raw.categoryId.id ?? '')
      : String(raw.categoryId ?? '');

  return {
    id: raw._id ?? raw.id,
    residencyId: raw.residencyId,
    categoryId,
    name: raw.name ?? '',
    description: raw.description,
    image: raw.image,
    price: typeof raw.price === 'number' ? raw.price : 0,
    originalPrice: raw.originalPrice,
    status: (raw.status ?? 'available') as ProductStatus,
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    prepTime: raw.prepTime,
    tags: Array.isArray(raw.tags) ? raw.tags : undefined,
    optionGroups: Array.isArray(raw.optionGroups)
      ? raw.optionGroups.map(adaptProductOptionGroup)
      : [],
    featured: raw.featured,
  };
}

export function adaptFeaturedProduct(raw: Raw): FeaturedProduct {
  const product = raw.product ? adaptProduct(raw.product) : null;
  return {
    productId: String(raw.productId ?? product?.id ?? ''),
    product: product as Product,
    headline: raw.headline ?? '',
    subheadline: raw.subheadline,
    validUntil: raw.validUntil,
  };
}

function adaptCartItemModifier(raw: Raw): CartItemModifier {
  return {
    groupId: String(raw.groupId ?? ''),
    groupName: raw.groupName ?? '',
    optionId: String(raw.optionId ?? ''),
    optionName: raw.optionName ?? '',
    priceDelta: typeof raw.priceDelta === 'number' ? raw.priceDelta : 0,
  };
}

function adaptCartItem(raw: Raw, idx: number): CartItem {
  return {
    lineId: String(raw.lineId ?? raw._id ?? `line-${idx}`),
    productId: String(raw.productId ?? ''),
    name: raw.name ?? '',
    image: raw.image,
    unitPrice: typeof raw.unitPrice === 'number' ? raw.unitPrice : 0,
    quantity: typeof raw.quantity === 'number' ? raw.quantity : 1,
    modifiers: Array.isArray(raw.modifiers) ? raw.modifiers.map(adaptCartItemModifier) : [],
    notes: raw.notes,
    lineTotal: typeof raw.lineTotal === 'number' ? raw.lineTotal : 0,
  };
}

function adaptPayment(raw: Raw): PaymentSelection {
  return {
    method: raw.method === 'cash' ? 'cash' : 'terminal',
    cashDenomination: raw.cashDenomination,
  };
}

function adaptOrderStatusEvent(raw: Raw): OrderStatusEvent {
  return {
    status: raw.status as OrderStatus,
    at: raw.at,
    byUserId: raw.byUserId ? String(raw.byUserId) : undefined,
    note: raw.note,
  };
}

export function adaptOrder(raw: Raw): Order {
  return {
    id: raw._id ?? raw.id,
    residencyId: raw.residencyId,
    userId: String(raw.userId ?? ''),
    orderNumber: raw.orderNumber ?? '',
    items: Array.isArray(raw.items) ? raw.items.map(adaptCartItem) : [],
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
    total: typeof raw.total === 'number' ? raw.total : 0,
    payment: raw.payment ? adaptPayment(raw.payment) : { method: 'terminal' },
    cashChange: raw.cashChange,
    status: (raw.status ?? 'pending') as OrderStatus,
    statusHistory: Array.isArray(raw.statusHistory)
      ? raw.statusHistory.map(adaptOrderStatusEvent)
      : [],
    notes: raw.notes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ============================================================
// Community
// ============================================================

/**
 * Backend devuelve `reactions` como objeto `{ emoji: ObjectId[] }`. Lo
 * convertimos a un summary `{ emoji: count }` y, dado un `currentUserId`,
 * calculamos `myReaction` (o null si el usuario no reaccionó).
 *
 * Mongo a veces serializa Map como `{}` literal, otras veces como
 * `{ emoji: [id, id] }` plano. Tratamos ambos.
 */
function summarizeReactions(
  raw: Raw | undefined,
  currentUserId?: string,
): { summary: ReactionSummary; mine: string | null } {
  const summary: ReactionSummary = {};
  let mine: string | null = null;
  if (!raw || typeof raw !== 'object') return { summary, mine };
  for (const emoji of Object.keys(raw)) {
    const ids = raw[emoji];
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
    id: raw.authorId ? String(raw.authorId) : '',
    name: raw.authorName ?? 'Vecino',
    avatar: raw.authorAvatar,
    role: (raw.authorRole ?? 'user') as Role,
  };
}

export function adaptCommunityPost(
  raw: Raw,
  currentUserId?: string,
): CommunityPost {
  const { summary, mine } = summarizeReactions(raw.reactions, currentUserId);
  return {
    id: raw._id ?? raw.id,
    residencyId: raw.residencyId,
    type: (raw.type ?? 'post') as CommunityPostType,
    author: adaptCommunityAuthor(raw),
    tag: raw.tag,
    title: raw.title ?? '',
    content: raw.content ?? '',
    image: raw.image,
    pinned: !!raw.pinned,
    reactions: summary,
    myReaction: mine,
    repliesCount: typeof raw.repliesCount === 'number' ? raw.repliesCount : 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function adaptCommunityReply(
  raw: Raw,
  currentUserId?: string,
): CommunityReply {
  const { summary, mine } = summarizeReactions(raw.reactions, currentUserId);
  return {
    id: raw._id ?? raw.id,
    postId: raw.postId ? String(raw.postId) : '',
    parentReplyId: raw.parentReplyId ? String(raw.parentReplyId) : null,
    depth: typeof raw.depth === 'number' ? raw.depth : 0,
    author: adaptCommunityAuthor(raw),
    content: raw.content ?? '',
    reactions: summary,
    myReaction: mine,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ============================================================
// Notifications inbox
// ============================================================

export function adaptNotification(raw: Raw): Notification {
  return {
    id: raw._id ?? raw.id,
    kind: raw.kind as NotificationKind,
    title: raw.title ?? '',
    body: raw.body,
    data: raw.data,
    read: !!raw.read,
    readAt: raw.readAt,
    createdAt: raw.createdAt,
  };
}
