import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() reservationReminders?: boolean;
  @IsOptional() @IsBoolean() reservationUpdates?: boolean;
  @IsOptional() @IsBoolean() adminAlerts?: boolean;
}

class DirectoryQueryDto {
  @IsOptional()
  @IsString()
  @Length(0, 80)
  q?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Get('directory')
  @Roles('admin')
  async directory(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: DirectoryQueryDto,
  ) {
    return this.usersService.listForResidencyDirectory(
      user.residencyId,
      query.q,
    );
  }
}
