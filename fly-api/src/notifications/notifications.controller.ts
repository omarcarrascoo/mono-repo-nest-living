import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

@Controller('notifications')
@UseGuards(JwtAuthGuard)
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
}
