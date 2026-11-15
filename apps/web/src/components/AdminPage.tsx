import { useCallback, useEffect, useState, type SubmitEvent } from 'react';
import { users, type Role, type User } from '../api';
import { ConfirmButton, ErrorText, formatDate, useAction } from './ui';

// Every route here is @Roles(UserRole.ADMIN): a USER gets 403.
export function AdminPage({ me }: { me: User }) {
  const [list, setList] = useState<User[] | null>(null);
  const { busy, error, run } = useAction();

  // GET /users
  const load = useCallback(
    () => run(async () => setList(await users.list())),
    [run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // PUT /users/:id/role. The API also revokes that user's tokens, so their
  // next request refreshes and picks up the new role.
  const setRole = (id: number, role: Role) =>
    run(async () => {
      const updated = await users.setRole(id, role);
      setList((l) => l?.map((u) => (u.id === id ? updated : u)) ?? l);
    });

  // DELETE /users/:id
  const remove = (id: number) =>
    run(async () => {
      await users.remove(id);
      setList((l) => l?.filter((u) => u.id !== id) ?? l);
    });

  return (
    <>
      <section className="card">
        <div className="toolbar">
          <h2>Users</h2>
          <button type="button" onClick={() => void load()}>
            Reload
          </button>
        </div>
        <ErrorText error={error} />
        {list === null ? (
          !error && <p className="muted">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Joined</th>
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...list]
                  .sort((a, b) => a.id - b.id)
                  .map((u) => {
                    // The API refuses to change your own role (403).
                    const self = u.id === me.id;
                    return (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>
                          {u.email}
                          {self && <span className="muted"> (you)</span>}
                        </td>
                        <td>{u.name ?? <span className="muted">-</span>}</td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          <select
                            aria-label={`Role of ${u.email}`}
                            value={u.role}
                            disabled={busy || self}
                            onChange={(e) =>
                              void setRole(u.id, e.target.value as Role)
                            }
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td>
                          <ConfirmButton
                            disabled={busy || self}
                            onConfirm={() => void remove(u.id)}
                          >
                            Delete
                          </ConfirmButton>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <LookupCard />
    </>
  );
}

// GET /users/:id, shown raw.
function LookupCard() {
  const [id, setId] = useState('');
  const [found, setFound] = useState<User | null>(null);
  const { busy, error, run } = useAction();

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    setFound(null);
    // Sent as typed, so you can watch ParseIdPipe reject "abc" or 99999999999.
    void run(async () => setFound(await users.get(id)));
  };

  return (
    <section className="card">
      <h2>Look up a user</h2>
      <form onSubmit={submit} className="row">
        <input
          placeholder="User ID"
          aria-label="User ID"
          required
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          Fetch
        </button>
      </form>
      <ErrorText error={error} />
      {found && <pre>{JSON.stringify(found, null, 2)}</pre>}
    </section>
  );
}
