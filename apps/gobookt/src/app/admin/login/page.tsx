import type { Metadata } from 'next';
import { AdminLoginForm } from '@/features/admin/admin-login-form';
import { isPasswordGateEnabled } from '@lib/admin/password-session';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign in · Admin · gobookt',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}

/**
 * Hidden admin login page. Renders only when `ADMIN_PASSWORD` is set.
 *
 * Behavior:
 *   - `ADMIN_PASSWORD` unset → the gate is OPEN site-wide, so a login
 *     surface would be confusing. We redirect to / instead.
 *   - With the env set, this page shows a single password field.
 *
 * Search params:
 *   - returnTo: absolute path to bounce to after successful login.
 *   - error:    if present, login attempt failed; render a soft note.
 */
export default async function AdminLoginPage({ searchParams }: PageProps) {
  if (!isPasswordGateEnabled()) {
    redirect('/');
  }
  const params = await searchParams;
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: 'var(--surface-base)' }}
    >
      <AdminLoginForm
        returnTo={params.returnTo ?? '/admin/marketing'}
        hadError={params.error === '1'}
      />
    </div>
  );
}
