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
  | 'order_admin_alert';

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
