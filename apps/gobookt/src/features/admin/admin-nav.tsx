import Link from 'next/link';

export type AdminSection =
  | 'dashboard'
  | 'turns'
  | 'clicks'
  | 'bookings'
  | 'users'
  | 'memories'
  | 'affiliate'
  | 'viator'
  | 'social'
  | 'content'
  | 'analytics'
  | 'marketing';

interface AdminNavProps {
  active: AdminSection;
}

const LINKS: Array<{ id: AdminSection; label: string; href: string }> = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin' },
  { id: 'turns', label: 'Turns', href: '/admin' },
  { id: 'clicks', label: 'Clicks', href: '/admin/clicks' },
  { id: 'bookings', label: 'Bookings', href: '/admin/bookings' },
  { id: 'users', label: 'Users', href: '/admin' },
  { id: 'memories', label: 'Memories', href: '/admin/memories' },
  { id: 'affiliate', label: 'Affiliate', href: '/admin/affiliate' },
  { id: 'viator', label: 'Viator', href: '/admin/viator' },
  { id: 'social', label: 'Social', href: '/admin/social' },
  { id: 'content', label: 'Content Ops', href: '/admin/content' },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics' },
  { id: 'marketing', label: 'Marketing', href: '/admin/marketing' },
];

/**
 * Top-level admin nav. "Turns" + "Users" land back on the dashboard
 * because both are entry-only via id (`/admin/turns/[turnId]`,
 * `/admin/users/[userId]`); the dashboard's recent-turn list is the
 * launch pad for both. Future C5.x adds a turn-list page if the
 * lookup becomes a primary surface.
 */
export function AdminNav({ active }: AdminNavProps) {
  return (
    <nav
      className="mb-6 flex items-center gap-1 border-b"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {LINKS.map((link) => {
        const isActive = link.id === active;
        return (
          <Link
            key={link.id}
            href={link.href}
            className="border-b-2 px-3 py-2 transition-colors hover:text-[color:var(--ink-primary)]"
            style={{
              borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
              color: isActive ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
