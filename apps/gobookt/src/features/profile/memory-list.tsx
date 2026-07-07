'use client';

import { useState } from 'react';

interface MemoryRow {
  id: string;
  kind: 'episodic' | 'structural';
  content: string;
  signalKey?: string;
  createdAt: string;
}

/**
 * Client-side memory list with delete affordance. Each row has a
 * subtle "Forget this" button that calls DELETE /api/memory/[id].
 *
 * Optimistic UI: we remove the row from local state immediately, then
 * the API call. If the API call fails we re-insert with an error
 * banner. This keeps the interaction snappy — memory deletes are
 * near-instant with the in-memory store, but the pgvector path (C1.x)
 * will be slower.
 */
export function MemoryList({ initial }: { initial: MemoryRow[] }) {
  const [rows, setRows] = useState(initial);
  const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleForget(id: string) {
    const previous = rows;
    setRows(rows.filter((r) => r.id !== id));
    setStatus('deleting');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/memory/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`server returned ${res.status}`);
      }
      setStatus('idle');
    } catch (err) {
      setRows(previous);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Nothing remembered yet.
        </p>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            margin: 0,
          }}
        >
          Ask the AI concierge to plan a trip and it will start learning what you
          like. Nothing is remembered until you use the concierge.
        </p>
      </div>
    );
  }

  return (
    <div>
      {status === 'error' && (
        <div
          className="mb-4 rounded-md border p-3"
          style={{
            background: '#fef2f2',
            borderColor: '#fecaca',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#b91c1c',
          }}
        >
          Delete failed: {errorMsg}. The memory is still on record. Try again.
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border p-4"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.62rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color:
                      row.kind === 'structural'
                        ? 'var(--accent-primary)'
                        : 'var(--ink-tertiary)',
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  {row.kind === 'structural' ? 'Preference' : 'From conversation'}
                  {row.signalKey ? ` · ${row.signalKey}` : ''}
                </p>
                <p
                  className="mt-1.5"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.98rem',
                    lineHeight: 1.5,
                    color: 'var(--ink-primary)',
                    margin: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {row.content}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.72rem',
                    color: 'var(--ink-tertiary)',
                    margin: 0,
                  }}
                >
                  Recorded {formatDate(row.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleForget(row.id)}
                disabled={status === 'deleting'}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--ink-secondary)',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '999px',
                  padding: '0.4rem 0.85rem',
                  cursor: status === 'deleting' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Forget this
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
