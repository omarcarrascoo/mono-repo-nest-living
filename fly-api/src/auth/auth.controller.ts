import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserPayload } from './decorators/current-user.decorator';
import { SwitchClubDto } from '../clubs/dto/clubs.dto';

class LoginDto {
  @IsEmail() email: string;
  @IsString() @Length(6, 128) password: string;
}

class RegisterDto {
  @IsEmail() email: string;
  @IsString() @Length(6, 128) password: string;
  @IsString() @Length(2, 120) fullName: string;
  @IsOptional() @IsISO8601() dateOfBirth?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('switch-club')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async switchClub(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SwitchClubDto,
  ) {
    return this.authService.switchClub(user.userId, body.clubId);
  }
}
