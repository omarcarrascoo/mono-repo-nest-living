import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
      data: {
        ...payload.data,
        kind: payload.kind,
        notificationId: String(log._id),
      },
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

  async notifyAdmins(clubId: string, payload: NotifyPayload) {
    const admins = await this.usersService.findAdminsByClub(clubId);
    await Promise.all(
      admins.map((a) => this.notifyUser(String(a._id), payload)),
    );
  }

  /**
   * Fan-out to admins + kitchen_operators in a club. Used for
   * order-side alerts (new pedido, escalations, etc.).
   */
  async notifyOrderStaff(clubId: string, payload: NotifyPayload) {
    const staff = await this.usersService.findStaffByClub(clubId);
    await Promise.all(
      staff.map((u) => this.notifyUser(String(u._id), payload)),
    );
  }

  /**
   * Broadcast to every active member of a club. Used for admin announcements
   * posted to the community wall. Skips the sender via `excludeUserId`.
   */
  async notifyClub(
    clubId: string,
    payload: NotifyPayload,
    opts: { excludeUserId?: string } = {},
  ) {
    const users = await this.usersService.findAllByClub(clubId);
    await Promise.all(
      users
        .filter((u) => String(u._id) !== opts.excludeUserId)
        .map((u) => this.notifyUser(String(u._id), payload)),
    );
  }

  /**
   * Admin-driven broadcast with audience filter (all | unit-prefix | single
   * user). The sender is always excluded from the recipient set.
   */
  async broadcast(
    clubId: string,
    senderUserId: string,
    payload: {
      title: string;
      body: string;
      audience: 'all' | 'unit' | 'user';
      unitPrefix?: string;
      userId?: string;
    },
  ) {
    const notifyPayload: NotifyPayload = {
      title: payload.title,
      body: payload.body,
      kind: 'admin_alert',
      data: {
        audience: payload.audience,
        ...(payload.unitPrefix ? { unitPrefix: payload.unitPrefix } : {}),
      },
    };

    let recipients: { _id: any }[] = [];
    if (payload.audience === 'all') {
      recipients = await this.usersService.findAllByClub(clubId);
    } else if (payload.audience === 'unit') {
      if (!payload.unitPrefix) {
        throw new BadRequestException('unitPrefix required for audience=unit');
      }
      recipients = await this.usersService.findByClubAndUnitPrefix(
        clubId,
        payload.unitPrefix,
      );
    } else if (payload.audience === 'user') {
      if (!payload.userId) {
        throw new BadRequestException('userId required for audience=user');
      }
      const target = await this.usersService.findById(payload.userId);
      if (!target) throw new NotFoundException('User not found');
      const isMember = await this.usersService.isUserActiveInClub(
        payload.userId,
        clubId,
      );
      if (!isMember) throw new NotFoundException('User not found');
      recipients = [{ _id: (target as any)._id }];
    }

    const filtered = recipients.filter(
      (r) => String(r._id) !== senderUserId,
    );

    await Promise.all(
      filtered.map((r) => this.notifyUser(String(r._id), notifyPayload)),
    );

    return { sent: filtered.length, audience: payload.audience };
  }

  // ============================================================
  // In-app inbox
  // ============================================================
  async listForUser(
    userId: string,
    opts: { unreadOnly?: boolean; limit?: number } = {},
  ) {
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
      inbox: true,
    };
    if (opts.unreadOnly) filter.read = false;
    return this.logModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(opts.limit ?? 100)
      .lean()
      .exec();
  }

  async getUnreadCount(userId: string) {
    return this.logModel.countDocuments({
      userId: new Types.ObjectId(userId),
      inbox: true,
      read: false,
    });
  }

  async markRead(userId: string, notificationId: string) {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new NotFoundException('Notification not found');
    }
    const updated = await this.logModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId: new Types.ObjectId(userId),
      },
      { read: true, readAt: new Date() },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  async markAllRead(userId: string) {
    const result = await this.logModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        inbox: true,
        read: false,
      },
      { read: true, readAt: new Date() },
    );
    return { modified: result.modifiedCount };
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

      await this.notifyAdmins(String(reservation.clubId), {
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
      await this.notifyAdmins(String(reservation.clubId), {
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
