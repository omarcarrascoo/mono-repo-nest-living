import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation } from './schemas/reservation.schema';
import { Amenity } from '../amenities/schemas/amenity.schema';
import {
  combineDateAndTimeInTz,
  dayKeyForDateInTz,
  parseHHmm,
} from './lib/timezone';

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  takenCount: number;
  capacity: number;
  reason?: 'lead_time' | 'horizon' | 'closed' | 'past' | 'full';
}

export interface ListReservationsOptions {
  userId: string;
  filter: 'upcoming' | 'past' | 'cancelled' | 'all';
  cursor?: string;
  limit: number;
}

export interface AdminListReservationsOptions {
  clubId: string;
  filter: 'upcoming' | 'past' | 'cancelled' | 'all';
  userId?: string;
  amenityId?: string;
  cursor?: string;
  limit: number;
}

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  /** Campos del amenity que el frontend muestra en cards / detalle. */
  private static readonly AMENITY_POPULATE = {
    path: 'amenityId',
    select: 'title image location categoryId',
  } as const;

  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<Reservation>,
    @InjectModel(Amenity.name)
    private amenityModel: Model<Amenity>,
  ) {}

  private async hydrate(doc: any) {
    if (!doc) return doc;
    return this.reservationModel.populate(doc, ReservationsService.AMENITY_POPULATE);
  }

  // ============================================================
  // Availability
  // ============================================================

  async getAvailability(
    amenityId: string,
    clubId: string,
    dateStr: string,
  ): Promise<{
    amenityId: string;
    date: string;
    timezone: string;
    slots: AvailabilitySlot[];
  }> {
    const amenity = await this.amenityModel
      .findOne({ _id: amenityId, clubId })
      .lean()
      .exec();
    if (!amenity) throw new NotFoundException('Amenity not found');

    const tz = amenity.timezone ?? 'America/Mexico_City';
    const dayKey = dayKeyForDateInTz(dateStr, tz);
    const day = (amenity.schedule as any)?.[dayKey];

    if (!day || day.closed) {
      return { amenityId, date: dateStr, timezone: tz, slots: [] };
    }

    // Generamos boundaries del día como Date UTC
    const dayStartUtc = combineDateAndTimeInTz(dateStr, day.open, tz);
    const dayEndUtc = combineDateAndTimeInTz(dateStr, day.close, tz);

    const dur = (amenity.slotDurationMinutes ?? 60) * 60_000;
    const lead = (amenity.bookingLeadMinutes ?? 0) * 60_000;
    const horizonMs =
      (amenity.bookingHorizonDays ?? 14) * 24 * 60 * 60 * 1000;

    const now = Date.now();
    const horizonAt = now + horizonMs;
    const cap = Math.max(amenity.maxConcurrentReservations ?? 1, 1);

    // Una sola query para todas las reservas confirmadas del día
    const taken = await this.reservationModel
      .find({
        amenityId: new Types.ObjectId(amenityId),
        status: 'confirmed',
        startTime: { $gte: dayStartUtc, $lt: dayEndUtc },
      })
      .select('startTime')
      .lean()
      .exec();

    const counts = new Map<number, number>();
    for (const r of taken) {
      const k = new Date(r.startTime).getTime();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const slots: AvailabilitySlot[] = [];
    for (
      let t = dayStartUtc.getTime();
      t + dur <= dayEndUtc.getTime();
      t += dur
    ) {
      const start = new Date(t);
      const end = new Date(t + dur);
      const takenCount = counts.get(t) ?? 0;

      let available = true;
      let reason: AvailabilitySlot['reason'] | undefined;

      if (t < now) {
        available = false;
        reason = 'past';
      } else if (t < now + lead) {
        available = false;
        reason = 'lead_time';
      } else if (t > horizonAt) {
        available = false;
        reason = 'horizon';
      } else if (takenCount >= cap) {
        available = false;
        reason = 'full';
      }

      slots.push({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        available,
        takenCount,
        capacity: cap,
        reason,
      });
    }

    return { amenityId, date: dateStr, timezone: tz, slots };
  }

  // ============================================================
  // Create
  // ============================================================

  async create(
    userId: string,
    clubId: string,
    amenityId: string,
    startTimeIso: string,
    notes?: string,
  ) {
    const amenity = await this.amenityModel
      .findOne({ _id: amenityId, clubId })
      .lean()
      .exec();
    if (!amenity) throw new NotFoundException('Amenity not found');

    const startTime = new Date(startTimeIso);
    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime');
    }

    // 1) Slot debe alinear con la rejilla
    const tz = amenity.timezone ?? 'America/Mexico_City';
    const dur = (amenity.slotDurationMinutes ?? 60) * 60_000;

    const dateInTz = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(startTime); // 'YYYY-MM-DD' en zona de la amenidad

    const dayKey = dayKeyForDateInTz(dateInTz, tz);
    const day = (amenity.schedule as any)?.[dayKey];
    if (!day || day.closed) {
      throw new BadRequestException('Amenity closed on this date');
    }

    const dayStart = combineDateAndTimeInTz(dateInTz, day.open, tz);
    const dayEnd = combineDateAndTimeInTz(dateInTz, day.close, tz);
    const offsetFromStart = startTime.getTime() - dayStart.getTime();
    if (
      offsetFromStart < 0 ||
      offsetFromStart % dur !== 0 ||
      startTime.getTime() + dur > dayEnd.getTime()
    ) {
      throw new BadRequestException(
        'Selected time does not align with available slots',
      );
    }

    // 2) Lead time + horizon
    const now = Date.now();
    const lead = (amenity.bookingLeadMinutes ?? 0) * 60_000;
    if (startTime.getTime() < now + lead) {
      throw new BadRequestException(
        `Reservations must be made at least ${amenity.bookingLeadMinutes ?? 0} minutes in advance`,
      );
    }
    const horizon =
      (amenity.bookingHorizonDays ?? 14) * 24 * 60 * 60 * 1000;
    if (startTime.getTime() > now + horizon) {
      throw new BadRequestException(
        `Reservations cannot be made more than ${amenity.bookingHorizonDays ?? 14} days in advance`,
      );
    }

    const endTime = new Date(startTime.getTime() + dur);

    // 3) Per-user-per-day cap
    if ((amenity.maxPerUserPerDay ?? 0) > 0) {
      const userDayStart = combineDateAndTimeInTz(dateInTz, '00:00', tz);
      const userDayEnd = combineDateAndTimeInTz(dateInTz, '23:59', tz);
      const usedToday = await this.reservationModel.countDocuments({
        amenityId: new Types.ObjectId(amenityId),
        userId: new Types.ObjectId(userId),
        status: 'confirmed',
        startTime: { $gte: userDayStart, $lte: userDayEnd },
      });
      if (usedToday >= amenity.maxPerUserPerDay) {
        throw new ForbiddenException(
          `You already reached your limit of ${amenity.maxPerUserPerDay} reservation(s) per day for this amenity`,
        );
      }
    }

    // 4) Capacity check + create — atomic via transaction
    const cap = Math.max(amenity.maxConcurrentReservations ?? 1, 1);
    const session = await this.reservationModel.db.startSession();
    try {
      let created: any;
      await session.withTransaction(async () => {
        const taken = await this.reservationModel
          .countDocuments({
            amenityId: new Types.ObjectId(amenityId),
            status: 'confirmed',
            startTime,
          })
          .session(session);
        if (taken >= cap) {
          throw new ConflictException('Slot is full');
        }
        const docs = await this.reservationModel.create(
          [
            {
              clubId,
              amenityId: new Types.ObjectId(amenityId),
              userId: new Types.ObjectId(userId),
              startTime,
              endTime,
              status: 'confirmed',
              notes,
            },
          ],
          { session },
        );
        created = docs[0];
      });
      return this.hydrate(created);
    } catch (err: any) {
      // Si capacity = 1, el índice único parcial puede atrapar el race
      if (err?.code === 11000) {
        throw new ConflictException('Slot was just taken');
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // List / Get / Cancel / Modify
  // ============================================================

  async list(opts: ListReservationsOptions) {
    const { userId, filter, limit, cursor } = opts;
    const baseFilter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    const now = new Date();

    switch (filter) {
      case 'upcoming':
        baseFilter.status = 'confirmed';
        baseFilter.startTime = { $gte: now };
        break;
      case 'past':
        baseFilter.status = { $in: ['confirmed', 'completed'] };
        baseFilter.startTime = { $lt: now };
        break;
      case 'cancelled':
        baseFilter.status = 'cancelled';
        break;
      case 'all':
      default:
        break;
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      baseFilter.startTime = {
        ...(baseFilter.startTime ?? {}),
        $lt: cursorDate,
      };
    }

    const sortDir = filter === 'upcoming' ? 1 : -1;
    const items = await this.reservationModel
      .find(baseFilter)
      .populate(ReservationsService.AMENITY_POPULATE)
      .sort({ startTime: sortDir })
      .limit(limit)
      .lean()
      .exec();

    const nextCursor =
      items.length === limit ? items[items.length - 1].startTime : null;

    return { items, nextCursor };
  }

  async listForClub(opts: AdminListReservationsOptions) {
    const { clubId, filter, limit, cursor, userId, amenityId } = opts;
    const baseFilter: Record<string, any> = { clubId };
    if (userId) baseFilter.userId = new Types.ObjectId(userId);
    if (amenityId) baseFilter.amenityId = new Types.ObjectId(amenityId);

    const now = new Date();
    switch (filter) {
      case 'upcoming':
        baseFilter.status = 'confirmed';
        baseFilter.startTime = { $gte: now };
        break;
      case 'past':
        baseFilter.status = { $in: ['confirmed', 'completed'] };
        baseFilter.startTime = { $lt: now };
        break;
      case 'cancelled':
        baseFilter.status = 'cancelled';
        break;
      case 'all':
      default:
        break;
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      baseFilter.startTime = {
        ...(baseFilter.startTime ?? {}),
        $lt: cursorDate,
      };
    }

    const sortDir = filter === 'upcoming' ? 1 : -1;
    const items = await this.reservationModel
      .find(baseFilter)
      .populate(ReservationsService.AMENITY_POPULATE)
      .populate({ path: 'userId', select: '_id fullName email avatar unitNumber' })
      .sort({ startTime: sortDir })
      .limit(limit)
      .lean()
      .exec();

    const nextCursor =
      items.length === limit ? items[items.length - 1].startTime : null;

    return { items, nextCursor };
  }

  async findOne(id: string, userId: string, isAdmin: boolean) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Reservation not found');
    }
    const r = await this.reservationModel
      .findById(id)
      .populate(ReservationsService.AMENITY_POPULATE)
      .lean()
      .exec();
    if (!r) throw new NotFoundException('Reservation not found');
    if (!isAdmin && String(r.userId) !== String(userId)) {
      throw new ForbiddenException('Not your reservation');
    }
    return r;
  }

  async cancel(id: string, userId: string, isAdmin: boolean) {
    const r = await this.reservationModel.findById(id);
    if (!r) throw new NotFoundException('Reservation not found');
    if (!isAdmin && String(r.userId) !== String(userId)) {
      throw new ForbiddenException('Not your reservation');
    }
    if (r.status === 'cancelled') return this.hydrate(r);
    r.status = 'cancelled';
    r.cancelledAt = new Date();
    r.cancelledBy = new Types.ObjectId(userId);
    await r.save();
    return this.hydrate(r);
  }

  async modify(
    id: string,
    userId: string,
    isAdmin: boolean,
    newStartTimeIso: string,
    notes?: string,
  ) {
    const original = await this.reservationModel.findById(id);
    if (!original) throw new NotFoundException('Reservation not found');
    if (!isAdmin && String(original.userId) !== String(userId)) {
      throw new ForbiddenException('Not your reservation');
    }
    if (original.status !== 'confirmed') {
      throw new BadRequestException(
        'Only confirmed reservations can be modified',
      );
    }

    // Mover = cancelar + crear nuevo, atómico
    const session = await this.reservationModel.db.startSession();
    try {
      let created: any;
      await session.withTransaction(async () => {
        original.status = 'cancelled';
        original.cancelledAt = new Date();
        original.cancelledBy = new Types.ObjectId(userId);
        await original.save({ session });
      });
      // Salimos de la transacción anterior y creamos el nuevo (que tiene su
      // propia transacción interna para checar capacidad). Si falla, el cancel
      // ya está hecho — mantenemos comportamiento "best-effort": el usuario
      // puede simplemente reservar el nuevo slot. Documentamos en el endpoint.
      created = await this.create(
        userId,
        String(original.clubId),
        String(original.amenityId),
        newStartTimeIso,
        notes ?? original.notes,
      );
      return created;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Stats del dashboard admin. Todo scoped por clubId. Las ventanas
   * "today/week/month" son ventanas relativas: últimas 24h / últimos 7 días /
   * últimos 30 días — no calendario natural, para que sea barato y predecible.
   */
  async getAdminStats(clubId: string) {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const baseMatch = { clubId };

    const [counts, topAmenitiesAgg, hourAgg, totalForRate] = await Promise.all([
      this.reservationModel.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            today: {
              $sum: { $cond: [{ $gte: ['$createdAt', dayAgo] }, 1, 0] },
            },
            week: {
              $sum: { $cond: [{ $gte: ['$createdAt', weekAgo] }, 1, 0] },
            },
            month: {
              $sum: { $cond: [{ $gte: ['$createdAt', monthAgo] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
            },
            total: { $sum: 1 },
          },
        },
      ]),
      this.reservationModel.aggregate([
        { $match: { ...baseMatch, createdAt: { $gte: monthAgo } } },
        { $group: { _id: '$amenityId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'amenities',
            localField: '_id',
            foreignField: '_id',
            as: 'amenity',
          },
        },
        { $unwind: { path: '$amenity', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            amenityId: { $toString: '$_id' },
            title: '$amenity.title',
            count: 1,
          },
        },
      ]),
      this.reservationModel.aggregate([
        {
          $match: {
            ...baseMatch,
            startTime: { $gte: monthAgo },
            status: { $in: ['confirmed', 'completed'] },
          },
        },
        {
          $group: {
            _id: { $hour: '$startTime' },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, hour: '$_id', count: 1 } },
      ]),
      this.reservationModel.countDocuments(baseMatch),
    ]);

    const c = counts[0] ?? { today: 0, week: 0, month: 0, cancelled: 0, total: 0 };
    const cancellationRate = totalForRate > 0 ? c.cancelled / totalForRate : 0;

    const hourOccupancy: number[] = Array.from({ length: 24 }, () => 0);
    for (const row of hourAgg as { hour: number; count: number }[]) {
      if (row.hour >= 0 && row.hour < 24) hourOccupancy[row.hour] = row.count;
    }

    return {
      totals: {
        today: c.today ?? 0,
        week: c.week ?? 0,
        month: c.month ?? 0,
      },
      topAmenities: topAmenitiesAgg as Array<{
        amenityId: string;
        title?: string;
        count: number;
      }>,
      cancellationRate,
      hourOccupancy,
    };
  }
}
