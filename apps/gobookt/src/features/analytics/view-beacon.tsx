'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/client';

/**
 * Fires a single `track()` call on mount, used to instrument server-
 * rendered pages (e.g. /experiences/[productCode] and /search) that
 * have no client component of their own.
 *
 * The fire-once guard (useRef) protects against React Strict Mode's
 * double-mount in development and against an effect re-run if the
 * parent renders multiple times.
 */
export function ViewBeacon({
  event,
  refValue,
  metadata,
}: {
  event: string;
  refValue?: string;
  /** Optional structured snapshot persisted alongside the event.
   *  Used by /experiences/[code] to remember title/image/price so the
   *  "Pick up where you left off" rail can render without a second
   *  fetch to Viator. */
  metadata?: Record<string, string | number | boolean | undefined>;
}) {
  const fired = useRef(false);
  // JSON-serialize metadata into the effect's dep array so a parent
  // re-render with a fresh-object-same-content metadata prop doesn't
  // re-trip the effect. The fire-once guard above already covers it,
  // but this keeps lint quiet and intent obvious.
  const metadataKey = metadata ? JSON.stringify(metadata) : '';
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const props: Record<string, string | number | boolean> = {};
    if (refValue) props.ref = refValue;
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        if (v === undefined) continue;
        props[k] = v;
      }
    }
    track(event, Object.keys(props).length > 0 ? props : undefined);
  }, [event, refValue, metadataKey, metadata]);
  return null;
}
