import type { BrandConfig } from './types';

/**
 * The four live brands under Adored Moments LLC.
 *
 * Launching brand #5: add an entry here, copy the closest app shell
 * in apps/, point its src/brand.ts at the new entry, set env vars in
 * Vercel, connect the domain. Target: under 30 minutes.
 */

export const NUMIWORKS: BrandConfig = {
  key: 'numiworks',
  name: 'numiworks',
  domain: 'numiworks.com',
  siteUrl: 'https://www.numiworks.com',
  tagline: 'Tours, hotels & whole homes worldwide — planned by AI, booked in one place.',
  legalName: 'Adored Moments LLC',
  description:
    'numiworks is an AI-powered travel planner that brings tours, activities, hotels, and whole-home rentals into one place — plan a trip by chatting, then book real inventory from partners like Viator and Vrbo.',
  logoPath: '/logo.svg',
  social: { sameAs: [] },
  colors: {
    primary: '#006ce4',
    secondary: '#ff5e3a',
    header: '#003b95',
  },
  affiliate: {
    providers: ['viator', 'getyourguide', 'vrbo'],
    gygPartnerId: 'SL52HD5',
    vrboShortlink: 'https://vrbo.com/affiliate/zVJTNin',
  },
  pinterestBoardId: '825988456598211956',
};

export const GOTRIPT: BrandConfig = {
  key: 'gotript',
  name: 'gotript',
  domain: 'gotript.com',
  siteUrl: 'https://www.gotript.com',
  tagline: 'Hotels, vacation rentals, flights & more — every Expedia vertical in one search.',
  legalName: 'Adored Moments LLC',
  description:
    'gotript unifies every Expedia travel vertical — hotels, vacation rentals, flights, cars, and activities — in a single search, backed by data-driven destination guides and itineraries.',
  logoPath: '/logo.svg',
  social: { sameAs: [] },
  colors: {
    primary: '#006ce4',
    secondary: '#ff5e3a',
    header: '#003b95',
  },
  affiliate: {
    providers: ['expedia', 'vrbo', 'viator', 'getyourguide'],
    expediaLabel: 'gotript',
    expediaCamref: '1110lFruB',
    gygPartnerId: 'SL52HD5',
  },
  pinterestBoardId: '825988456598211957',
};

export const GOBOOKT: BrandConfig = {
  key: 'gobookt',
  name: 'gobookt',
  domain: 'gobookt.com',
  // Apex (non-www) is gobookt's canonical host: Google already indexed
  // https://gobookt.com/ and treats www as the duplicate, so we adopt the
  // apex rather than fight it. This drives every canonical signal (canonical
  // tags, OG/Twitter urls, sitemap, robots, JSON-LD, metadataBase) AND flips
  // the middleware host-redirect to www -> apex. (The other 3 brands stay www.)
  siteUrl: 'https://gobookt.com',
  tagline: 'Hotel discovery, powered by Booking.com.',
  legalName: 'Adored Moments LLC',
  description:
    'gobookt is a hotel-discovery service powered by Booking.com, helping travelers compare and book stays across thousands of destinations with rich, data-backed city guides.',
  logoPath: '/logo.svg',
  social: { sameAs: [] },
  colors: {
    primary: '#006ce4',
    secondary: '#ff5e3a',
    header: '#003b95',
  },
  affiliate: {
    // Single-vendor during the Booking.com CJ review — do NOT add
    // VRBO / GetYourGuide / Expedia surfaces to gobookt until the
    // review clears.
    providers: ['booking'],
  },
  pinterestBoardId: '825988456598211958',
};

export const STAYVIAOWNER: BrandConfig = {
  key: 'stayviaowner',
  name: 'stayviaowner',
  domain: 'stayviaowner.com',
  siteUrl: 'https://www.stayviaowner.com',
  tagline: 'Whole homes, villas, cabins and cottages — one search across every property type.',
  legalName: 'Adored Moments LLC',
  description:
    'stayviaowner helps travelers book whole homes, villas, cabins, and cottages through vacation-rental partners like Vrbo — one search across every property type.',
  logoPath: '/logo.svg',
  social: { sameAs: [] },
  colors: {
    primary: '#37d0a1',
    secondary: '#2fbb90',
    header: '#0f2340',
  },
  affiliate: {
    providers: ['vrbo', 'expedia'],
    expediaLabel: 'stayviaowner',
    expediaCamref: '1110lFruB',
  },
  pinterestBoardId: '825988456598212255',
};

export const ALL_BRANDS: readonly BrandConfig[] = [
  NUMIWORKS,
  GOTRIPT,
  GOBOOKT,
  STAYVIAOWNER,
];

export function findBrand(key: string): BrandConfig | null {
  return ALL_BRANDS.find((b) => b.key === key) ?? null;
}
