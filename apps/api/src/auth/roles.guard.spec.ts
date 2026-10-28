import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from './jwt-payload';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../users/user.entity';

// Real methods with the real decorator, so this also checks that @Roles()
// stores exactly what RolesGuard reads.
class TestController {
  open() {}

  @Roles(UserRole.ADMIN)
  adminOnly() {}
}

// Only the parts of ExecutionContext that RolesGuard actually calls.
function contextFor(
  handler: () => void,
  user?: Partial<AuthUser>,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const { open, adminOnly } = TestController.prototype;

  it('lets any user through a route without @Roles()', () => {
    expect(guard.canActivate(contextFor(open, { role: UserRole.USER }))).toBe(
      true,
    );
  });

  it('lets an ADMIN through an admin route', () => {
    expect(
      guard.canActivate(contextFor(adminOnly, { role: UserRole.ADMIN })),
    ).toBe(true);
  });

  it('blocks a USER from an admin route', () => {
    expect(
      guard.canActivate(contextFor(adminOnly, { role: UserRole.USER })),
    ).toBe(false);
  });

  it('blocks a token without a role claim (issued before RBAC)', () => {
    expect(guard.canActivate(contextFor(adminOnly, {}))).toBe(false);
  });

  it('blocks when there is no user at all', () => {
    expect(guard.canActivate(contextFor(adminOnly))).toBe(false);
  });
});
