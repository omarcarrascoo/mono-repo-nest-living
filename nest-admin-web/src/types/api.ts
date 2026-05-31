/**
 * Tipos de la API — espejo del contrato compartido con el backend (`fly-api`)
 * y el móvil (`nest-mobile/types/api.ts`). Mantén ambos archivos alineados al
 * tocar el contrato.
 */

export type Role = "admin" | "user" | "kitchen_operator";
export type GlobalRole = "super_admin" | null;
export type MembershipStatus = "pending" | "active" | "rejected";
export type ClubPrivacy = "public" | "private";

export interface NotificationPreferences {
  reservationReminders: boolean;
  reservationUpdates: boolean;
  adminAlerts: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  globalRole: GlobalRole;
  dateOfBirth?: string;
  status?: string;
  avatar?: string;
  timezone?: string;
  notificationPreferences?: NotificationPreferences;
  favoriteAmenityIds?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  activeClubId: string | null;
  activeMembershipRole: Role | null;
}

export interface SwitchClubRequest {
  clubId: string;
}

// ============================================================
// Clubs + Memberships
// ============================================================

export interface Club {
  id: string;
  name: string;
  description?: string;
  joinCode?: string; // visible solo a admin/super_admin
  privacy: ClubPrivacy;
  status?: string;
  createdAt?: string;
}

export interface Membership {
  id: string;
  userId: string;
  clubId: string;
  role: Role;
  status: MembershipStatus;
  unitNumber?: string;
  approvedAt?: string;
  createdAt?: string;
  /** Cuando viene desde GET /clubs/me/memberships, el club viene poblado. */
  club?: Pick<Club, "id" | "name" | "privacy"> & { description?: string | null };
}

export interface CreateClubRequest {
  name: string;
  description?: string;
  privacy?: ClubPrivacy;
  joinCode?: string;
}

export interface UpdateClubRequest {
  name?: string;
  description?: string;
  privacy?: ClubPrivacy;
  status?: string;
  joinCode?: string;
}

export interface PromoteAdminRequest {
  userId: string;
  /** Rol a asignar. El backend default a 'admin' si se omite. */
  role?: Role;
}

export interface UpdateMembershipRequest {
  role?: Role;
  unitNumber?: string | null;
}

/** Item enriquecido devuelto por GET /clubs/:clubId/memberships (admin). */
export interface ClubMember {
  membershipId: string;
  id: string; // userId
  email: string;
  fullName: string;
  avatar?: string;
  role: Role;
  unitNumber?: string;
  status: MembershipStatus;
}

// ============================================================
// Amenities + Categories
// ============================================================

export type AmenityStatus = "available" | "busy" | "maintenance";

export interface DaySchedule {
  open: string; // HH:mm
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
  clubId: string;
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
  clubId: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sortOrder: number;
  active: boolean;
  amenityCount?: number;
}

// ============================================================
// Reservations
// ============================================================

export type ReservationStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Reservation {
  id: string;
  amenityId: string;
  amenityTitle?: string;
  amenityImage?: string;
  amenityLocation?: string;
  userId: string;
  clubId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  notes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  reminderSentAt?: string;
  createdAt?: string;
}

export interface ListReservationsResponse {
  items: Reservation[];
  nextCursor: string | null;
}

// ============================================================
// Delivery
// ============================================================

export interface ProductCategory {
  id: string;
  clubId: string;
  name: string;
  slug: string;
  icon: string;
  color?: string;
  sortOrder: number;
  active: boolean;
  productCount?: number;
}

export type OptionSelectMode = "single" | "multiple";

export interface ProductOption {
  id: string;
  name: string;
  priceDelta: number;
  available: boolean;
  default?: boolean;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  mode: OptionSelectMode;
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: ProductOption[];
}

export type ProductStatus = "available" | "sold_out" | "hidden";

export interface Product {
  id: string;
  clubId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  status: ProductStatus;
  rating?: number;
  reviewCount?: number;
  prepTime?: string;
  tags?: string[];
  optionGroups: ProductOptionGroup[];
  featured?: boolean;
}

export type PaymentMethodKind = "terminal" | "cash";
export type CashDenomination = 50 | 100 | 200 | 500 | 1000;

export interface PaymentSelection {
  method: PaymentMethodKind;
  cashDenomination?: CashDenomination;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  byUserId?: string;
  note?: string;
}

export interface CartItemModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  modifiers: CartItemModifier[];
  notes?: string;
  lineTotal: number;
}

export interface Order {
  id: string;
  clubId: string;
  userId: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  payment: PaymentSelection;
  cashChange?: number;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type OrderListFilter = "active" | "completed" | "all";

// ============================================================
// Community
// ============================================================

export type CommunityPostType = "announcement" | "post";
export type ReactionSummary = Record<string, number>;

export interface CommunityAuthor {
  id: string;
  name: string;
  avatar?: string;
  role: Role;
}

export interface CommunityPost {
  id: string;
  clubId: string;
  type: CommunityPostType;
  author: CommunityAuthor;
  tag?: string;
  title: string;
  content: string;
  image?: string;
  pinned: boolean;
  reactions: ReactionSummary;
  myReaction: string | null;
  repliesCount: number;
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
  type?: "all" | CommunityPostType;
  q?: string;
}

// ============================================================
// Notifications + Broadcast
// ============================================================

export type BroadcastAudience = "all" | "unit" | "user";

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

// ============================================================
// Admin (reservas + estadísticas)
// ============================================================

export interface AdminListReservationsParams {
  filter?: "upcoming" | "past" | "cancelled" | "all";
  userId?: string;
  amenityId?: string;
  cursor?: string;
  limit?: number;
}

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

// ============================================================
// Uploads (URL firmada hacia Supabase / R2)
// ============================================================

export type UploadKind = "amenity" | "product" | "avatar" | "post";
export type UploadMime = "image/jpeg" | "image/png" | "image/webp";

export interface SignUploadRequest {
  kind: UploadKind;
  contentType: UploadMime;
  contentLength: number;
}

export interface SignUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresIn: number;
}
