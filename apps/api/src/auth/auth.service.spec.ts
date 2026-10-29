import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { IsNull } from 'typeorm';
import { AuthService } from './auth.service';
import { RefreshToken } from './refresh-token.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

const RAW_TOKEN = 'raw-refresh-token';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function mockToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 1,
    tokenHash: sha256(RAW_TOKEN),
    userId: 1,
    user: { id: 1, email: 'alice@test.com', role: UserRole.USER },
    expiresAt: new Date(Date.now() + HOUR_MS),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  } as RefreshToken;
}

async function expectInvalidToken(promise: Promise<unknown>) {
  await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
  await expect(promise).rejects.toThrow('Invalid refresh token');
}

describe('AuthService.refresh', () => {
  let service: AuthService;
  // Only the methods AuthService calls. Anything else would be undefined and fail loudly.
  let refreshTokens: {
    findOne: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    refreshTokens = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      insert: jest.fn().mockResolvedValue({}),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('new-access-token') };

    // The same DI container the app uses, with fakes behind the same tokens.
    // @InjectRepository(RefreshToken) is getRepositoryToken(RefreshToken) underneath.
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokens },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: {} }, // refresh() never calls it
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('looks the token up by its hash, never the raw value', async () => {
    refreshTokens.findOne.mockResolvedValue(null);

    await expectInvalidToken(service.refresh(RAW_TOKEN));
    expect(refreshTokens.findOne).toHaveBeenCalledWith({
      where: { tokenHash: sha256(RAW_TOKEN) },
      relations: { user: true },
    });
  });

  it('rejects an unknown token without writing anything', async () => {
    refreshTokens.findOne.mockResolvedValue(null);

    await expectInvalidToken(service.refresh(RAW_TOKEN));
    expect(refreshTokens.update).not.toHaveBeenCalled();
  });

  it('treats a revoked token as theft and revokes every token of that user', async () => {
    refreshTokens.findOne.mockResolvedValue(
      mockToken({ revokedAt: new Date(Date.now() - HOUR_MS) }),
    );

    await expectInvalidToken(service.refresh(RAW_TOKEN));
    expect(refreshTokens.update).toHaveBeenCalledWith(
      { userId: 1, revokedAt: IsNull() },
      { revokedAt: expect.any(Date) },
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an expired token but does not treat it as theft', async () => {
    refreshTokens.findOne.mockResolvedValue(
      mockToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expectInvalidToken(service.refresh(RAW_TOKEN));
    expect(refreshTokens.update).not.toHaveBeenCalled();
  });

  it('treats losing the race (affected === 0) as reuse', async () => {
    refreshTokens.findOne.mockResolvedValue(mockToken());
    // First update = the rotation. Another request revoked the row first.
    refreshTokens.update.mockResolvedValueOnce({ affected: 0 });

    await expectInvalidToken(service.refresh(RAW_TOKEN));
    expect(refreshTokens.update).toHaveBeenLastCalledWith(
      { userId: 1, revokedAt: IsNull() },
      { revokedAt: expect.any(Date) },
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rotates: revokes this token and issues a new pair', async () => {
    refreshTokens.findOne.mockResolvedValue(mockToken());

    const pair = await service.refresh(RAW_TOKEN);

    // Only this row, and only if it's still unrevoked (the atomic check).
    expect(refreshTokens.update).toHaveBeenCalledTimes(1);
    expect(refreshTokens.update).toHaveBeenCalledWith(
      { id: 1, revokedAt: IsNull() },
      { revokedAt: expect.any(Date) },
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'alice@test.com',
      role: UserRole.USER,
    });
    expect(pair).toEqual({
      accessToken: 'new-access-token',
      refreshToken: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  it('stores only the hash of the new refresh token', async () => {
    refreshTokens.findOne.mockResolvedValue(mockToken());

    const { refreshToken } = await service.refresh(RAW_TOKEN);

    const [row] = refreshTokens.insert.mock.calls[0];
    expect(row).toEqual({
      tokenHash: sha256(refreshToken),
      userId: 1,
      expiresAt: expect.any(Date),
    });
    expect(JSON.stringify(row)).not.toContain(refreshToken);
    // 7 days from now, give or take the time this test took.
    expect(row.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      7 * DAY_MS - 5000,
    );
  });
});
