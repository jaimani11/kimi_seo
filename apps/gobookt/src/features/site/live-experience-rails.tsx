'use client';

import { useEffect, useState } from 'react';
import { ExperienceSchema, type Experience } from '@core/experience';
import { DiscoveryExperienceRail, type ExperienceRailSection } from '@/features/discovery';

/**
 * Four themed rails that hit /api/discovery/experiences on mount and
 * render live Viator results through the existing discovery rail
 * primitive. The rails are the editorial spine of the homepage; the
 * cards inside are live and time-of-day fresh.
 */

const SECTIONS: readonly ExperienceRailSection[] = [
  {
    slug: 'top-picks',
    eyebrow: 'Top picks today',
    title: 'Today’s standouts.',
    subtitle:
      'Highest-rated experiences our partner is filling fastest. Refreshed continuously through the day.',
    layout: 'carousel',
    query: 'top rated tour',
  },
  {
    slug: 'food-and-wine',
    eyebrow: 'Food & wine',
    title: 'Tables, tastings, kitchens.',
    subtitle:
      'Cooking classes, vineyard lunches, food walks led by people who actually cook for a living.',
    layout: 'hero-rail',
    query: 'food wine cooking class',
  },
  {
    slug: 'adventure',
    eyebrow: 'Adventure',
    title: 'Mornings that start before the city does.',
    subtitle:
      'Balloons at dawn, glacier hikes, snorkels off boats. Small groups, instant confirmation.',
    layout: 'grid',
    query: 'sunrise outdoor adventure',
  },
  {
    slug: 'culture',
    eyebrow: 'Culture & history',
    title: 'Three hours with the right guide.',
    subtitle:
      'Skip-the-line entries, private tours, neighborhood walks with people who grew up there.',
    layout: 'carousel',
    query: 'walking tour history culture',
  },
];

export function LiveExperienceRails() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-20 md:gap-24 md:py-24">
      {SECTIONS.map((section) => (
        <SingleRail key={section.slug} section={section} />
      ))}
    </div>
  );
}

function SingleRail({ section }: { section: ExperienceRailSection }) {
  const [experiences, setExperiences] = useState<readonly Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ query: section.query, limit: '12' });
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
  }, [section.query]);

  return (
    <DiscoveryExperienceRail
      section={section}
      experiences={experiences}
      loading={loading}
      error={error}
    />
  );
}
