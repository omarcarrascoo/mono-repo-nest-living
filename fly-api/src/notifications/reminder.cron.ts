import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation } from '../reservations/schemas/reservation.schema';
import { NotificationsService } from './notifications.service';

const REMINDER_WINDOW_MS = 15 * 60_000; // 15 min antes
const SAFETY_WINDOW_MS = 60_000; // ventana de tolerancia

@Injectable()
export class ReminderCron {
  private readonly logger = new Logger(ReminderCron.name);

  constructor(
    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<Reservation>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    const now = Date.now();
    const windowStart = new Date(now + REMINDER_WINDOW_MS - SAFETY_WINDOW_MS);
    const windowEnd = new Date(now + REMINDER_WINDOW_MS + SAFETY_WINDOW_MS);

    const due = await this.reservationModel
      .find({
        status: 'confirmed',
        startTime: { $gte: windowStart, $lte: windowEnd },
        $or: [
          { reminderSentAt: { $exists: false } },
          { reminderSentAt: null },
        ],
      })
      .limit(200)
      .exec();

    if (due.length === 0) return;
    this.logger.debug(`Sending ${due.length} reminders`);

    for (const r of due) {
      try {
        // Marca primero (idempotencia) — si esto falla seguimos al siguiente.
        r.reminderSentAt = new Date();
        await r.save();
        await this.notifications.notifyReservationReminder(r);
      } catch (e: any) {
        this.logger.error(`Reminder for ${r._id} failed: ${e?.message}`);
      }
    }
  }
}
