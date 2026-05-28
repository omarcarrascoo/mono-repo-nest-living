import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
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
import {
  IsBoolean,
  IsIn,
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

class AdminUpdateUserDto {
  @IsOptional() @IsString() @Length(1, 120) fullName?: string;
  @IsOptional() @IsIn(['admin', 'user', 'kitchen_operator'])
  role?: 'admin' | 'user' | 'kitchen_operator';

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Length(0, 40)
  unitNumber?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Length(0, 500)
  avatar?: string | null;

  @IsOptional() @IsString() @Length(1, 40) status?: string;
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

  @Patch(':id')
  @Roles('admin')
  async adminUpdate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.updateAsAdmin(user.residencyId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async adminDelete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.removeAsAdmin(user.residencyId, user.userId, id);
  }
}
