// Everything that talks to the Sealife API lives here. Components only call
// the `auth`, `users` and `habits` helpers at the bottom of the file.

export type Role = 'USER' | 'ADMIN';
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
};

export type Habit = {
  id: number;
  name: string;
  description: string | null;
  frequency: Frequency | null;
  archived: boolean;
  createdAt: string;
  userId: number;
};

export type HabitCompletion = {
  id: number;
  habitId: number;
  completedAt: string;
};

export type HabitInput = {
  name?: string;
  description?: string | null;
  frequency?: Frequency | null;
  archived?: boolean;
};

type TokenPair = { accessToken: string; refreshToken: string };

// Nest's error body: { statusCode, message, error }. `message` is an array
// when ValidationPipe rejects several fields at once.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Request log: every call, so you can watch 401 -> refresh -> retry happen.

export type LogEntry = {
  id: number;
  at: Date;
  method: string;
  path: string;
  status: number | null; // null = network error, the API never answered
  ms: number;
};

let log: LogEntry[] = [];
let nextLogId = 1;
const logListeners = new Set<() => void>();

export const requestLog = {
  get: () => log,
  clear() {
    log = [];
    logListeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    logListeners.add(listener);
    return () => void logListeners.delete(listener);
  },
};

function record(entry: Omit<LogEntry, 'id' | 'at'>) {
  // New array each time: useSyncExternalStore re-renders on a new reference.
  log = [{ id: nextLogId++, at: new Date(), ...entry }, ...log].slice(0, 100);
  logListeners.forEach((l) => l());
}

// ---------------------------------------------------------------------------
// Session. The access token lives in memory only (15 min, gone on reload).
// The refresh token (7 days) lives in localStorage so a reload stays logged in.
// localStorage is readable by any script on the page, so an XSS bug would
// leak it. An httpOnly cookie avoids that, but needs backend changes.

const REFRESH_KEY = 'sealife.refreshToken';

let accessToken: string | null = null;
const sessionListeners = new Set<() => void>();

export const session = {
  isLoggedIn: () => localStorage.getItem(REFRESH_KEY) !== null,
  accessToken: () => accessToken,
  subscribe(listener: () => void) {
    sessionListeners.add(listener);
    return () => void sessionListeners.delete(listener);
  },
};

function setTokens(pair: TokenPair) {
  accessToken = pair.accessToken;
  localStorage.setItem(REFRESH_KEY, pair.refreshToken);
  sessionListeners.forEach((l) => l());
}

function clearSession() {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
  sessionListeners.forEach((l) => l());
}

// Logging out in another tab removes the shared refresh token: follow it.
window.addEventListener('storage', (e) => {
  if (e.key === REFRESH_KEY && e.newValue === null) {
    accessToken = null;
    sessionListeners.forEach((l) => l());
  }
});

// ---------------------------------------------------------------------------
// Transport

async function send(
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const started = performance.now();
  try {
    // Relative URL: Vite's dev server proxies /api to Nest (vite.config.ts).
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    record({
      method,
      path,
      status: res.status,
      ms: performance.now() - started,
    });
    return res;
  } catch (err) {
    record({ method, path, status: null, ms: performance.now() - started });
    throw new ApiError(0, `Can't reach the API (${String(err)})`);
  }
}

async function toError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(body?.message)
    ? body.message.join('; ')
    : (body?.message ?? res.statusText);
  // The rate limiter sends Retry-After with its 429s.
  const retryAfter = res.headers.get('Retry-After');
  return new ApiError(
    res.status,
    retryAfter ? `${message} (retry in ${retryAfter}s)` : message,
  );
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  // Nest sends an empty 200 when a handler returns nothing.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Refresh tokens are single use: the API revokes the old one, and seeing it a
// second time looks like theft, so it logs the user out everywhere. Two
// refreshes must never send the same token. Within this tab, every caller
// shares one in-flight refresh. Across tabs, a Web Lock lets one tab refresh
// at a time, and each reads the token only once it holds the lock, so it gets
// the one the previous tab just stored.
let refreshing: Promise<void> | null = null;

