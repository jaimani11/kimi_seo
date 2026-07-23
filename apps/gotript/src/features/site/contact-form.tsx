'use client';

import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.98rem',
  padding: '0.75rem 0.9rem',
  border: '1px solid var(--border-subtle)',
  borderRadius: '0.5rem',
  background: 'var(--surface-elevated)',
  color: 'var(--ink-primary)',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-secondary)',
  marginBottom: '0.4rem',
};

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot — real users don't touch this. If it comes back non-empty,
  // it's a bot and we silently drop the submission server-side.
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Something went wrong. Please try again.');
      }
      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-xl border p-6"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--accent-primary)',
          borderWidth: '2px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Thanks — message sent.
        </p>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
            margin: 0,
          }}
        >
          We&apos;ve got your note and will get back to you within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from real users via CSS, invisible to
        * screen-readers. Bots that scrape and fill every field will trip it. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />

      <div className="mb-5">
        <label style={LABEL_STYLE} htmlFor="contact-name">
          Your name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          style={INPUT_STYLE}
          disabled={status === 'submitting'}
        />
      </div>

      <div className="mb-5">
        <label style={LABEL_STYLE} htmlFor="contact-email">
          Your email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          style={INPUT_STYLE}
          disabled={status === 'submitting'}
        />
      </div>

      <div className="mb-5">
        <label style={LABEL_STYLE} htmlFor="contact-subject">
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          style={INPUT_STYLE}
          disabled={status === 'submitting'}
          placeholder="Media enquiry / partnership / feedback / bug report…"
        />
      </div>

      <div className="mb-6">
        <label style={LABEL_STYLE} htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          rows={7}
          style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '10rem' }}
          disabled={status === 'submitting'}
        />
      </div>

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
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          background: status === 'submitting' ? '#94a3b8' : '#4a2c4d',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.85rem 1.6rem',
          cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
