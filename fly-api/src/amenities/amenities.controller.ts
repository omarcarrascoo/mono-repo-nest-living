import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AmenitiesService } from './amenities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  CreateAmenityDto,
  ListAmenitiesQueryDto,
  UpdateAmenityDto,
} from './dto/amenity.dto';
import {
  AvailabilityQueryDto,
} from '../reservations/dto/reservation.dto';
import { ReservationsService } from '../reservations/reservations.service';

@Controller('amenities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AmenitiesController {
  private readonly logger = new Logger(AmenitiesController.name);

  constructor(
    private readonly amenitiesService: AmenitiesService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListAmenitiesQueryDto,
  ) {
    return this.amenitiesService.list({
      userId: user.userId,
      residencyId: user.residencyId,
      q: query.q,
      categoryId: query.category,
      favoritesOnly: query.favorite === 'true',
    });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.amenitiesService.findOne(id, user.residencyId);
  }

  @Get(':id/availability')
  availability(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.reservationsService.getAvailability(
      id,
      user.residencyId,
      query.date,
    );
  }

  @Post(':id/favorite')
  favorite(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.amenitiesService.toggleFavorite(
      user.userId,
      id,
      user.residencyId,
      true,
    );
  }

  @Delete(':id/favorite')
  unfavorite(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.amenitiesService.toggleFavorite(
      user.userId,
      id,
      user.residencyId,
      false,
    );
  }

  // ---- Admin ----
  @Post()
  @Roles('admin')
  create(
    @Body() dto: CreateAmenityDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.logger.debug(
      `Creating amenity for residency ${user.residencyId} by ${user.email}`,
    );
    return this.amenitiesService.create({ ...dto, residencyId: user.residencyId });
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAmenityDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.amenitiesService.update(id, user.residencyId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.amenitiesService.remove(id, user.residencyId);
  }
}
