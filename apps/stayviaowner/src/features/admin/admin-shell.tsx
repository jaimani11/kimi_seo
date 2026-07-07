import type { ReactNode } from 'react';
import { AdminNav, type AdminSection } from './admin-nav';

interface AdminShellProps {
  section: AdminSection;
  /** Section title - shown in the breadcrumb. */
  title: string;
  /** Optional supporting line under the title (italic Fraunces). */
  subtitle?: string;
  children: ReactNode;
}

/**
 * Wraps an admin page with the shared header + nav. Same width and
 * padding as the dashboard so navigation between pages feels stable.
 */
export function AdminShell({ section, title, subtitle, children }: AdminShellProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
      <header className="mb-6 flex flex-col gap-1">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-tertiary)',
          }}
        >
          Operator › {title}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'var(--text-display-lg, 3.5rem)',
            fontWeight: 300,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className="mt-1 max-w-xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'var(--text-body-sm)',
              fontStyle: 'italic',
              color: 'var(--ink-tertiary)',
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </header>
      <AdminNav active={section} />
      {children}
    </main>
  );
}
