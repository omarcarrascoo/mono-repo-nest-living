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
import { ActiveClubGuard } from '../auth/guards/active-club.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';

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

class UpdateOwnProfileDto {
  @IsOptional() @IsString() @Length(1, 120) fullName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Length(0, 500)
  avatar?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601()
  dateOfBirth?: string | null;
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

  @Patch('me')
  async updateOwnProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateOwnProfileDto,
  ) {
    return this.usersService.updateOwnProfile(user.userId, dto);
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
    return this.usersService.updateNotificationPreferences(
      user.userId,
      dto as any,
    );
  }

  @Get('directory')
  @UseGuards(ActiveClubGuard)
  @Roles('admin')
  async directory(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: DirectoryQueryDto,
  ) {
    return this.usersService.listForClubDirectory(
      user.activeClubId as string,
      query.q,
    );
  }
}
