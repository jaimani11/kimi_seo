'use client';

import { useState } from 'react';

interface AdminLoginFormProps {
  returnTo: string;
  hadError: boolean;
}

export function AdminLoginForm({ returnTo, hadError }: AdminLoginFormProps) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(hadError ? 'Incorrect password.' : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = returnTo || '/admin/marketing';
        return;
      }
      setError('Incorrect password.');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-xl border p-6"
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '1.6rem',
          fontWeight: 400,
          letterSpacing: '-0.015em',
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        gotript admin
      </h1>
      <p
        className="mt-1"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.82rem',
          color: 'var(--ink-tertiary)',
        }}
      >
        Enter the admin password to continue.
      </p>

      <label className="mt-5 block">
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Password
        </span>
        <input
          type="password"
          value={password}
          autoFocus
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-md border px-3 py-2 outline-none"
          style={{
            background: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--ink-primary)',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
          }}
        />
      </label>

      {error ? (
        <p
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'var(--accent-warm)',
          }}
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || password.length === 0}
        className="mt-5 w-full rounded-md px-4 py-2 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: 'var(--accent-primary)',
          color: 'var(--surface-base)',
          border: 'none',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.03em',
        }}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
