import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { IsBoolean, IsOptional } from 'class-validator';

class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() reservationReminders?: boolean;
  @IsOptional() @IsBoolean() reservationUpdates?: boolean;
  @IsOptional() @IsBoolean() adminAlerts?: boolean;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: CurrentUserPayload) {
    const u = await this.usersService.findById(user.userId);
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  @Get('me/favorites')
  async myFavorites(@CurrentUser() user: CurrentUserPayload) {
    const ids = await this.usersService.getFavoriteIds(user.userId);
    return { ids };
  }

  @Patch('me/notification-preferences')
  async updatePreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.userId, dto as any);
  }
}
