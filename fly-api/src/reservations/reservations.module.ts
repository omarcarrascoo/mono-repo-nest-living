import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import {
  Reservation,
  ReservationSchema,
} from './schemas/reservation.schema';
import {
  Amenity,
  AmenitySchema,
} from '../amenities/schemas/amenity.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Amenity.name, schema: AmenitySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
