export type Role = 'admin' | 'user' | 'kitchen_operator';

export interface NotificationPreferences {
  reservationReminders: boolean;
  reservationUpdates: boolean;
  adminAlerts: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  residencyId: string;
  status?: string;
  avatar?: string;
  unitNumber?: string;
  timezone?: string;
  notificationPreferences?: NotificationPreferences;
  stats?: {
    balanceOwed?: number;
    delinquencyRate?: number;
    lastPaymentDate?: string;
  };
  lease?: {
    startDate?: string;
    endDate?: string;
    rentAmount?: string;
    securityDeposit?: string;
    daysLeft?: number;
  };
  contacts?: any[];
  documents?: any[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  residencyId: string;
  role?: Role;
  unitNumber?: string;
}

export type AmenityStatus = 'available' | 'busy' | 'maintenance';

export interface DaySchedule {
  open: string;  // HH:mm
  close: string; // HH:mm
  closed: boolean;
}

export interface WeeklySchedule {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
}

export interface Amenity {
  id: string;
  residencyId: string;
  categoryId?: string;
  title: string;
  description?: string;
  image?: string;
  location?: string;
  rating: number;
  reviews: number;
  status: AmenityStatus;
  nextSlot?: string;
  availableSlots: string[];
  capacity?: number;
  schedule?: WeeklySchedule;
  slotDurationMinutes?: number;
  maxConcurrentReservations?: number;
  maxPerUserPerDay?: number;
  bookingLeadMinutes?: number;
  bookingHorizonDays?: number;
  timezone?: string;
  features: { icon: string; label: string }[];
  rules: string[];
}

export interface Category {
  id: string;
  residencyId: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sortOrder: number;
  active: boolean;
  amenityCount?: number;
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Reservation {
  id: string;
  amenityId: string;
  amenityTitle?: string;
  amenityImage?: string;
  amenityLocation?: string;
  userId: string;
  residencyId: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  status: ReservationStatus;
  notes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  reminderSentAt?: string;
  createdAt?: string;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  takenCount: number;
  capacity: number;
  reason?: 'lead_time' | 'horizon' | 'closed' | 'past' | 'full';
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}

export interface ListReservationsResponse {
  items: Reservation[];
  nextCursor: string | null;
}

export interface CreateReservationRequest {
  amenityId: string;
  startTime: string; // ISO
  notes?: string;
}

export interface UpdateReservationRequest {
  startTime?: string;
  notes?: string;
}

export interface RegisterPushTokenRequest {
  expoPushToken: string;
  platform?: 'ios' | 'android' | 'web' | 'unknown';
  deviceName?: string;
}

export interface FavoriteIdsResponse {
  ids: string[];
}

// ============================================================
// Delivery
// ============================================================

export interface ProductCategory {
  id: string;
  residencyId: string;
  name: string;
  slug: string;
  icon: string;
  color?: string;
  sortOrder: number;
  active: boolean;
  productCount?: number;
}

/** Reglas de selección sobre un grupo de opciones (size, salsa, extras…). */
export type OptionSelectMode = 'single' | 'multiple';

export interface ProductOption {
  id: string;
  name: string;
  /** Delta en MXN sobre el precio base del producto. Puede ser 0 o negativo. */
  priceDelta: number;
  available: boolean;
  /** Si default=true, viene preseleccionado al abrir el detalle. */
  default?: boolean;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  mode: OptionSelectMode;
  required: boolean;
  /** Solo aplica si mode === 'multiple'. */
  minSelections?: number;
  maxSelections?: number;
  options: ProductOption[];
}

export type ProductStatus = 'available' | 'sold_out' | 'hidden';

export interface Product {
  id: string;
  residencyId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  /** Precio base, en MXN. Los modificadores se suman encima. */
  price: number;
  /** Si tiene oferta activa, se muestra este precio tachado debajo del actual. */
  originalPrice?: number;
  status: ProductStatus;
  rating?: number;
  reviewCount?: number;
  /** Tiempo de preparación estimado, e.g. "20-30 min". */
  prepTime?: string;
  tags?: string[];
  optionGroups: ProductOptionGroup[];
  /** Marcado por admin como "destacado del día". */
  featured?: boolean;
}

/** Producto destacado del día — wrapper con copy editorial. */
export interface FeaturedProduct {
  productId: string;
  product: Product;
  headline: string;
  subheadline?: string;
  /** Vence en (ISO). */
  validUntil?: string;
}

/** Una selección concreta del usuario sobre un option group. */
export interface CartItemModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  /** Generado en cliente — un mismo producto puede aparecer N veces con
   *  modifiers distintos, así que el `id` del producto no sirve como key. */
  lineId: string;
  productId: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  modifiers: CartItemModifier[];
  notes?: string;
  /** unitPrice + sum(modifier.priceDelta), persistido para render rápido. */
  lineTotal: number;
}

export type PaymentMethodKind = 'terminal' | 'cash';

/** Denominaciones de billete de México que aceptamos como "con qué paga". */
export type CashDenomination = 50 | 100 | 200 | 500 | 1000;

export interface PaymentSelection {
  method: PaymentMethodKind;
  /** Solo cuando method === 'cash'. Permite calcular el cambio. */
  cashDenomination?: CashDenomination;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string; // ISO
  byUserId?: string;
  note?: string;
}

export interface Order {
  id: string;
  residencyId: string;
  userId: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  payment: PaymentSelection;
  /** Solo cuando payment.method === 'cash'. */
  cashChange?: number;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    /**
     * Selecciones agrupadas por groupId. El BE las valida contra los option
     * groups del producto (required, single/multiple, maxSelections).
     */
    selections: Array<{ groupId: string; optionIds: string[] }>;
    notes?: string;
  }>;
  payment: PaymentSelection;
  notes?: string;
}

