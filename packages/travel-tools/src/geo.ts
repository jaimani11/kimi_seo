/**
 * Geodesic helpers — walking-distance callouts on destination pages.
 *
 * Great-circle distance is a slight underestimate of street distance;
 * WALK_SPEED bakes in a 1.25× street-grid correction so "12 min walk"
 * reads honest rather than optimistic.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
/** Effective walking speed over great-circle km (4.8 km/h ÷ 1.25 grid factor). */
const EFFECTIVE_WALK_KMH = 3.84;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Whole minutes to walk `km`, minimum 1. */
export function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km / EFFECTIVE_WALK_KMH) * 60));
}

/**
 * Human phrasing for "how far from the center" — walking time when
 * walkable, distance when not. Beyond ~35 walking minutes nobody
 * walks; saying "7.2 km from center" is the honest framing.
 */
export function distanceLabel(km: number): string {
  const mins = walkMinutes(km);
  if (mins <= 35) return `${mins} min walk from center`;
  if (km < 10) return `${km.toFixed(1)} km from center`;
  return `${Math.round(km)} km from center`;
}
