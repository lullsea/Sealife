import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthRequest, AuthUser } from './jwt-payload';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthRequest>().user,
);
