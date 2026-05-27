import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ExpoPushClient } from './expo-push.client';
import { ReminderCron } from './reminder.cron';
import {
  PushToken,
  PushTokenSchema,
} from './schemas/push-token.schema';
import {
  NotificationLog,
  NotificationLogSchema,
} from './schemas/notification-log.schema';
import {
  Reservation,
  ReservationSchema,
} from '../reservations/schemas/reservation.schema';
import {
  Amenity,
  AmenitySchema,
} from '../amenities/schemas/amenity.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PushToken.name, schema: PushTokenSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: Amenity.name, schema: AmenitySchema },
    ]),
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, ExpoPushClient, ReminderCron],
  exports: [NotificationsService],
})
export class NotificationsModule {}
