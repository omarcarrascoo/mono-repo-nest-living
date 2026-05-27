import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  

  canActivate(context: ExecutionContext): boolean {
    console.log('RolesGuard initialized');
    Logger.debug('RolesGuard initialized');
    // 1. Get the roles required by the handler (e.g., ['admin'])
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // 2. If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // 3. Get the user object attached by the JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // 4. Check if the user has the required role
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}