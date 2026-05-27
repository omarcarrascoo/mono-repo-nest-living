export type Role = 'admin' | 'user';

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
