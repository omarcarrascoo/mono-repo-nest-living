import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';
import { Amenity, AmenitySchema } from './schemas/amenity.schema';
import { UsersModule } from '../users/users.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Amenity.name, schema: AmenitySchema },
    ]),
    UsersModule,
    ReservationsModule,
  ],
  controllers: [AmenitiesController],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
