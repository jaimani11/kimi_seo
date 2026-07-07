'use client';

import { useEffect, useState } from 'react';
import type { Experience } from '@core/experience';
import { ExperienceSchema } from '@core/experience';
import {
  DiscoveryExperienceRail,
  type ExperienceRailSection,
} from '@/features/discovery';

interface LiveExperiencesRailProps {
  section: ExperienceRailSection;
}

interface ExperiencesResponseBody {
  experiences?: unknown;
  error?: string;
}

/**
 * Client wrapper around `DiscoveryExperienceRail` that fetches live
 * inventory from `/api/discovery/experiences` on mount.
 *
 * Why client-fetch instead of server-render: a single section's worth
 * of latency would extend the time-to-first-paint by Viator's
 * round-trip (~600-900ms). The hero + curated rails should render
 * instantly while the live rail fills in below. Loading skeletons
 * keep the layout stable.
 *
 * On 503 (no API key configured), we render the rail's empty state
 * silently - the homepage still works, the live rail just isn't
 * surfaced. On 5xx upstream errors, we show the gentle error state.
 */
export function LiveExperiencesRail({ section }: LiveExperiencesRailProps) {
  const [experiences, setExperiences] = useState<readonly Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial render has loading=true + error=null from useState; we
    // don't reset them synchronously here because eslint
    // `react-hooks/set-state-in-effect` (rightly) flags that as
    // cascading state. section.query is hard-coded per section so the
    // dependency array only fires once - no in-flight re-fetch case to
    // worry about.
    const controller = new AbortController();

    const params = new URLSearchParams({ query: section.query, limit: '12' });
    fetch(`/api/discovery/experiences?${params.toString()}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as ExperiencesResponseBody | null;
        if (res.status === 503) {
          // Provider not configured. Treat as empty rather than error
          // so the empty-state copy reads sensibly to the visitor.
          setExperiences([]);
          return;
        }
        if (!res.ok) {
          setError(body?.error ?? `HTTP ${res.status}`);
          return;
        }
        const rawList = Array.isArray(body?.experiences) ? body.experiences : [];
        const parsed: Experience[] = [];
        for (const item of rawList) {
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
