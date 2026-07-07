/**
 * Resolve the canonical origin (scheme + host) for the live site.
 *
 *   - `NEXT_PUBLIC_SITE_URL` wins when set (set to `https://gobookt.com`
 *     in production).
 *   - `VERCEL_URL` is the deploy-specific fallback Vercel sets on every
 *     deployment (preview + production). Always over https.
 *   - Localhost dev fallback last.
 *
 * No trailing slash. Pair with path strings via `${origin}/path`.
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.length > 0) return stripTrailing(explicit);
  const vercel = process.env.VERCEL_URL;
  if (vercel && vercel.length > 0) return `https://${vercel}`;
  return 'http://localhost:3000';
}

function stripTrailing(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

/** Build a canonical absolute URL for a path on this site. */
export function canonicalUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}
