import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Role = 'admin' | 'user' | 'kitchen_operator';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: Role;
  residencyId: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
