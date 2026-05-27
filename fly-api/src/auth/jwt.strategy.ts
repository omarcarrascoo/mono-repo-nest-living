import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'a-string-secret-at-least-256-bits-long',
    });
  }

  async validate(payload: any) {
    // This attaches to req.user
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role,
      residencyId: payload.residencyId 
    };
  }
}