import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AccessToken, AuthRequest } from './jwt-payload';

export const CurrentToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessToken =>
    context.switchToHttp().getRequest<AuthRequest>().accessToken,
);
