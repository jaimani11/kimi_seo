'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExperienceSchema, type Experience } from '@core/experience';
import { DiscoveryExperienceRail } from '@/features/discovery';

interface ThingsToDoRailProps {
  /** Free-text destination name from the resolved intent ("Tokyo",
   *  "Cinque Terre", "Maldives"). Drives the Viator search term. */
  destination: string;
  /** Vibe tags lifted from the resolved intent ("luxury", "walkable",
   *  "wellness", ...). Up to two are folded into the Viator query so
   *  the rail reflects what the user actually asked for, not just
   *  the destination. Empty array → generic "things to do" search. */
  vibeTags?: readonly string[];
}

/**
 * Live "Things to do" rail rendered below the partner cards on the
 * SearchOpportunityBoard. Hits /api/discovery/experiences with the
 * resolved destination + a small slice of the user's vibe tags so
 * the canvas shows real bookable activities tuned to the actual
 * prompt, not just the city name.
 *
 * Mirrors LiveExperiencesRail on the landing page but scoped to a
 * single destination (the homepage uses themed editorial searches).
 *
 * Empty + error states degrade gracefully so a Viator outage never
 * blocks the user from clicking through to the stay partners above.
 */
export function ThingsToDoRail({ destination, vibeTags = [] }: ThingsToDoRailProps) {
  const [experiences, setExperiences] = useState<readonly Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build the Viator query term: up to two vibe tags +
  // "things to do {destination}". Memoize against a string key
  // (the join) so identity churn on the vibeTags array doesn't
  // re-fire the effect; lint-friendly version where the dep
  // array is a simple identifier.
  const vibeKey = vibeTags.join('|');
  const query = useMemo(
    () => buildVibeAwareQuery(destination, vibeTags),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [destination, vibeKey],
  );

  useEffect(() => {
    if (!destination) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      query,
      limit: '8',
    });
    fetch(`/api/discovery/experiences?${params.toString()}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | { experiences?: unknown; error?: string }
          | null;
        if (res.status === 503) {
          setExperiences([]);
          return;
        }
        if (!res.ok) {
          setError(body?.error ?? `HTTP ${res.status}`);
          return;
        }
        const raw = Array.isArray(body?.experiences) ? body.experiences : [];
        const parsed: Experience[] = [];
        for (const item of raw) {
          const result = ExperienceSchema.safeParse(item);
          if (result.success) parsed.push(result.data);
        }
        setExperiences(parsed);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'unknown error');
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, [destination, query]);

  // Suppress the entire section when Viator isn't configured AND we
  // also haven't received an error. The partner cards above are
  // enough to satisfy the user's request; an empty "Things to do"
  // shouldn't visually compete with them.
  if (!loading && !error && experiences.length === 0) return null;

  return (
    <div className="mt-6">
      <DiscoveryExperienceRail
        section={{
          slug: `opportunity-things-to-do-${destination.toLowerCase().replace(/\s+/g, '-')}`,
          eyebrow: 'Live · Things to do',
          title: `Bookable in ${destination} right now.`,
          subtitle: buildSubtitle(vibeTags),
          layout: 'carousel',
          query,
        }}
        experiences={experiences}
        loading={loading}
        error={error}
      />
    </div>
  );
}

/**
 * Translate a free-text destination + the user's vibe tags into a
 * Viator search term. Up to two vibes are appended; rare/obscure
 * tags are mapped to language Viator's relevance ranker indexes well
 * on (e.g. "culinary" → "food", "walkable" → "walking tour").
 *
 * Keep this conservative - too many vibes dilute the search; the
 * first two carry the most signal from how users phrase prompts.
 */
function buildVibeAwareQuery(destination: string, vibeTags: readonly string[]): string {
  const slice = vibeTags.slice(0, 2);
  const translated = slice.map(translateVibeForViator).filter((v) => v.length > 0);
  if (translated.length === 0) return `things to do ${destination}`;
  return `${translated.join(' ')} things to do ${destination}`;
}

function translateVibeForViator(vibe: string): string {
  const lower = vibe.toLowerCase();
  // Map our internal vibe vocabulary to terms Viator's search indexes
  // on more reliably. Unknown vibes pass through unchanged - Viator's
  // freetext can still match plenty of long-tail words.
  const map: Readonly<Record<string, string>> = {
    walkable: 'walking tour',
    culinary: 'food and wine',
    wellness: 'spa retreat',
    luxury: 'private luxury',
    adventure: 'outdoor adventure',
    'family-friendly': 'family',
    romantic: 'romantic private',
    'mid-range': '',
    'budget-conscious': '',
  };
  if (lower in map) return map[lower] ?? '';
  return lower;
}

function buildSubtitle(vibeTags: readonly string[]): string {
  // Brand-neutral subtitle copy. The partner identity is intentionally
  // unnamed on the surface; routing + affiliate tracking happen behind
  // the /r/[id] redirect. Flip `NEXT_PUBLIC_STAYSCOUT_BRANDING_MODE`
  // to 'explicit' if/when we want to surface the partner name again.
  if (vibeTags.length === 0) {
    return 'Live inventory matched to your destination. Tap any card to continue to the booking page; the link carries the partner id automatically.';
  }
  const labelled = vibeTags.slice(0, 2).join(', ');
  return `Live inventory tuned to your ${labelled} cue. Tap any card to continue to the booking page; the link carries the partner id automatically.`;
}
