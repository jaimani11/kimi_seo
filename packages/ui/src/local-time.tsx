'use client';

import { useEffect, useState } from 'react';
import { sunTimesForDate, localDateParts, formatInTz } from '@adored/travel-tools';

/**
 * "Right now in {city}" strip — live local clock plus today's
 * sunrise/sunset, all computed client-side (Intl + NOAA solar math,
 * no API). Server-renders placeholders so there is never a hydration
 * mismatch; values appear on mount and tick every 30s.
 */
export function LocalTimeStrip({
  cityName,
  tz,
  lat,
  lng,
}: {
  cityName: string;
  /** IANA timezone, e.g. 'Asia/Tokyo'. */
  tz: string;
  lat: number;
  lng: number;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  let time = '—:—';
  let sunrise = '—:—';
  let sunset = '—:—';
  if (now) {
    try {
      time = formatInTz(now.getTime(), tz);
      const sun = sunTimesForDate({ ...localDateParts(tz, now), lat, lng });
      if (sun) {
        sunrise = formatInTz(sun.sunriseUtcMs, tz);
        sunset = formatInTz(sun.sunsetUtcMs, tz);
      }
    } catch {
      // Unknown tz on an old browser — leave placeholders.
    }
  }

  return (
    <p
      suppressHydrationWarning
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem 1.4rem',
        fontFamily: 'var(--font-inter)',
        fontSize: '0.8rem',
        color: 'var(--ink-tertiary)',
        margin: '0 0 1rem',
      }}
    >
      <Chip label={`Now in ${cityName}`} value={time} />
      <Chip label="Sunrise" value={sunrise} />
      <Chip label="Sunset" value={sunset} />
    </p>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span suppressHydrationWarning style={{ whiteSpace: 'nowrap' }}>
      <span
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '0.62rem',
          fontWeight: 700,
          marginRight: '0.45rem',
        }}
      >
        {label}
      </span>
      <span
        suppressHydrationWarning
        style={{ fontWeight: 700, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </span>
  );
}
