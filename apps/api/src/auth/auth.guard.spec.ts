import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import type { AuthRequest } from './jwt-payload';
import { Public } from './public.decorator';
import { UserRole } from '../users/user.entity';

class TestController {
  @Public()
  open() {}

  closed() {}
}

// Only the parts of ExecutionContext that AuthGuard calls. Returns the request
// too, so a test can check what the guard attached to it.
function contextFor(handler: () => void, authorization?: string) {
  const request = { headers: { authorization } } as unknown as AuthRequest;
  const context = {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AuthGuard', () => {
  // A real JwtService: signing and verifying is what's under test.
  const jwt = new JwtService({ secret: 'test-secret' });
  const guard = new AuthGuard(jwt, new Reflector());
  const { open, closed } = TestController.prototype;
  const claims = { sub: 1, email: 'alice@test.com', role: UserRole.USER };

  it('lets a @Public() route through without a token', async () => {
    const { context } = contextFor(open);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects a request without an Authorization header', async () => {
    const { context } = contextFor(closed);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a scheme other than Bearer', async () => {
    const token = await jwt.signAsync(claims);
    const { context } = contextFor(closed, `Basic ${token}`);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await new JwtService({ secret: 'not-ours' }).signAsync(
      claims,
    );
    const { context } = contextFor(closed, `Bearer ${forged}`);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an expired token', async () => {
    // exp is in seconds. One minute ago.
    const expired = await jwt.signAsync({
      ...claims,
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const { context } = contextFor(closed, `Bearer ${expired}`);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('attaches the user from a valid token, and nothing else', async () => {
    const token = await jwt.signAsync(claims);
    const { context, request } = contextFor(closed, `Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    // toEqual, not toMatchObject: iat and exp must not leak into request.user.
    expect(request.user).toEqual({
      id: 1,
      email: 'alice@test.com',
      role: UserRole.USER,
    });
  });
});
