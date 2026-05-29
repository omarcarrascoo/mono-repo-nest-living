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
import {
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveClubGuard } from '../auth/guards/active-club.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

class RegisterTokenDto {
  @IsString()
  @Length(20, 200)
  expoPushToken: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web', 'unknown'])
  platform?: 'ios' | 'android' | 'web' | 'unknown';

  @IsOptional()
  @IsString()
  @Length(0, 80)
  deviceName?: string;
}

class ListNotificationsQueryDto {
  @IsOptional() @IsIn(['true', 'false']) unreadOnly?: string;
}

class BroadcastNotificationDto {
  @IsString()
  @Length(2, 100)
  title: string;

  @IsString()
  @Length(2, 500)
  body: string;

  @IsIn(['all', 'unit', 'user'])
  audience: 'all' | 'unit' | 'user';

  @ValidateIf((o) => o.audience === 'unit')
  @IsString()
  @Length(1, 32)
  unitPrefix?: string;

  @ValidateIf((o) => o.audience === 'user')
  @IsMongoId()
  userId?: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('register-token')
  register(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notifications.registerToken(
      user.userId,
      dto.expoPushToken,
      dto.platform,
      dto.deviceName,
    );
  }

  @Delete('unregister-token')
  unregister(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notifications.unregisterToken(user.userId, dto.expoPushToken);
  }

  // ----- Inbox -----

  @Get('me')
  listMine(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notifications.listForUser(user.userId, {
      unreadOnly: query.unreadOnly === 'true',
    });
  }

  @Get('me/unread-count')
  async unreadCount(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.notifications.getUnreadCount(user.userId);
    return { count };
  }

  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notifications.markRead(user.userId, id);
  }

  @Post('mark-all-read')
  markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notifications.markAllRead(user.userId);
  }

  @Post('broadcast')
  @UseGuards(ActiveClubGuard)
  @Roles('admin')
  async broadcast(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BroadcastNotificationDto,
  ) {
    return this.notifications.broadcast(user.activeClubId!, user.userId, dto);
  }
}
