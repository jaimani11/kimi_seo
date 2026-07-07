'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspaceStore } from './store/workspace-store';

/**
 * Effect-only component that consumes URL state and applies it to the
 * workspace store on first mount, then strips it from the URL so back
 * navigation doesn't re-apply.
 *
 *   - `?prompt=<text>` → seeds inputDraft (used by share /t/[slug]'s
 *      "Try this prompt myself" CTA).
 *   - `#saved` → opens the saved-trips panel (used after a recipient
 *      clicks "Save to my StayScout" on a shared trip).
 */
export function UrlInit() {
  const router = useRouter();
  const params = useSearchParams();
  const setInputDraft = useWorkspaceStore((s) => s.setInputDraft);
  const openSavedPanel = useWorkspaceStore((s) => s.openSavedPanel);

  useEffect(() => {
    const prompt = params.get('prompt');
    const hash = typeof window !== 'undefined' ? window.location.hash : '';

    let dirtied = false;
    if (prompt) {
      setInputDraft(prompt);
      dirtied = true;
    }
    if (hash === '#saved') {
      openSavedPanel();
      dirtied = true;
    }

    if (dirtied) {
      // Strip query + hash so refreshing or going back doesn't re-apply.
      router.replace('/');
    }
    // Run once on mount only - params/router are stable enough that we
    // don't want to re-apply when they change (e.g. user typing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
