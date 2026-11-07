import { bearer, createE2eApp, type E2eApp } from './e2e-app';

type Habit = { id: number; name: string };

describe('Habits (e2e)', () => {
  let t: E2eApp;
  let alice: Record<string, string>;

  beforeAll(async () => {
    t = await createE2eApp();
  });

  beforeEach(async () => {
    await t.reset();
    await t.signUp(); // alice, user id 1 (RESTART IDENTITY)
    alice = bearer((await t.login()).accessToken);
  });

  afterAll(() => t.app.close());

  async function createHabit(name = 'Read'): Promise<Habit> {
    const res = await t
      .http()
      .post('/api/habits')
      .set(alice)
      .send({ name })
      .expect(201);
    return res.body as Habit;
  }

  const complete = (id: number, auth = alice) =>
    t.http().post(`/api/habits/${id}/complete`).set(auth);

  it('GET /habits stays correct through the cache', async () => {
    await t.http().get('/api/habits').set(alice).expect(200, []);
    // The second read is served from Redis, and must look the same.
    await t.http().get('/api/habits').set(alice).expect(200, []);
    expect(await t.redis.get('cache:habits:1')).toBe('[]');

    // Every write deletes the cached copy, so the next read sees it.
    const habit = await createHabit('Read');
    let res = await t.http().get('/api/habits').set(alice).expect(200);
    expect(res.body).toMatchObject([{ id: habit.id, name: 'Read' }]);

    await t
      .http()
      .put(`/api/habits/${habit.id}`)
      .set(alice)
      .send({ name: 'Read more' })
      .expect(200);
    res = await t.http().get('/api/habits').set(alice).expect(200);
    expect(res.body).toMatchObject([{ id: habit.id, name: 'Read more' }]);

    await t.http().delete(`/api/habits/${habit.id}`).set(alice).expect(200);
    await t.http().get('/api/habits').set(alice).expect(200, []);
  });

  it("another user's habit is a 404", async () => {
    const habit = await createHabit();
    await t.signUp('bob@test.com');
    const bob = bearer((await t.login('bob@test.com')).accessToken);

    await t.http().get(`/api/habits/${habit.id}`).set(bob).expect(404);
    await complete(habit.id, bob).expect(404);
  });

  it('a habit can be completed once per period', async () => {
    const habit = await createHabit();

    await complete(habit.id).expect(201);
    await complete(habit.id).expect(409);

    const res = await t
      .http()
      .get(`/api/habits/${habit.id}/completions`)
      .set(alice)
      .expect(200);
    expect(res.body).toHaveLength(1);
  });

  it('simultaneous completions leave exactly one row', async () => {
    const habit = await createHabit();

    const statuses = await Promise.all(
      Array.from({ length: 5 }, () => complete(habit.id).then((r) => r.status)),
    );

    expect(statuses.sort()).toEqual([201, 409, 409, 409, 409]);
    const [{ count }] = await t.dataSource.query(
      `SELECT count(*)::int AS count FROM "HabitCompletion" WHERE "habitId" = $1`,
      [habit.id],
    );
    expect(count).toBe(1);
  });
});
