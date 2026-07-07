import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@adored/brand-config',
    '@adored/seo-data',
    '@adored/affiliate',
    '@adored/marketing',
    '@adored/imagery',
    '@adored/seo-routing',
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
};

export default config;
