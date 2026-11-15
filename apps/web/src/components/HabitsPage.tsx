import { useCallback, useEffect, useState, type SubmitEvent } from 'react';
import {
  habits,
  type Frequency,
  type Habit,
  type HabitCompletion,
} from '../api';
import { ConfirmButton, ErrorText, formatDate, useAction } from './ui';

const FREQUENCIES: Frequency[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

export function HabitsPage() {
  const [list, setList] = useState<Habit[] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { error, run } = useAction();

  // GET /habits. Served from Redis for up to 60 s, until a write invalidates it.
  const load = useCallback(
    () => run(async () => setList(await habits.list())),
    [run],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const visible = (list ?? [])
    .filter((h) => showArchived || !h.archived)
    .sort((a, b) => a.id - b.id);

  return (
    <>
      <NewHabitForm onCreated={load} />

      <section>
        <div className="toolbar">
          <h2>Your habits</h2>
          <label className="inline">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <button type="button" onClick={() => void load()}>
            Reload
          </button>
        </div>
        <ErrorText error={error} />
        {list === null ? (
          !error && <p className="muted">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="muted">No habits here yet.</p>
        ) : (
          <ul className="cards">
            {visible.map((h) => (
              <HabitCard key={h.id} habit={h} onChanged={load} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function NewHabitForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency | ''>('');
  const { busy, error, run } = useAction();

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    void run(async () => {
      // POST /habits. Empty optional fields are left out of the body.
      await habits.create({
        name,
        ...(description && { description }),
        ...(frequency && { frequency }),
      });
      setName('');
      setDescription('');
      setFrequency('');
      onCreated();
    });
  };

  return (
    <section className="card">
      <h2>New habit</h2>
      <form onSubmit={submit} className="row">
        <input
          placeholder="Name"
          aria-label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Description (optional, max 100)"
          aria-label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FrequencySelect value={frequency} onChange={setFrequency} />
        <button type="submit" className="primary" disabled={busy}>
          Add
        </button>
      </form>
      <ErrorText error={error} />
    </section>
  );
}

function HabitCard({
  habit,
  onChanged,
}: {
  habit: Habit;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Habit | null>(null);
  const [history, setHistory] = useState<HabitCompletion[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { busy, error, run } = useAction();

  const act = (fn: () => Promise<unknown>) => {
    setNotice(null);
    void run(fn);
  };

  // POST /habits/:id/complete. 409 if it's already done today.
  const complete = () =>
    act(async () => {
      const done = await habits.complete(habit.id);
      setNotice(`Done! Recorded at ${formatDate(done.completedAt)}.`);
      setHistory((h) => (h ? [done, ...h] : h));
    });

  // GET /habits/:id/completions, newest first.
  const toggleHistory = () =>
    history
      ? setHistory(null)
      : act(async () => setHistory(await habits.completions(habit.id)));

  // GET /habits/:id, so the form starts from the DB, not the cached list.
  const startEdit = () =>
    act(async () => setEditing(await habits.get(habit.id)));

  if (editing) {
    return (
      <li className="card">
        <EditHabitForm
          habit={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      </li>
    );
  }

  return (
    <li className={`card habit${habit.archived ? ' archived' : ''}`}>
      <div className="habit-head">
        <h3>{habit.name}</h3>
        {habit.frequency && <span className="badge">{habit.frequency}</span>}
        {habit.archived && <span className="badge muted">ARCHIVED</span>}
        <span className="muted small">#{habit.id}</span>
      </div>
      {habit.description && <p>{habit.description}</p>}
      <p className="muted small">Created {formatDate(habit.createdAt)}</p>

      <div className="row">
        <button
          type="button"
          className="primary"
          disabled={busy}
          onClick={complete}
        >
          Complete
        </button>
        <button type="button" disabled={busy} onClick={toggleHistory}>
          {history ? 'Hide history' : 'History'}
        </button>
        <button type="button" disabled={busy} onClick={startEdit}>
          Edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            // PUT /habits/:id with just the one field.
            act(async () => {
              await habits.update(habit.id, { archived: !habit.archived });
              onChanged();
            })
          }
        >
          {habit.archived ? 'Unarchive' : 'Archive'}
        </button>
        <ConfirmButton
          disabled={busy}
          onConfirm={() =>
            // DELETE /habits/:id. Its completions go with it (ON DELETE CASCADE).
            act(async () => {
              await habits.remove(habit.id);
              onChanged();
            })
          }
        >
          Delete
        </ConfirmButton>
      </div>

      {notice && <p className="notice">{notice}</p>}
      <ErrorText error={error} />

      {history &&
        (history.length === 0 ? (
          <p className="muted small">Never completed.</p>
        ) : (
          <ol className="history">
            {history.map((c) => (
              <li key={c.id}>{formatDate(c.completedAt)}</li>
            ))}
          </ol>
        ))}
    </li>
  );
}

function EditHabitForm({
  habit,
  onCancel,
  onSaved,
}: {
  habit: Habit;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(habit.name);
  const [description, setDescription] = useState(habit.description ?? '');
  const [frequency, setFrequency] = useState<Frequency | ''>(
    habit.frequency ?? '',
  );
  const [archived, setArchived] = useState(habit.archived);
  const { busy, error, run } = useAction();

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    void run(async () => {
      // PUT /habits/:id. null clears a nullable column.
      await habits.update(habit.id, {
        name,
        description: description || null,
        frequency: frequency || null,
        archived,
      });
      onSaved();
    });
  };

  return (
    <form onSubmit={submit} className="stack">
      <h3>Edit habit #{habit.id}</h3>
      <label>
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Description
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label>
        Frequency
        <FrequencySelect value={frequency} onChange={setFrequency} />
      </label>
      <label className="inline">
        <input
          type="checkbox"
          checked={archived}
          onChange={(e) => setArchived(e.target.checked)}
        />
        Archived
      </label>
      <ErrorText error={error} />
      <div className="row">
        <button type="submit" className="primary" disabled={busy}>
          Save
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function FrequencySelect({
  value,
  onChange,
}: {
  value: Frequency | '';
  onChange: (value: Frequency | '') => void;
}) {
  return (
    <select
      aria-label="Frequency"
      value={value}
      onChange={(e) => onChange(e.target.value as Frequency | '')}
    >
      <option value="">No frequency</option>
      {FREQUENCIES.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}
