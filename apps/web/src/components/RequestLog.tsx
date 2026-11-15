import { useSyncExternalStore } from 'react';
import { requestLog } from '../api';

const statusClass = (status: number | null) =>
  status === null || status >= 500 ? 'bad' : status >= 400 ? 'warn' : 'ok';

// Every request the page sends, newest first.
export function RequestLog() {
  const entries = useSyncExternalStore(requestLog.subscribe, requestLog.get);

  return (
    <aside className="log card" aria-label="Request log">
      <div className="toolbar">
        <h2>Requests</h2>
        <button type="button" onClick={requestLog.clear}>
          Clear
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="muted small">Nothing sent yet.</p>
      ) : (
        <ol>
          {entries.map((e) => (
            <li key={e.id}>
              <span className="muted">{e.at.toLocaleTimeString()}</span>
              <span className={`status ${statusClass(e.status)}`}>
                {e.status ?? 'ERR'}
              </span>
              <span className="mono">
                {e.method} {e.path}
              </span>
              <span className="muted">{Math.round(e.ms)} ms</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
