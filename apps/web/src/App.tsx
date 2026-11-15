import { useEffect, useState, useSyncExternalStore } from 'react';
import { auth, session, users, type User } from './api';
import { AdminPage } from './components/AdminPage';
import { AuthPage } from './components/AuthPage';
import { HabitsPage } from './components/HabitsPage';
import { ProfilePage } from './components/ProfilePage';
import { RequestLog } from './components/RequestLog';
import { ErrorText, useAction } from './components/ui';

type Tab = 'habits' | 'profile' | 'admin';

export function App() {
  const loggedIn = useSyncExternalStore(session.subscribe, session.isLoggedIn);

  return (
    <div className="layout">
      <main>{loggedIn ? <LoggedIn /> : <AuthPage />}</main>
      <RequestLog />
    </div>
  );
}

// Mounted only while logged in, so logging out resets all of this state.
function LoggedIn() {
  const [me, setMe] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('habits');
  const { busy, error, run } = useAction();

  // GET /users/me. After a reload there's no access token yet, so this gets
  // a 401, refreshes, and retries: watch it happen in the request log.
  useEffect(() => {
    void run(async () => setMe(await users.me()));
  }, [run]);

  if (!me) {
    return (
      <section className="card">
        {error ? (
          <>
            <ErrorText error={error} />
            <button type="button" onClick={() => void run(auth.logout)}>
              Log out
            </button>
          </>
        ) : (
          <p className="muted">Loading…</p>
        )}
      </section>
    );
  }

  const tabs: [Tab, string][] = [
    ['habits', 'Habits'],
    ['profile', 'Profile'],
    // Only hides the tab. The API is what actually enforces ADMIN.
    ...(me.role === 'ADMIN' ? [['admin', 'Admin'] as [Tab, string]] : []),
  ];

  return (
    <>
      <header className="header">
        <h1>Sealife</h1>
        <nav className="tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <span className="muted small">{me.email}</span>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(auth.logout)}
        >
          Log out
        </button>
      </header>
      <ErrorText error={error} />

      {tab === 'habits' && <HabitsPage />}
      {tab === 'profile' && <ProfilePage me={me} onUpdated={setMe} />}
      {tab === 'admin' && me.role === 'ADMIN' && <AdminPage me={me} />}
    </>
  );
}
