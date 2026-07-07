import type { StayPhoto } from '@core/stay';

// Unsplash URL helpers. Photos are referenced by stable photo ID; the URL
// builder applies our standard size/quality params. Real-provider photo
// sources (expedia, vrbo) plug into the same StayPhoto.source discriminator
// and route to their own URL builders in Slice B.

const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';

export function unsplashPhoto(args: {
  id: string;
  alt: string;
  credit: string;
  width?: number;
  height?: number;
}): StayPhoto {
  const w = args.width ?? 1600;
  const h = args.height;
  const params = new URLSearchParams({
    w: String(w),
    q: '80',
    fit: 'crop',
    auto: 'format',
  });
  if (h !== undefined) params.set('h', String(h));

  const photo: StayPhoto = {
    url: `${UNSPLASH_BASE}${args.id}?${params.toString()}`,
    source: 'unsplash',
    credit: args.credit,
    license: 'https://unsplash.com/license',
    alt: args.alt,
    width: w,
  };
  if (h !== undefined) photo.height = h;
  return photo;
}

// Deterministic gradient color pair for the bloom-fallback when a photo
// URL fails to load. Hashes the stay slug so each stay gets its own
// consistent placeholder palette. Spec §4.7 - loading state is a bloom
// gradient, never a gray box.
const PALETTES: { from: string; to: string }[] = [
  { from: '#6F8170', to: '#2C3A30' }, // tuscan green
  { from: '#B07050', to: '#5C2C1E' }, // terracotta
  { from: '#4A6580', to: '#1F2C3A' }, // dusk blue
  { from: '#C9A574', to: '#704F2D' }, // honey
  { from: '#5C5670', to: '#2A2638' }, // plum dusk
  { from: '#7C8460', to: '#3E4A2B' }, // olive
];

export function fallbackGradient(slug: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  const palette = PALETTES[hash % PALETTES.length];
  if (!palette) throw new Error('unreachable: PALETTES is non-empty');
  return palette;
}
