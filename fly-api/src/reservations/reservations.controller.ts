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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  AdminListReservationsQueryDto,
  CreateReservationDto,
  ListReservationsQueryDto,
  UpdateReservationDto,
} from './dto/reservation.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Get('admin/all')
  @Roles('admin')
  listAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: AdminListReservationsQueryDto,
  ) {
    return this.reservations.listForResidency({
      residencyId: user.residencyId,
      filter: query.filter ?? 'upcoming',
      userId: query.userId,
      amenityId: query.amenityId,
      cursor: query.cursor,
      limit: Math.min(Math.max(query.limit ?? 30, 1), 100),
    });
  }

  @Get('admin/stats')
  @Roles('admin')
  stats(@CurrentUser() user: CurrentUserPayload) {
    return this.reservations.getAdminStats(user.residencyId);
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
