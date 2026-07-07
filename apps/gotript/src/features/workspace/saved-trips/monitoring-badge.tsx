'use client';

import type { MonitoringEvent, MonitoringEventKind } from '@lib/monitoring';

/**
 * Compact chip rendered on a saved-trip row when monitoring has
 * unacknowledged events. Color-coded by kind:
 *
 *   - price-drop   → accent (positive - the user's getting a deal)
 *   - price-rise / unavailable → warning (call to action / urgency)
 *   - better-match / new-alternative → neutral subtle highlight
 *
 * Single-event UX (the runner caps at 1 event per check); when there
 * are multiple unacked events on one trip, we render the most recent.
 */

interface MonitoringBadgeProps {
  events: MonitoringEvent[];
}

const STYLES: Record<MonitoringEventKind, { bg: string; fg: string; border: string }> = {
  'price-drop': {
    bg: 'rgba(86, 195, 156, 0.18)',
    fg: 'rgb(72, 220, 165)',
    border: 'rgba(86, 195, 156, 0.4)',
  },
  'price-rise': {
    bg: 'rgba(231, 138, 96, 0.18)',
    fg: 'rgb(255, 158, 110)',
    border: 'rgba(231, 138, 96, 0.4)',
  },
  unavailable: {
    bg: 'rgba(231, 138, 96, 0.18)',
    fg: 'rgb(255, 158, 110)',
    border: 'rgba(231, 138, 96, 0.4)',
  },
  'better-match': {
    bg: 'var(--surface-overlay)',
    fg: 'var(--ink-primary)',
    border: 'var(--border-emphasis)',
  },
  'new-alternative': {
    bg: 'var(--surface-overlay)',
    fg: 'var(--ink-primary)',
    border: 'var(--border-emphasis)',
  },
};

export function MonitoringBadge({ events }: MonitoringBadgeProps) {
  if (events.length === 0) return null;
  // Most recent unacked event surfaces. Events array is append-order;
  // last is newest.
  const event = events[events.length - 1]!;
  const palette = STYLES[event.kind];
  const label = formatLabel(event);

  return (
    <span
      role="status"
      aria-label={event.message}
      title={event.message}
      className="inline-flex items-center rounded-full border px-2 py-0.5"
      style={{
        background: palette.bg,
        borderColor: palette.border,
        color: palette.fg,
        fontFamily: 'var(--font-inter)',
        fontSize: '0.625rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
  );
}

function formatLabel(event: MonitoringEvent): string {
  switch (event.kind) {
    case 'price-drop':
      return event.delta !== undefined
        ? `↓ ${Math.round(Math.abs(event.delta) * 100)}%`
        : '↓ price';
    case 'price-rise':
      return event.delta !== undefined ? `↑ ${Math.round(event.delta * 100)}%` : '↑ price';
    case 'unavailable':
      return 'Unavailable';
    case 'better-match':
      return 'New top match';
    case 'new-alternative':
      return 'New alternative';
  }
}
