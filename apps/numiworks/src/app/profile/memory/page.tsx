import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { MemoryList } from '@/features/profile/memory-list';
import { getMemorySubsystem } from '@lib/memory';
import { resolveSession } from '@lib/session/anonymous';

export const metadata: Metadata = {
  title: 'Your travel memory · numiworks',
  description:
    'See exactly what our AI has learned about your travel preferences and delete anything you want to be forgotten. Every memory is scoped to your session — no one else can see it.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProfileMemoryPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const session = resolveSession(cookieHeader || null);

  const mem = getMemorySubsystem();
  const records = await mem.store.listForOwner({
    ownerKind: 'session',
    ownerId: session.sessionId,
    limit: 200,
  });

  const rows = records.map((r) => ({
    id: r.id,
    kind: r.kind,
    content: r.content,
    signalKey: r.signalKey,
    createdAt: r.createdAt,
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14">
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
          Your travel memory
        </p>
        <h1
          className="mt-3"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: 'var(--ink-primary)',
            margin: 0,
          }}
        >
          Everything the AI remembers about you.
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.02rem',
            lineHeight: 1.6,
            color: 'var(--ink-secondary)',
            margin: 0,
          }}
        >
          Below is every memory our AI concierge has recorded to help plan your
          trips. Memories are scoped to your session — <strong>no one else can
          see them</strong>, not even our admins in aggregate. Delete anything you
          don&apos;t want us to remember.
        </p>

        <div className="mt-8">
          <MemoryList initial={rows} />
        </div>

        <div
          className="mt-10 rounded-xl border p-4"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            lineHeight: 1.55,
            color: 'var(--ink-tertiary)',
          }}
        >
          <strong style={{ color: 'var(--ink-secondary)' }}>How this works.</strong>{' '}
          When you use the AI concierge on numiworks, the system records short
          text notes about your preferences (destination, travel style, group
          size, etc.) so it can give better answers next time you visit. Nothing
          is shared with third parties. See our{' '}
          <Link
            href="/privacy"
            style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
          >
            privacy notice
          </Link>{' '}
          for full details.
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
