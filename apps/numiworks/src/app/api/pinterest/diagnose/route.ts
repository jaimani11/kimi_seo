import { requireAdmin } from '@lib/admin/require-admin';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import {
  describePinterestAuthMode,
  getPinterestOAuthEnv,
  refreshAccessToken,
  getManagedPinterestToken,
} from '@adored/marketing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/pinterest/diagnose  (admin-gated)
 *
 * One-shot answer to "why won't pins post?". Distinguishes the two
 * causes of a 401 on create-pin that GET-boards doesn't hit:
 *
 *   grantedScope missing pins:write  → token scope problem (re-auth)
 *   grantedScope HAS pins:write, but
 *     the raw create probe still 401s → app is Trial tier, needs
 *                                       Standard access (app review)
 *
 * Everything is read live: the granted scope comes straight from a
 * fresh token-refresh response (Pinterest echoes the scopes it minted
 * the token with), and the create probe is one real POST /pins whose
 * unabridged response body is returned.
 */
export async function GET(): Promise<Response> {
  await requirePasswordAdmin();
  await requireAdmin();

  const authMode = describePinterestAuthMode();
  const boardId = (process.env.PINTEREST_BOARD_ID ?? '').trim();

  // 1. Granted scopes — only knowable via a live refresh (OAuth mode).
  let grantedScope: string | null = null;
  let scopeError: string | null = null;
  const oauth = getPinterestOAuthEnv();
  if (oauth) {
    try {
      const grant = await refreshAccessToken(oauth);
      grantedScope = grant.scope ?? null;
    } catch (err) {
      scopeError = err instanceof Error ? err.message : String(err);
    }
  }
  const scopeHasPinsWrite = grantedScope
    ? /pins:write/i.test(grantedScope)
    : null;
  const scopeHasBoardsWrite = grantedScope
    ? /boards:write/i.test(grantedScope)
    : null;

  const token = await getManagedPinterestToken();

  // 2. Board read — confirms the token authenticates at all.
  let boardReadOk = false;
  let boardReadStatus: number | null = null;
  if (token) {
    try {
      const res = await fetch('https://api.pinterest.com/v5/boards?page_size=1', {
        headers: { authorization: `Bearer ${token}` },
      });
      boardReadStatus = res.status;
      boardReadOk = res.ok;
    } catch {
      /* leave defaults */
    }
  }

  // 3. Raw create-pin probe — a real POST /pins, full body returned.
  //    Uses a stable public image so the probe can't fail on imagery.
  let createProbe: {
    status: number | null;
    ok: boolean;
    body: string;
  } = { status: null, ok: false, body: 'not attempted' };
  if (token && boardId) {
    try {
      const res = await fetch('https://api.pinterest.com/v5/pins', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          board_id: boardId,
          title: 'Diagnostic probe',
          description: 'Connectivity probe — safe to delete.',
          media_source: {
            source_type: 'image_url',
            url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&q=80',
          },
        }),
      });
      createProbe = {
        status: res.status,
        ok: res.ok,
        body: (await res.text()).slice(0, 400),
      };
    } catch (err) {
      createProbe = {
        status: null,
        ok: false,
        body: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Verdict — the whole point.
  let verdict: string;
  if (authMode === 'none') {
    verdict = 'No Pinterest credentials configured.';
  } else if (scopeHasPinsWrite === false || scopeHasBoardsWrite === false) {
    verdict =
      'TOKEN SCOPE PROBLEM: the token was minted without write scope. Re-authorize with pins:write + boards:write (regenerate token or re-run the OAuth flow).';
  } else if (createProbe.ok) {
    verdict = 'WRITES WORK — a pin was just created. Delete the probe pin.';
  } else if (createProbe.status === 401 || createProbe.status === 403) {
    verdict =
      scopeHasPinsWrite === true
        ? 'APP ACCESS TIER: token HAS pins:write but Pinterest still rejects the write. The app is on Trial access — apply for Standard access (app review) to post to public boards.'
        : 'Write rejected. Scope could not be confirmed (static token) — most likely missing pins:write; re-authorize with write scopes.';
  } else {
    verdict = `Unexpected create-pin response (HTTP ${createProbe.status}). See body.`;
  }

  return Response.json({
    authMode,
    boardId: boardId || null,
    grantedScope,
    scopeHasPinsWrite,
    scopeHasBoardsWrite,
    ...(scopeError ? { scopeError } : {}),
    boardRead: { ok: boardReadOk, status: boardReadStatus },
    createProbe,
    verdict,
  });
}
