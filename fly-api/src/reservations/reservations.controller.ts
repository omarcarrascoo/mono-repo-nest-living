import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  CreateReservationDto,
  ListReservationsQueryDto,
  UpdateReservationDto,
} from './dto/reservation.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateReservationDto,
  ) {
    const reservation = await this.reservations.create(
      user.userId,
      user.residencyId,
      dto.amenityId,
      dto.startTime,
      dto.notes,
    );
    void this.notifications.notifyReservationCreated(reservation);
    return reservation;
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListReservationsQueryDto,
  ) {
    return this.reservations.list({
      userId: user.userId,
      filter: query.filter ?? 'upcoming',
      cursor: query.cursor,
      limit: Math.min(Math.max(query.limit ?? 20, 1), 50),
    });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reservations.findOne(id, user.userId, user.role === 'admin');
  }

  @Patch(':id')
  async modify(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateReservationDto,
  ) {
    if (!dto.startTime) {
      // Solo notes — actualización trivial, sin race
      return this.reservations.findOne(id, user.userId, user.role === 'admin');
    }
    const r = await this.reservations.modify(
      id,
      user.userId,
      user.role === 'admin',
      dto.startTime,
      dto.notes,
    );
    void this.notifications.notifyReservationCreated(r);
    return r;
  }

  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const r = await this.reservations.cancel(
      id,
      user.userId,
      user.role === 'admin',
    );
    void this.notifications.notifyReservationCancelled(r);
    return r;
  }
}
