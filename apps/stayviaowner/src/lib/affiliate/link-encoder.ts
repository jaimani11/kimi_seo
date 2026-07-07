import { isAllowedAffiliateHost } from './allowlist';

/**
 * Self-contained affiliate-link encoder.
 *
 * Rather than persist a `link → url` mapping table, we encode the
 * outbound URL + originating context as a base64url-JSON payload in
 * the `/r/[id]` segment. The route decodes, validates, records a
 * click against the existing AffiliateClick table, and 302s.
 *
 * Why self-contained:
 *
 *   - No new persistence (the click record stays in the existing B4
 *     table; the *link itself* doesn't need a row).
 *   - Stateless across deploys - copy a `/r/[id]` URL between
 *     environments and it still resolves.
 *   - Bounded length - the payload only carries url + a handful of
 *     short ids; typical encoded id is ~120 chars. We bound at 1024
 *     to keep the URL well under common 2048-char limits.
 *
 * Validation on decode is the load-bearing part: the redirect handler
 * must NEVER follow an arbitrary URL (open-redirect → phishing). We
 * re-check the host allowlist at decode time so a tampered payload
 * with a foreign URL gets rejected even if it parses.
 *
 * The base64url encoding (RFC 4648) uses URL-safe alphabet (-/_) so
 * the encoded id is path-segment-safe without further escaping.
 */

export interface AffiliateLinkPayload {
  /** Outbound URL. Must pass the allowlist on decode. */
  url: string;
  /** Provider id for click attribution + analytics. */
  providerId: string;
  /** Optional stay id for per-listing analytics. */
  stayId?: string;
  /** Optional turn id so admins can link a click back to the
   *  proposing turn in /admin/turns/[turnId]. */
  turnId?: string;
  /** Optional conversation id (rarely used; included for future
   *  multi-turn-attribution work). */
  conversationId?: string;
}

const MAX_ENCODED_LEN = 1024;
const MAX_URL_LEN = 800; // any longer is almost certainly tampering

/** Encode a payload into a URL-safe id. */
export function encodeAffiliateLink(payload: AffiliateLinkPayload): string {
  if (!payload.url || payload.url.length > MAX_URL_LEN) {
    throw new Error('affiliate link url missing or too long');
  }
  const minimal: Record<string, string> = {
    u: payload.url,
    p: payload.providerId,
  };
  if (payload.stayId) minimal.s = payload.stayId;
  if (payload.turnId) minimal.t = payload.turnId;
  if (payload.conversationId) minimal.c = payload.conversationId;
  const json = JSON.stringify(minimal);
  const encoded = toBase64Url(json);
  if (encoded.length > MAX_ENCODED_LEN) {
    throw new Error('affiliate link payload too large after encoding');
  }
  return encoded;
}

/**
 * Decode + validate an affiliate-link id. Returns null on any of:
 *   - non-base64url input
 *   - not valid JSON
 *   - missing required fields
 *   - URL fails the host allowlist (defense against tampered payloads)
 *   - id length exceeds the bound (cheap DoS-resistance)
 */
export function decodeAffiliateLink(id: string): AffiliateLinkPayload | null {
  if (!id || id.length === 0 || id.length > MAX_ENCODED_LEN) return null;
  let json: string;
  try {
    json = fromBase64Url(id);
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  const url = typeof obj.u === 'string' ? obj.u : null;
  const providerId = typeof obj.p === 'string' ? obj.p : null;
  if (!url || !providerId) return null;
  if (url.length > MAX_URL_LEN) return null;
  // Re-validate against the host allowlist - even though `encode`
  // doesn't itself enforce, a tampered id from outside our app must
  // never resolve to a foreign URL.
  if (!isAllowedAffiliateHost(url)) return null;

  const out: AffiliateLinkPayload = { url, providerId };
  if (typeof obj.s === 'string') out.stayId = obj.s;
  if (typeof obj.t === 'string') out.turnId = obj.t;
  if (typeof obj.c === 'string') out.conversationId = obj.c;
  return out;
}

// ============== base64url helpers ==============

function toBase64Url(s: string): string {
  // Server (Node) path - `Buffer` always available in our route handlers.
  // The `typeof` guard is for tree-shaking + edge runtime safety.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B = (globalThis as any).Buffer as typeof Buffer | undefined;
  if (B) return B.from(s, 'utf8').toString('base64url');
  // Browser fallback (used by tests in a jsdom env, or any future
  // edge-runtime caller).
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : '';
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function fromBase64Url(s: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B = (globalThis as any).Buffer as typeof Buffer | undefined;
  if (B) return B.from(s, 'base64url').toString('utf8');
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const b64 = padded + pad;
  return typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : '';
}
