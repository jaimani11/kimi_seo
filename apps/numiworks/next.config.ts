import type { NextConfig } from 'next';

// Content-Security-Policy shipped REPORT-ONLY first: it documents the intended
// policy and logs violations to the browser console, but NEVER blocks — so it
// can't break the Leaflet/OSM maps, the GetYourGuide widget, Plausible, GTM, or
// affiliate pixels. Flip the header key to "Content-Security-Policy" to enforce
// once a violation check comes back clean. `https:`/`'unsafe-inline'` are the
// pragmatic allowances for an image-heavy site with lots of inline styles.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://*.getyourguide.com https://www.booking.com https://www.googletagmanager.com https://*.google-analytics.com",
  "connect-src 'self' https://plausible.io https://*.getyourguide.com https://api.getyourguide.com https://*.booking.com https://*.google-analytics.com",
  "frame-src https://*.getyourguide.com https://*.booking.com",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Content-Security-Policy', value: CSP },
];

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@adored/brand-config',
    '@adored/seo-data',
    '@adored/affiliate',
    '@adored/marketing',
    '@adored/imagery',
    '@adored/seo-routing',
    '@adored/travel-tools',
    '@adored/ui',
  ],
  poweredByHeader: false,
  // Hide Next.js's dev indicator entirely - the small "N" badge that
  // floats in a corner is distracting during demos and overlaps with
  // app chrome at certain viewport widths.
  devIndicators: false,
  images: {
    // Slice A photos come from Unsplash. Real-provider domains added in Slice B.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default config;
