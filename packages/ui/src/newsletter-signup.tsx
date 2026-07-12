'use client';

import { useState } from 'react';

/**
 * Email-capture form. Posts to the app's /api/newsletter/subscribe
 * route (brand-bound), which adds the contact to the brand's Resend
 * audience. Theme-neutral: reads --accent-primary / --ink-* / surface
 * tokens so it looks right on every brand, light or dark.
 *
 * Spam control is a honeypot: a visually-hidden `company` field real
 * users never see. Bots that fill it get a silent success and are
 * never sent to Resend (the API route drops them).
 */
export function NewsletterSignup({
  heading = 'Better trip ideas, delivered occasionally.',
  blurb = 'Where to go, when to visit, and where to stay — a few times a month. No spam, unsubscribe anytime.',
  compact = false,
}: {
  heading?: string;
  blurb?: string;
  /** Footer variant — tighter spacing, smaller type. */
  compact?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'loading' || state === 'done') return;
    setState('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, company, source: compact ? 'footer' : 'section' }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (body.ok) {
        setState('done');
        setMessage(body.message ?? "You're in!");
      } else {
        setState('error');
        setMessage(body.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  const done = state === 'done';

  return (
    <section
      style={{
        borderRadius: compact ? '0.85rem' : '1.1rem',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-elevated)',
        padding: compact ? '1.1rem 1.25rem' : '1.75rem 1.75rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: compact ? '0.95rem' : 'clamp(1.05rem, 2vw, 1.35rem)',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        {heading}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: compact ? '0.8rem' : '0.9rem',
          lineHeight: 1.55,
          color: 'var(--ink-tertiary)',
          margin: '0.4rem 0 0',
        }}
      >
        {blurb}
      </p>

      {done ? (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            margin: '0.9rem 0 0',
          }}
        >
          ✓ {message}
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.9rem 0 0' }}
        >
          {/* Honeypot — hidden from humans, catnip for bots. */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            aria-hidden
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            style={{
              flex: '1 1 200px',
              minWidth: 0,
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              padding: '0.7rem 0.9rem',
              borderRadius: '0.6rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-base)',
              color: 'var(--ink-primary)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.7rem 1.3rem',
              borderRadius: '0.6rem',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              cursor: state === 'loading' ? 'default' : 'pointer',
              opacity: state === 'loading' ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
          {state === 'error' ? (
            <p
              role="alert"
              style={{
                flexBasis: '100%',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#dc2626',
                margin: '0.1rem 0 0',
              }}
            >
              {message}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