export function refreshSession(): Promise<void> {
  refreshing ??= navigator.locks
    .request('sealife-refresh', async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) throw new ApiError(401, 'Not logged in');
      const res = await send('POST', '/auth/refresh', { refreshToken });
      // Only a 401 means the token is dead. A 429 or a 500 doesn't.
      if (res.status === 401) clearSession();
      setTokens(await parse<TokenPair>(res));
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// Sends the request; on a 401, refreshes the session once and sends it again.
// `request` is a function so the retry picks up the new tokens.
async function withRefresh(request: () => Promise<Response>) {
  const usedToken = accessToken;
  const res = await request();
  if (res.status !== 401 || !session.isLoggedIn()) return res;
  // Another request may have refreshed while this one was in flight.
  if (accessToken === usedToken) await refreshSession();
  return request();
}

function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  return withRefresh(() => send(method, path, body)).then((r) => parse<T>(r));
}

// For the public routes. A 401 from login means wrong password, not an
// expired token, so these never refresh.
function callPublic<T>(method: string, path: string, body: unknown) {
  return send(method, path, body).then((r) => parse<T>(r));
}

// ---------------------------------------------------------------------------
// Endpoints

export const auth = {
  // POST /auth/login
  async login(email: string, password: string) {
    setTokens(
      await callPublic<TokenPair>('POST', '/auth/login', { email, password }),
    );
  },

  // POST /auth/logout. Revokes this refresh token and this access token.
  async logout() {
    try {
      await withRefresh(() =>
        send('POST', '/auth/logout', {
          // Read at send time: a refresh before the retry rotates it.
          refreshToken: localStorage.getItem(REFRESH_KEY),
        }),
      ).then((r) => parse<void>(r));
    } finally {
      clearSession();
    }
  },

  refresh: refreshSession,
};

export const users = {
  // POST /users (public)
  signup: (dto: { email: string; password: string; name?: string }) =>
    callPublic<User>('POST', '/users', dto),
  // GET /users/me
  me: () => call<User>('GET', '/users/me'),
  // PUT /users/me
  updateMe: (dto: { email?: string; name?: string | null }) =>
    call<User>('PUT', '/users/me', dto),
  // DELETE /users/me. The API revokes every token, so drop the session too.
  async deleteMe() {
    const user = await call<User>('DELETE', '/users/me');
    clearSession();
    return user;
  },

  // Admin only
  list: () => call<User[]>('GET', '/users'),
  get: (id: number | string) => call<User>('GET', `/users/${id}`),
  setRole: (id: number, role: Role) =>
    call<User>('PUT', `/users/${id}/role`, { role }),
  remove: (id: number) => call<User>('DELETE', `/users/${id}`),
};

export const habits = {
  list: () => call<Habit[]>('GET', '/habits'),
  get: (id: number) => call<Habit>('GET', `/habits/${id}`),
  create: (dto: HabitInput) => call<Habit>('POST', '/habits', dto),
  update: (id: number, dto: HabitInput) =>
    call<Habit>('PUT', `/habits/${id}`, dto),
  remove: (id: number) => call<Habit>('DELETE', `/habits/${id}`),
  complete: (id: number) =>
    call<HabitCompletion>('POST', `/habits/${id}/complete`),
  completions: (id: number) =>
    call<HabitCompletion[]>('GET', `/habits/${id}/completions`),
};

// The access token's claims, for display. Decoding isn't verifying: only the
// API can check the signature, so never trust these for anything else.
export type Claims = {
  sub: number;
  email: string;
  role: Role;
  jti: string;
  iat: number;
  exp: number;
};

export function decodeAccessToken(token: string): Claims | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as Claims;
  } catch {
    return null;
  }
}
