import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRole } from '../users/user.entity';
import { ROLES_KEY } from './roles.decorator';
import { AuthRequest } from './jwt-payload';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    // This line checks what role the request requires
    // For example @Roles([UserRole.ADMIN]) only allows admins to access the endpoint
    // If no @Roles guard then pass
    if (!roles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<AuthRequest>();
    // Return true if the decorator matches the users role
    return roles.includes(user?.role);
  }
}
