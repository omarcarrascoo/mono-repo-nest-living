import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Role = 'admin' | 'user' | 'kitchen_operator';
export type GlobalRole = 'super_admin' | null;

export interface CurrentUserPayload {
  userId: string;
  email: string;
  globalRole: GlobalRole;
  /** Club activo en la sesión (puede ser null si el user aún no se unió a ninguno). */
  activeClubId: string | null;
  /** Rol dentro del club activo. null si no hay club activo. */
  activeMembershipRole: Role | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
