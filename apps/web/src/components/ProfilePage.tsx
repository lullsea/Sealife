import {
  useEffect,
  useState,
  useSyncExternalStore,
  type SubmitEvent,
} from 'react';
import { auth, decodeAccessToken, session, users, type User } from '../api';
import { ConfirmButton, ErrorText, formatDate, useAction } from './ui';

export function ProfilePage({
  me,
  onUpdated,
}: {
  me: User;
  onUpdated: (user: User) => void;
}) {
  return (
    <>
      <AccountCard me={me} onUpdated={onUpdated} />
      <SessionCard />
      <DangerZone />
    </>
  );
}

function AccountCard({
  me,
  onUpdated,
}: {
  me: User;
  onUpdated: (user: User) => void;
}) {
  const [email, setEmail] = useState(me.email);
  const [name, setName] = useState(me.name ?? '');
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAction();

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    setSaved(false);
    void run(async () => {
      // PUT /users/me. Password isn't in UpdateUserDTO, so it can't change here.
      onUpdated(await users.updateMe({ email, name: name || null }));
      setSaved(true);
    });
  };

  return (
    <section className="card">
      <h2>Account</h2>
      <dl className="facts">
        <dt>ID</dt>
        <dd>{me.id}</dd>
        <dt>Role</dt>
        <dd>{me.role}</dd>
        <dt>Joined</dt>
        <dd>{formatDate(me.createdAt)}</dd>
      </dl>
      <form onSubmit={submit} className="stack">
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <ErrorText error={error} />
        {saved && <p className="notice">Saved.</p>}
        <div className="row">
          <button type="submit" className="primary" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </section>
  );
}

// What the API sees: the claims inside the current access token.
function SessionCard() {
  const token = useSyncExternalStore(session.subscribe, session.accessToken);
  const claims = token ? decodeAccessToken(token) : null;
  const [now, setNow] = useState(() => Date.now() / 1000);
  const { busy, error, run } = useAction();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(timer);
  }, []);

  const left = claims ? Math.max(0, Math.round(claims.exp - now)) : 0;

  return (
    <section className="card">
      <h2>Session</h2>
      <p className="muted small">
        Decoded from the access token in memory. Expired tokens are refreshed
        automatically on the next 401.
      </p>
      {claims ? (
        <dl className="facts">
          <dt>sub</dt>
          <dd>{claims.sub}</dd>
          <dt>role</dt>
          <dd>{claims.role}</dd>
          <dt>jti</dt>
          <dd className="mono">{claims.jti}</dd>
          <dt>issued</dt>
          <dd>{new Date(claims.iat * 1000).toLocaleTimeString()}</dd>
          <dt>expires in</dt>
          <dd>
            {left > 0
              ? `${Math.floor(left / 60)}m ${String(left % 60).padStart(2, '0')}s`
              : 'expired'}
          </dd>
        </dl>
      ) : (
        <p className="muted">No access token yet.</p>
      )}
      <ErrorText error={error} />
      <div className="row">
        {/* POST /auth/refresh: swaps the refresh token for a new pair. */}
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(auth.refresh)}
        >
          Refresh tokens now
        </button>
      </div>
    </section>
  );
}

function DangerZone() {
  const { busy, error, run } = useAction();

  return (
    <section className="card">
      <h2>Danger zone</h2>
      <p className="muted small">
        Deletes your account and all your habits, and revokes every token you
        hold.
      </p>
      <ErrorText error={error} />
      <ConfirmButton disabled={busy} onConfirm={() => void run(users.deleteMe)}>
        Delete my account
      </ConfirmButton>
    </section>
  );
}
