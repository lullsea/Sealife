import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import type { AuthRequest } from './jwt-payload';
import { Public } from './public.decorator';
import { UserRole } from '../users/user.entity';
import type { TokenRevocationService } from './token-revocation.service';

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
  // Every token it signs gets jti 'token-1', as the app's tokens get one each.
  const jwt = new JwtService({
    secret: 'test-secret',
    signOptions: { jwtid: 'token-1' },
  });
  // Nothing is revoked unless a test says so.
  const revocation = { isRevoked: jest.fn().mockResolvedValue(false) };
  const guard = new AuthGuard(
    jwt,
    new Reflector(),
    revocation as unknown as TokenRevocationService,
  );
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
    // An explicit exp: this JwtService has no expiresIn (see the expired test).
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = await jwt.signAsync({ ...claims, exp });
    const { context, request } = contextFor(closed, `Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    // toEqual, not toMatchObject: iat and exp must not leak into request.user.
    expect(request.user).toEqual({
      id: 1,
      email: 'alice@test.com',
      role: UserRole.USER,
    });
    expect(request.accessToken).toEqual({ jti: 'token-1', exp });
  });

  it('rejects a token without a jti (issued before revocation existed)', async () => {
    const old = await new JwtService({ secret: 'test-secret' }).signAsync(
      claims,
    );
    const { context } = contextFor(closed, `Bearer ${old}`);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a revoked token', async () => {
    revocation.isRevoked.mockResolvedValueOnce(true);
    const token = await jwt.signAsync(claims);
    const { context } = contextFor(closed, `Bearer ${token}`);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
