import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/user.entity';

export const ROLES_KEY = 'roles';

// @Roles(UserRole.ADMIN): only these roles may call the route. Read by RolesGuard.
export const Roles = (...roles: UserRole[]) =>
  SetMetadata<string, UserRole[]>(ROLES_KEY, roles);
