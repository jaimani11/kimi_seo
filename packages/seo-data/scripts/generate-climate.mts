/**
 * One-time generator for src/climate-data.ts.
 *
 * Pulls 5 years (2020-2024) of daily ERA5 reanalysis per city from
 * Open-Meteo's archive API and reduces it to monthly normals:
 * average daily high, average daily low, rain days (precip ≥ 1mm),
 * and mean monthly precipitation. Also captures the city's IANA
 * timezone from the same response (timezone=auto) so LocalTimeStrip
 * needs no runtime lookup.
 *
 * Run from the repo root (rate-friendly, ~2-3 minutes):
 *   node --experimental-strip-types packages/seo-data/scripts/generate-climate.mts
 *
 * Data source: ERA5 via Open-Meteo archive API.
 * Attribution: Copernicus Climate Change Service (C3S) / Open-Meteo.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEO_CITIES } from '../src/cities.ts';

const START = '2020-01-01';
const END = '2024-12-31';
// Archive calls spanning 5 years count as ~9 "API units" against
// Open-Meteo's free-tier rate caps — go slow and serial, and merge
// with previously generated rows so reruns only fetch what's missing.
const CONCURRENCY = 1;
const DELAY_MS = 900;

interface ArchiveResponse {
  timezone?: string;
  daily?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
  };
  reason?: string;
}

interface CityClimateRow {
  slug: string;
  tz: string;
  /** Jan..Dec of [avgHighC, avgLowC, rainDays, precipMm] */
  months: [number, number, number, number][];
}

async function fetchCity(city: (typeof SEO_CITIES)[number], attempt = 1): Promise<CityClimateRow | null> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${city.coordinates.lat}&longitude=${city.coordinates.lng}` +
    `&start_date=${START}&end_date=${END}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      // Minutely/hourly quota — long sleep, then retry without
      // burning the normal attempt budget.
      if (attempt < 8) {
        console.log(`429 on ${city.slug} — sleeping ${45 * attempt}s`);
        await new Promise((r) => setTimeout(r, 45_000 * attempt));
        return fetchCity(city, attempt + 1);
      }
      throw new Error('HTTP 429 (quota exhausted)');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as ArchiveResponse;
    if (!body.daily?.time?.length || !body.timezone) throw new Error(body.reason ?? 'empty daily payload');

    // Reduce daily rows into per-month accumulators.
    const acc = Array.from({ length: 12 }, () => ({
      hiSum: 0,
      hiN: 0,
      loSum: 0,
      loN: 0,
      rainDays: 0,
      precipSum: 0,
      yearsSeen: new Set<string>(),
    }));
    const { time, temperature_2m_max: hi, temperature_2m_min: lo, precipitation_sum: pr } = body.daily;
    for (let i = 0; i < time.length; i++) {
      const m = Number(time[i].slice(5, 7)) - 1;
      acc[m].yearsSeen.add(time[i].slice(0, 4));
      if (hi[i] != null) { acc[m].hiSum += hi[i]!; acc[m].hiN++; }
      if (lo[i] != null) { acc[m].loSum += lo[i]!; acc[m].loN++; }
      if (pr[i] != null) {
        acc[m].precipSum += pr[i]!;
        if (pr[i]! >= 1) acc[m].rainDays++;
      }
    }
    const months = acc.map((a) => {
      const years = Math.max(1, a.yearsSeen.size);
      return [
        Math.round(a.hiSum / Math.max(1, a.hiN)),
        Math.round(a.loSum / Math.max(1, a.loN)),
        Math.round(a.rainDays / years),
        Math.round(a.precipSum / years),
      ] as [number, number, number, number];
    });
    return { slug: city.slug, tz: body.timezone, months };
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return fetchCity(city, attempt + 1);
    }
    console.error(`FAILED ${city.slug}: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  // Merge mode: keep rows from a previous (possibly partial) run so
  // rate-limited reruns only fetch what's still missing.
  const rows: CityClimateRow[] = [];
  try {
    const prev = await import('../src/climate-data.ts');
    for (const [slug, v] of Object.entries(prev.CITY_CLIMATE ?? {})) {
      rows.push({
        slug,
        tz: (v as { tz: string }).tz,
        months: (v as { months: [number, number, number, number][] }).months,
      });
    }
    if (rows.length > 0) console.log(`Merging ${rows.length} cities from previous run`);
  } catch {
    // First run — nothing to merge.
  }
  const have = new Set(rows.map((r) => r.slug));
  const queue = SEO_CITIES.filter((c) => !have.has(c.slug));
  console.log(`${queue.length} cities to fetch`);
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const city = queue.shift();
        if (!city) return;
        const row = await fetchCity(city);
        if (row) rows.push(row);
        done++;
        if (done % 25 === 0) console.log(`${done} fetched`);
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }),
  );

  // Preserve SEO_CITIES order for stable diffs.
  const order = new Map(SEO_CITIES.map((c, i) => [c.slug, i]));
  rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));

  const key = (slug: string) => (/^[a-z][a-z0-9]*$/.test(slug) ? slug : `'${slug}'`);
  const lines = rows.map(
    (r) =>
      `  ${key(r.slug)}: { tz: '${r.tz}', months: [${r.months
        .map((m) => `[${m.join(',')}]`)
        .join(',')}] },`,
  );

  const out = `/**
 * Monthly climate normals + IANA timezone per city. GENERATED FILE —
 * regenerate with scripts/generate-climate.mts, do not hand-edit.
 *
 * Source: ERA5 reanalysis (2020–2024 daily) via Open-Meteo archive
 * API, reduced to monthly means. Attribution: Copernicus Climate
 * Change Service (C3S) / Open-Meteo. Temperatures °C; rainDays are
 * days/month with ≥1mm precipitation; precipMm is mean monthly total.
 *
 * months[0]=January … months[11]=December, each
 * [avgHighC, avgLowC, rainDays, precipMm].
 */

export interface CityClimate {
  /** IANA timezone, e.g. 'Europe/Madrid'. */
  tz: string;
  /** Jan→Dec: [avgHighC, avgLowC, rainDays, precipMm]. */
  months: ReadonlyArray<readonly [number, number, number, number]>;
}

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const CITY_CLIMATE: Readonly<Record<string, CityClimate>> = {
${lines.join('\n')}
};

export function findClimate(citySlug: string): CityClimate | null {
  return CITY_CLIMATE[citySlug] ?? null;
}
`;

  const dest = join(dirname(fileURLToPath(import.meta.url)), '../src/climate-data.ts');
  writeFileSync(dest, out);
  console.log(`Wrote ${rows.length}/${SEO_CITIES.length} cities to ${dest}`);
}

main();
