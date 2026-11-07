import { bearer, createE2eApp, PASSWORD, type E2eApp } from './e2e-app';

describe('Users (e2e)', () => {
  let t: E2eApp;

  beforeAll(async () => {
    t = await createE2eApp();
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  it('sign-up cannot choose a role', async () => {
    const res = await t
      .http()
      .post('/api/users')
      .send({ email: 'mallory@test.com', password: PASSWORD, role: 'ADMIN' })
      .expect(400);

    expect(res.body.message).toContain('property role should not exist');
  });

  it('a taken email is a 409 that names no table or constraint', async () => {
    await t.signUp('alice@test.com');

    const res = await t
      .http()
      .post('/api/users')
      .send({ email: 'alice@test.com', password: PASSWORD })
      .expect(409);

    expect(res.body.message).toBe('Resource already exists');
    expect(JSON.stringify(res.body)).not.toMatch(/User_email_key|"User"/);
  });

  it('a role change applies on the next request', async () => {
    const adminId = await t.signUp('admin@test.com');
    // What `npm run make-admin` does.
    await t.dataSource.query(
      `UPDATE "User" SET "role" = 'ADMIN' WHERE "id" = $1`,
      [adminId],
    );
    const admin = await t.login('admin@test.com');

    const bobId = await t.signUp('bob@test.com');
    const bob = await t.login('bob@test.com');
    await t.http().get('/api/habits').set(bearer(bob.accessToken)).expect(200);

    await t
      .http()
      .put(`/api/users/${bobId}/role`)
      .set(bearer(admin.accessToken))
      .send({ role: 'ADMIN' })
      .expect(200);

    // Bob's token still says USER, so it's revoked rather than left to
    // expire: he has to log in again and get one that says ADMIN.
    await t.http().get('/api/habits').set(bearer(bob.accessToken)).expect(401);
  });
});
