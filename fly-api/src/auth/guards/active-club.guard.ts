import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

/**
 * Bloquea cualquier ruta scope-ada a un club si el JWT no trae `activeClubId`
 * (eg. el user se acaba de registrar y aún no se unió a ningún club).
 * Usar SIEMPRE después de JwtAuthGuard.
 */
@Injectable()
export class ActiveClubGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.activeClubId) {
      throw new ForbiddenException('Necesitas unirte a un club primero');
    }
    return true;
  }
}
