import { isAllowedAffiliateHost } from './allowlist';
import { CRUISE_CREATIVES, type CruiseCreativeSlug } from './cruisedirect-creatives';

/**
 * CruiseDirect (CJ) resolver — site-isolated, fail-safe.
 *
 * The site PID is read ONLY from `CRUISEDIRECT_EVERGREEN_URL`, so each Vercel
 * project's own env determines its publisher id (GoTript 101803920 /
 * Numiworks 101827399). There is no PID in code, so a build cannot emit
 * another site's link. Cruise CTAs are added to GoTript + Numiworks only —
 * never GoBookt or StayViaOwner.
 */

/** CJ redirect domains CruiseDirect links use (all already on the allowlist). */
const CJ_DOMAINS = ['anrdoezrs.net', 'dpbolvw.net', 'tkqlhce.com', 'jdoqocy.com', 'kqzyfj.com'] as const;

/** The GoBookt CJ publisher id — must NEVER appear on a cruise link. */
const GOBOOKT_PID = '101803878';

function env(name: string): string | null {
  const v = (process.env[name] ?? '').trim();
  return v.length > 0 ? v : null;
}

/** Is CruiseDirect surfaced on this deployment? (per-site CRUISEDIRECT_ENABLED) */
export function cruiseDirectEnabled(): boolean {
  return env('CRUISEDIRECT_ENABLED') === 'true';
}

/**
 * The site's CJ publisher id, derived from `CRUISEDIRECT_EVERGREEN_URL`
 * (`click-<PID>-<id>`). The single source of the PID → structural site
 * isolation. Returns null (→ disabled) when unset, unparseable, or — as a
 * hard safety net — the GoBookt PID.
 */
export function cruiseDirectPid(): string | null {
  const url = env('CRUISEDIRECT_EVERGREEN_URL');
  if (!url) return null;
  const pid = url.match(/click-(\d+)-\d+/)?.[1] ?? null;
  if (!pid || pid === GOBOOKT_PID) return null;
  return pid;
}

/**
 * Resolve a site-isolated CruiseDirect CJ click URL for a creative, or null
 * when disabled / unconfigured (fail safe — the CTA hides; we never emit a
 * bare untracked cruisedirect.com URL). Evergreen returns the exact env URL
 * (authoritative); every other creative is built as
 * `https://www.<cjDomain>/click-<sitePID>-<creativeId>`. Both paths are
 * re-checked against the affiliate host allowlist (open-redirect guard).
 */
export function resolveCruiseDirectUrl(slug: CruiseCreativeSlug): string | null {
  if (!cruiseDirectEnabled()) return null;
  const pid = cruiseDirectPid();
  if (!pid) return null;

  if (slug === 'evergreen') {
    const evergreen = env('CRUISEDIRECT_EVERGREEN_URL');
    return evergreen && isAllowedAffiliateHost(evergreen) ? evergreen : null;
  }

  const creative = CRUISE_CREATIVES[slug];
  if (!creative) return null;
  const url = `https://www.${creative.cjDomain}/click-${pid}-${creative.creativeId}`;
  return isAllowedAffiliateHost(url) ? url : null;
}

/**
 * Structured descriptor for logging a cruise click — PID, creative id, CJ
 * domain. Never throws.
 */
export function describeCruiseDirectUrl(url: string): {
  pid: string | null;
  creativeId: string | null;
  cjDomain: string | null;
} {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const cjDomain = CJ_DOMAINS.find((d) => host === d || host.endsWith(`.${d}`)) ?? null;
    const m = u.pathname.match(/click-(\d+)-(\d+)/);
    return { pid: m?.[1] ?? null, creativeId: m?.[2] ?? null, cjDomain };
  } catch {
    return { pid: null, creativeId: null, cjDomain: null };
  }
}
