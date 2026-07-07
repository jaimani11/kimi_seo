/**
 * Sunrise/sunset — NOAA solar-position approximation, pure math.
 *
 * Accurate to ±2 minutes for latitudes below the polar circles, which
 * covers every city in SEO_CITIES. No API, no dependency; runs the
 * same on the server and in the browser (the LocalTimeStrip widget
 * computes these client-side for "today" in the city's timezone).
 */

export interface SunTimes {
  /** UTC epoch ms. */
  sunriseUtcMs: number;
  /** UTC epoch ms. */
  sunsetUtcMs: number;
}

const RAD = Math.PI / 180;

/**
 * Sun times for the calendar date `year-month-day` (the CITY's local
 * date — resolve it via its IANA zone before calling) at lat/lng.
 * Returns null during polar day/night when no rise/set occurs.
 */
export function sunTimesForDate(args: {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  lat: number;
  lng: number;
}): SunTimes | null {
  const { year, month, day, lat, lng } = args;
  const dayOfYear = Math.floor(
    (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000,
  );

  // Fractional year (radians), evaluated at solar noon.
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + 0.5);

  // Equation of time (minutes) and solar declination (radians).
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Hour angle at official sunrise/sunset (zenith 90.833° — refraction
  // + solar disc radius).
  const latRad = lat * RAD;
  const cosHa =
    Math.cos(90.833 * RAD) / (Math.cos(latRad) * Math.cos(decl)) -
    Math.tan(latRad) * Math.tan(decl);
  if (cosHa < -1 || cosHa > 1) return null; // polar day or night
  const haDeg = Math.acos(cosHa) / RAD;

  const midnightUtcMs = Date.UTC(year, month - 1, day);
  const sunriseMinutes = 720 - 4 * (lng + haDeg) - eqTime;
  const sunsetMinutes = 720 - 4 * (lng - haDeg) - eqTime;
  return {
    sunriseUtcMs: midnightUtcMs + sunriseMinutes * 60_000,
    sunsetUtcMs: midnightUtcMs + sunsetMinutes * 60_000,
  };
}

/**
 * Today's local date parts in an IANA timezone — feed straight into
 * sunTimesForDate so "today" means the city's today, not UTC's.
 */
export function localDateParts(
  tz: string,
  now: Date = new Date(),
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** "07:42" style formatting of a UTC instant in an IANA timezone. */
export function formatInTz(utcMs: number, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcMs));
}
