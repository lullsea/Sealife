import { bearer, createE2eApp, type E2eApp, type TokenPair } from './e2e-app';

describe('Auth (e2e)', () => {
  let t: E2eApp;

  beforeAll(async () => {
    t = await createE2eApp();
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  it('a protected route needs a valid access token', async () => {
    await t.signUp();
    const { accessToken } = await t.login();

    await t.http().get('/api/habits').expect(401);
    await t.http().get('/api/habits').set(bearer(accessToken)).expect(200, []);
  });

  it('reusing a refresh token logs the user out everywhere', async () => {
    await t.signUp();
    const first = await t.login();

    // Normal rotation: the old refresh token is swapped for a new pair.
    const res = await t
      .http()
      .post('/api/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    const second = res.body as TokenPair;

    // Someone replays the old token: rejected...
    await t
      .http()
      .post('/api/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(401);

    // ...and everything the user holds is dead too: the new refresh token
    // (reuse detection) and the new access token (revokeAllTokens).
    await t
      .http()
      .post('/api/auth/refresh')
      .send({ refreshToken: second.refreshToken })
      .expect(401);
    await t.http().get('/api/habits').set(bearer(second.accessToken)).expect(401);
  });

  it('logout ends the session at once, access token included', async () => {
    await t.signUp();
    const { accessToken, refreshToken } = await t.login();

    await t
      .http()
      .post('/api/auth/logout')
      .set(bearer(accessToken))
      .send({ refreshToken })
      .expect(204);

    // Not "within 15 minutes": the jti is on the denylist now.
    await t.http().get('/api/habits').set(bearer(accessToken)).expect(401);
    await t.http().post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('refuses the 6th login for one email within 5 minutes', async () => {
    // The account doesn't even exist: the limit is on attempts, not accounts.
    const attempt = () =>
      t
        .http()
        .post('/api/auth/login')
        .send({ email: 'mallory@test.com', password: 'Wr0ng!pass' });

    for (let i = 0; i < 5; i++) await attempt().expect(401);

    const res = await attempt().expect(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });
});