export interface ListProductsParams {
  q?: string;
  category?: string;
  status?: ProductStatus;
  featured?: boolean;
}

export interface ListProductsResponse {
  items: Product[];
}

export type OrderListFilter = 'active' | 'completed' | 'all';

// ============================================================
// Notifications inbox
// ============================================================

export type NotificationKind =
  | 'reservation_created'
  | 'reservation_cancelled'
  | 'reservation_reminder'
  | 'admin_alert'
  | 'order_created'
  | 'order_status_update'
  | 'order_cancelled'
  | 'order_admin_alert'
  | 'community_announcement'
  | 'community_post_reply'
  | 'community_reply_reply';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================================
// Community
// ============================================================

export type CommunityPostType = 'announcement' | 'post';

export const REACTION_EMOJIS = ['❤️', '👍', '😊', '🎉', '😢', '🚀'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Mapa emoji → cantidad de gente que reaccionó. Lo derivamos del backend. */
export type ReactionSummary = Record<string, number>;

export interface CommunityAuthor {
  id: string;
  name: string;
  avatar?: string;
  role: Role;
}

export interface CommunityPost {
  id: string;
  residencyId: string;
  type: CommunityPostType;
  author: CommunityAuthor;
  tag?: string;
  title: string;
  content: string;
  image?: string;
  pinned: boolean;
  reactions: ReactionSummary;
  /** Emoji con el que el usuario actual reaccionó (o null si no). */
  myReaction: string | null;
  repliesCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityReply {
  id: string;
  postId: string;
  parentReplyId: string | null;
  depth: number;
  author: CommunityAuthor;
  content: string;
  reactions: ReactionSummary;
  myReaction: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePostRequest {
  type?: CommunityPostType;
  tag?: string;
  title: string;
  content: string;
  image?: string;
  pinned?: boolean;
}

export interface UpdatePostRequest {
  tag?: string;
  title?: string;
  content?: string;
  image?: string;
  pinned?: boolean;
}

export interface ListPostsParams {
  type?: 'all' | CommunityPostType;
  q?: string;
}

export interface CreateReplyRequest {
  parentReplyId?: string;
  content: string;
}

// ============================================================
// Admin
// ============================================================

export interface DirectoryUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
  unitNumber?: string;
}

export interface AdminListReservationsParams {
  filter?: 'upcoming' | 'past' | 'cancelled' | 'all';
  userId?: string;
  amenityId?: string;
  cursor?: string;
  limit?: number;
}

/**
 * Reserva en el panel admin: trae el usuario poblado (no solo `userId` string).
 * Reusamos `Reservation` para los demás campos.
 */
export interface AdminReservation extends Reservation {
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
    unitNumber?: string;
  };
}

export interface AdminListReservationsResponse {
  items: AdminReservation[];
  nextCursor: string | null;
}

export type BroadcastAudience = 'all' | 'unit' | 'user';

export interface BroadcastNotificationRequest {
  title: string;
  body: string;
  audience: BroadcastAudience;
  unitPrefix?: string;
  userId?: string;
}

export interface BroadcastNotificationResponse {
  sent: number;
  audience: BroadcastAudience;
}

export interface AdminTopAmenity {
  amenityId: string;
  count: number;
  title: string | null;
}

export interface AdminReservationStats {
  totals: { today: number; week: number; month: number };
  topAmenities: AdminTopAmenity[];
  cancellationRate: number;
  /** 24-element array, index = hour 0..23. */
  hourOccupancy: number[];
}
