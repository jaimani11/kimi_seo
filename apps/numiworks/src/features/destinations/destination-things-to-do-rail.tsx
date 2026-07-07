'use client';

import { useEffect, useState } from 'react';
import { ExperienceSchema, type Experience } from '@core/experience';
import { DiscoveryExperienceRail } from '@/features/discovery';

interface DestinationThingsToDoRailProps {
  destinationName: string;
}

/**
 * Live "Things to do" rail for /destinations/[slug]. Fetches Viator
 * inventory scoped to the destination on mount and renders through
 * the shared discovery-rail with the carousel layout.
 *
 * Hides itself entirely when Viator returns zero results AND
 * isn't in an error state - on a destination page, an empty
 * "Things to do" section is worse than no section. The Expedia
 * stays CTA below still carries the visitor forward.
 */
export function DestinationThingsToDoRail({ destinationName }: DestinationThingsToDoRailProps) {
  const [experiences, setExperiences] = useState<readonly Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destinationName) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      query: `things to do ${destinationName}`,
      limit: '10',
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
  }, [destinationName]);

  // No silent failure: while loading we render skeletons; if Viator
  // simply has nothing for this destination, we hide the section.
  if (!loading && !error && experiences.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-14">
      <DiscoveryExperienceRail
        section={{
          slug: `destination-${destinationName.toLowerCase().replace(/\s+/g, '-')}-things-to-do`,
          eyebrow: 'Live · Things to do',
          title: `Bookable in ${destinationName}.`,
          subtitle:
            'Live inventory matched to this destination. Tap any card to continue to the booking page; affiliate attribution is automatic.',
          layout: 'carousel',
          query: destinationName,
        }}
        experiences={experiences}
        loading={loading}
        error={error}
      />
    </section>
  );
}
