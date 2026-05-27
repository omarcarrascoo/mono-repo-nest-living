import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule, // Gives us access to UsersService
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'a-string-secret-at-least-256-bits-long',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}