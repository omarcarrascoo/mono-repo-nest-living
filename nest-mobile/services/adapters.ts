import {
  Amenity,
  AmenityStatus,
  AuthUser,
  AvailabilityResponse,
  AvailabilitySlot,
  Category,
  Reservation,
  ReservationStatus,
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
