import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { JWTPayload } from './jwt-payload';
import { AuthRequest } from './jwt-payload';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // If public key is present guard is not needed
    if (isPublic) return true;

    // Switch context to http
    const httpReq: AuthRequest = context
      .switchToHttp()
      .getRequest<AuthRequest>();
    const token = extractBearerToken(httpReq);
    // If no token throw an unauthorized error
    if (!token) {
      throw new UnauthorizedException('Missing Access Token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JWTPayload>(token);
      httpReq.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      // Unexpected error
      throw new UnauthorizedException();
    }

    return true;
  }
}

// "Authorization: Bearer eyJhbGci..." -> "eyJhbGci..."
function extractBearerToken(request: Request): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}
