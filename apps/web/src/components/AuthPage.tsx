import { useState, type SubmitEvent } from 'react';
import { auth, users } from '../api';
import { ErrorText, useAction } from './ui';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAction();

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    void run(async () => {
      if (mode === 'signup') {
        // POST /users, then log straight in with the same credentials.
        await users.signup({ email, password, ...(name && { name }) });
      }
      await auth.login(email, password);
    });
  };

  return (
    <section className="card auth">
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={submit} className="stack">
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {mode === 'signup' && (
          <label>
            Name <span className="muted">(optional)</span>
            <input
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label>
          Password
          <input
            type="password"
            required
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode === 'signup' && (
          <p className="muted small">
            At least 8 characters, with an uppercase letter, a lowercase letter,
            a number and a symbol.
          </p>
        )}
        <ErrorText error={error} />
        <button type="submit" className="primary" disabled={busy}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </section>
  );
}
