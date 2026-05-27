import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpoPushMessage } from 'expo-server-sdk';
import { PushToken } from './schemas/push-token.schema';
import {
  NotificationKind,
  NotificationLog,
} from './schemas/notification-log.schema';
import { ExpoPushClient } from './expo-push.client';
import { UsersService } from '../users/users.service';
import { Amenity } from '../amenities/schemas/amenity.schema';

interface NotifyPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  kind: NotificationKind;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(PushToken.name) private pushTokenModel: Model<PushToken>,
    @InjectModel(NotificationLog.name)
    private logModel: Model<NotificationLog>,
    @InjectModel(Amenity.name) private amenityModel: Model<Amenity>,
    private readonly expoClient: ExpoPushClient,
    private readonly usersService: UsersService,
  ) {}

  // ============================================================
  // Token registration
  // ============================================================
  async registerToken(
    userId: string,
    expoPushToken: string,
    platform?: string,
    deviceName?: string,
  ) {
    if (!this.expoClient.isValidToken(expoPushToken)) {
      throw new NotFoundException('Invalid Expo push token');
    }
    return this.pushTokenModel.findOneAndUpdate(
      { expoPushToken },
      {
        userId: new Types.ObjectId(userId),
        platform: (platform as any) ?? 'unknown',
        deviceName,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async unregisterToken(userId: string, expoPushToken: string) {
    return this.pushTokenModel.deleteOne({
      userId: new Types.ObjectId(userId),
      expoPushToken,
    });
  }

  // ============================================================
  // Send to user
  // ============================================================
  async notifyUser(userId: string, payload: NotifyPayload) {
    const tokens = await this.pushTokenModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('expoPushToken')
      .lean()
      .exec();

    const log = await this.logModel.create({
      userId: new Types.ObjectId(userId),
      kind: payload.kind,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      status: 'pending',
    });

    if (tokens.length === 0) {
      log.status = 'sent';
      await log.save();
      return;
    }

    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: { ...payload.data, kind: payload.kind },
      priority: 'high',
    }));

    try {
      const { invalidTokens } = await this.expoClient.send(messages);
      log.status = 'sent';
      await log.save();
      if (invalidTokens.length > 0) {
        await this.pushTokenModel.deleteMany({
          expoPushToken: { $in: invalidTokens },
        });
      }
    } catch (e: any) {
      log.status = 'error';
      log.error = e?.message ?? 'unknown';
      await log.save();
      this.logger.error(`Push send failed: ${e?.message}`);
    }
  }

  async notifyAdmins(residencyId: string, payload: NotifyPayload) {
    const admins = await this.usersService.findAdminsByResidency(residencyId);
    await Promise.all(
      admins.map((a) => this.notifyUser(String(a._id), payload)),
    );
  }

  // ============================================================
  // Reservation hooks
  // ============================================================
  async notifyReservationCreated(reservation: any) {
    if (!reservation) return;
    try {
      const amenity = await this.amenityModel
        .findById(reservation.amenityId)
        .select('title')
        .lean()
        .exec();
      const title = '✅ Reserva confirmada';
      const body = `${amenity?.title ?? 'Tu amenidad'} • ${formatDateTime(reservation.startTime)}`;
      const data = {
        reservationId: String(reservation._id),
        amenityId: String(reservation.amenityId),
      };

      await this.notifyUser(String(reservation.userId), {
        kind: 'reservation_created',
        title,
        body,
        data,
      });

      await this.notifyAdmins(String(reservation.residencyId), {
        kind: 'admin_alert',
        title: '📋 Nueva reserva',
        body: `${amenity?.title ?? 'Amenidad'} • ${formatDateTime(reservation.startTime)}`,
        data,
      });
    } catch (e: any) {
      this.logger.error(`notifyReservationCreated failed: ${e?.message}`);
    }
  }

  async notifyReservationCancelled(reservation: any) {
    if (!reservation) return;
    try {
      const amenity = await this.amenityModel
        .findById(reservation.amenityId)
        .select('title')
        .lean()
        .exec();
      const title = 'Reserva cancelada';
      const body = `${amenity?.title ?? 'Tu amenidad'} • ${formatDateTime(reservation.startTime)}`;
      const data = {
        reservationId: String(reservation._id),
        amenityId: String(reservation.amenityId),
      };
      await this.notifyUser(String(reservation.userId), {
        kind: 'reservation_cancelled',
        title,
        body,
        data,
      });
      await this.notifyAdmins(String(reservation.residencyId), {
        kind: 'admin_alert',
        title: 'Reserva cancelada',
        body,
        data,
      });
    } catch (e: any) {
      this.logger.error(`notifyReservationCancelled failed: ${e?.message}`);
    }
  }

  async notifyReservationReminder(reservation: any) {
    try {
      const amenity = await this.amenityModel
        .findById(reservation.amenityId)
        .select('title location')
        .lean()
        .exec();
      await this.notifyUser(String(reservation.userId), {
        kind: 'reservation_reminder',
        title: '⏰ Tu reserva empieza pronto',
        body: `${amenity?.title ?? 'Tu amenidad'}${amenity?.location ? ' • ' + amenity.location : ''} en 15 minutos`,
        data: {
          reservationId: String(reservation._id),
          amenityId: String(reservation.amenityId),
        },
      });
    } catch (e: any) {
      this.logger.error(`notifyReservationReminder failed: ${e?.message}`);
    }
  }
}

function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
