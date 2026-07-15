import type { Metadata } from 'next';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { ContactForm } from '@/features/site/contact-form';

export const metadata: Metadata = {
  title: 'Contact gobookt',
  description:
    'Contact gobookt. Press, partnerships, or feedback on a hotel guide — send a message and we respond within 2 business days.',
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.66rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Contact gobookt
        </p>
        <h1
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Get in touch.
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: 'var(--ink-secondary)',
            margin: 0,
          }}
        >
          Press, a partnership idea, or feedback on one of our hotel guides — send it
          through the form and we&apos;ll reply within two business days.
        </p>

        <div className="mt-8">
          <ContactForm />
        </div>

        <div
          className="mt-10 rounded-xl border p-4"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            color: 'var(--ink-tertiary)',
          }}
        >
          <strong style={{ color: 'var(--ink-secondary)' }}>
            Need to change a hotel booking?
          </strong>{' '}
          Reservations are held by Booking.com, not gobookt. To modify or cancel a
          stay, contact Booking.com support directly at{' '}
          <a
            href="https://secure.booking.com/help.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
          >
            secure.booking.com/help.html
          </a>{' '}
          — they can action it faster than we can.
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
