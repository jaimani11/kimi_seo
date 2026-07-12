import type { Metadata } from 'next';
import { getSiteOrigin } from '@/lib/site/origin';
import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';

import { fontVariables } from '@/lib/fonts';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { getServerTheme } from '@/lib/theme/get-server-theme';
import { AuthProvider, MigrateOnSignIn } from '@/lib/auth';
import { resolveSession } from '@/lib/session/anonymous';
import { MarketplaceDrawerHost } from '@/features/marketplace/marketplace-drawer';
import { AnalyticsScript } from '@/lib/analytics/script';

import '@/styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  // Middleware publishes the current pathname as `x-pathname`; use it to emit
  // a self-referencing canonical on every page that doesn't set its own.
  // Absent (e.g. the Clerk-auth path) → no canonical emitted, no regression.
  const pathname = (await headers()).get('x-pathname');
  return {
    title: 'stayviaowner · Find tours, day trips & experiences worldwide',
    description:
      'AI-native travel orchestration. Describe your trip in a sentence; specialized agents handle the rest.',
    metadataBase: new URL(getSiteOrigin()),
    ...(pathname ? { alternates: { canonical: `${getSiteOrigin()}${pathname}` } } : {}),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = await getServerTheme();
  // Middleware mints the anonymous session cookie on first request, so
  // by the time we get here it's present. resolveSession() also handles
  // the rare case where middleware hasn't run yet (RSC dev hot path) by
  // generating a value - the next request will overwrite it consistently.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const { sessionId } = resolveSession(cookieHeader || null);

  return (
    <html lang="en" data-theme={theme} className={fontVariables} suppressHydrationWarning>
      <head>
        <meta name="p:domain_verify" content="eb7fe726f2b68def462a495fc1bd90c4" />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider initial={theme}>
          <AuthProvider sessionId={sessionId}>
            <MigrateOnSignIn />
            <div
              className="relative min-h-screen"
              style={{
                backgroundColor: 'var(--surface-base)',
              }}
            >
              {children}
            </div>
            <MarketplaceDrawerHost />
          </AuthProvider>
        </ThemeProvider>
        <AnalyticsScript />
        {/* GetYourGuide global loader — hydrates every `.gyg-widget`
          * element on the page. Partner id SL52HD5 (approved). */}
        <script
          async
          defer
          src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
          data-gyg-partner-id={(process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? 'SL52HD5').trim()}
        />
      </body>
    </html>
  );
}
