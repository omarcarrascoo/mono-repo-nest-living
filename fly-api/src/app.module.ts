import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AmenitiesModule } from './amenities/amenities.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ReservationsModule } from './reservations/reservations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DeliveryModule } from './delivery/delivery.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ??
        'mongodb+srv://omarcarrascoaranda_db_user:AO84sK0heqCkPuMF@testing-tree.h9btn6m.mongodb.net/?appName=TESTING-TREE',
    ),
    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    CategoriesModule,
    AmenitiesModule,
    ReservationsModule,
    NotificationsModule,
    DeliveryModule,
    CommunityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
