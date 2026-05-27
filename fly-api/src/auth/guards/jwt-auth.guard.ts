import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This is the standard guard that checks if the JWT token is valid
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}