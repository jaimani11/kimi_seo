import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Visible breadcrumb trail. Pair with a BreadcrumbList JSON-LD
 * producer so the user-visible trail and the machine-readable trail
 * stay in lockstep.
 *
 * The last item is rendered as plain text - the current page should
 * never link to itself.
 */
export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 px-6 pt-4"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.72rem',
        letterSpacing: '0.04em',
        color: 'var(--ink-tertiary)',
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${i}-${item.label}`} className="inline-flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-[color:var(--ink-secondary)]"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                style={{ color: isLast ? 'var(--ink-secondary)' : 'inherit' }}
              >
                {item.label}
              </span>
            )}
            {!isLast ? <ChevronRight /> : null}
          </span>
        );
      })}
    </nav>
  );
}

/** Inlined separator chevron — keeps the package dependency-free. */
function ChevronRight() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ opacity: 0.6 }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
