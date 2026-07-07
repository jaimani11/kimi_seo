/**
 * One-time generator for src/poi-coords.ts — coordinates for the
 * neighborhoods named in DESTINATION_GUIDES so destination maps can
 * pin "where to base yourself" and compute walking distances.
 *
 * Geocoder: Photon (photon.komoot.io) — free OSM-backed search, no
 * key. Each hit is validated to sit within 30km of the city centroid
 * (metro-scale sanity check); misses and far-out results are simply
 * dropped — a missing pin is better than a wrong one.
 *
 * Run from the repo root (~550 lookups, throttled, ~4 minutes):
 *   node --experimental-strip-types packages/seo-data/scripts/generate-poi-coords.mts
 *
 * Data © OpenStreetMap contributors (ODbL).
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEO_CITIES } from '../src/cities.ts';
import { DESTINATION_GUIDES } from '../src/destination-content.ts';

const MAX_KM_FROM_CENTER = 30;
const DELAY_MS = 300;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "Aker Brygge / Tjuvholmen" → "Aker Brygge"; strip parentheticals. */
function searchName(raw: string): string {
  return raw.split(' / ')[0].split(' & ')[0].replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

interface PhotonResponse {
  features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
}

async function geocode(query: string, attempt = 1): Promise<{ lat: number; lng: number } | null> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'adored-moments-platform data generator (one-time build script)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as PhotonResponse;
    const coords = body.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    return { lat: coords[1], lng: coords[0] };
  } catch {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      return geocode(query, attempt + 1);
    }
    return null;
  }
}

async function main() {
  const citiesBySlug = new Map(SEO_CITIES.map((c) => [c.slug, c]));
  const out: Array<{ slug: string; pois: Array<{ name: string; lat: number; lng: number }> }> = [];
  let looked = 0;
  let kept = 0;
  let dropped = 0;

  for (const [slug, guide] of Object.entries(DESTINATION_GUIDES)) {
    const city = citiesBySlug.get(slug);
    if (!city || !guide.neighborhoods?.length) continue;
    const pois: Array<{ name: string; lat: number; lng: number }> = [];
    for (const n of guide.neighborhoods) {
      looked++;
      const q = `${searchName(n.name)}, ${city.name}, ${city.countryName}`;
      const hit = await geocode(q);
      await new Promise((r) => setTimeout(r, DELAY_MS));
      if (hit && haversineKm(city.coordinates, hit) <= MAX_KM_FROM_CENTER) {
        // Keep the guide's original display name so pages can join blurbs.
        pois.push({ name: n.name, lat: +hit.lat.toFixed(5), lng: +hit.lng.toFixed(5) });
        kept++;
      } else {
        dropped++;
      }
      if (looked % 50 === 0) console.log(`${looked} looked up (${kept} kept, ${dropped} dropped)`);
    }
    if (pois.length > 0) out.push({ slug, pois });
  }

  const key = (s: string) => (/^[a-z][a-z0-9]*$/.test(s) ? s : `'${s}'`);
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const lines = out.map(
    (c) =>
      `  ${key(c.slug)}: [${c.pois
        .map((p) => `{ name: '${esc(p.name)}', lat: ${p.lat}, lng: ${p.lng} }`)
        .join(', ')}],`,
  );

  const body = `/**
 * Neighborhood pin coordinates for destination maps. GENERATED FILE —
 * regenerate with scripts/generate-poi-coords.mts, do not hand-edit.
 *
 * Geocoded from DESTINATION_GUIDES neighborhood names via Photon
 * (OSM). Names match the guide's neighborhoods[].name exactly so
 * pages can join blurbs by name. Cities/neighborhoods that failed
 * geocoding or landed >30km from the centroid are intentionally
 * absent. Data © OpenStreetMap contributors (ODbL).
 */

export interface NeighborhoodPoi {
  /** Matches DESTINATION_GUIDES[slug].neighborhoods[].name. */
  name: string;
  lat: number;
  lng: number;
}

export const NEIGHBORHOOD_COORDS: Readonly<Record<string, ReadonlyArray<NeighborhoodPoi>>> = {
${lines.join('\n')}
};

export function findNeighborhoodPois(citySlug: string): ReadonlyArray<NeighborhoodPoi> {
  return NEIGHBORHOOD_COORDS[citySlug] ?? [];
}
`;

  const dest = join(dirname(fileURLToPath(import.meta.url)), '../src/poi-coords.ts');
  writeFileSync(dest, body);
  console.log(`Wrote ${out.length} cities / ${kept} pins (${dropped} dropped) to ${dest}`);
}

main();
