/**
 * Pinterest v5 REST API client.
 *
 * Thin, focused wrapper. Two operations:
 *
 *   - listBoards() — GET /v5/boards   (needs `boards:read` scope)
 *   - createPin()  — POST /v5/pins    (needs `pins:write` scope)
 *
 * The trial token Pinterest hands out before app review is granted
 * has read-only scopes only. listBoards() works during trial;
 * createPin() returns 401 ("insufficient scope") until Pinterest
 * completes their review and you mint a token with `pins:write`.
 *
 * The functions distinguish these cases so callers can render an
 * accurate status ("token works · waiting for write scope" vs
 * "token invalid").
 */

import {
  getManagedPinterestToken,
  describePinterestAuthMode,
} from './pinterest-oauth';

const API_BASE = 'https://api.pinterest.com/v5';

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  pinCount: number;
  privacy?: string;
}

export interface PinterestCreatePinInput {
  boardId: string;
  title: string;
  description: string;
  altText: string;
  link: string;
  imageUrl: string;
}

/**
 * A real Error subclass — NOT a plain object. It was previously an
 * interface, so `throw errorObject` produced something where
 * `err instanceof Error` was false and `String(err)` was the useless
 * "[object Object]". The scheduler serialized exactly that into the
 * failed-post record, hiding every real Pinterest message. Extending
 * Error means `err.message` and `instanceof` both work while the extra
 * fields (status/code/isInsufficientScope) ride along.
 */
export class PinterestApiError extends Error {
  readonly status: number;
  /** Pinterest's error code, when their JSON body carries one. */
  readonly code?: number;
  /** True when the request looks like a scope issue (insufficient
   *  permissions) rather than a malformed-request or auth failure.
   *  Lets the admin UI show "waiting for pins:write scope" specifically. */
  readonly isInsufficientScope: boolean;

  constructor(args: {
    status: number;
    code?: number;
    message: string;
    isInsufficientScope: boolean;
  }) {
    super(args.message);
    this.name = 'PinterestApiError';
    this.status = args.status;
    if (args.code !== undefined) this.code = args.code;
    this.isInsufficientScope = args.isInsufficientScope;
  }
}

export class PinterestClient {
  readonly #tokenProvider: () => Promise<string>;
  constructor(tokenOrProvider: string | (() => Promise<string>)) {
    this.#tokenProvider =
      typeof tokenOrProvider === 'string'
        ? async () => tokenOrProvider
        : tokenOrProvider;
  }

  async listBoards(args: { pageSize?: number } = {}): Promise<PinterestBoard[]> {
    const params = new URLSearchParams();
    params.set('page_size', String(args.pageSize ?? 25));
    const res = await this.#request('GET', `/boards?${params.toString()}`);
    if (!res.ok) {
      throw await this.#errorFrom(res);
    }
    const body = (await res.json()) as {
      items?: Array<{
        id: string;
        name: string;
        description?: string;
        pin_count?: number;
        privacy?: string;
      }>;
    };
    const items = body.items ?? [];
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      pinCount: item.pin_count ?? 0,
      privacy: item.privacy,
    }));
  }

  /** Newest-first pins on a board — used by the catch-up cron to
   *  decide whether today's batch already posted. */
  async listBoardPins(
    boardId: string,
    args: { pageSize?: number } = {},
  ): Promise<Array<{ id: string; createdAt: string }>> {
    const params = new URLSearchParams();
    params.set('page_size', String(args.pageSize ?? 5));
    const res = await this.#request('GET', `/boards/${boardId}/pins?${params.toString()}`);
    if (!res.ok) throw await this.#errorFrom(res);
    const body = (await res.json()) as {
      items?: Array<{ id: string; created_at?: string }>;
    };
    return (body.items ?? []).map((p) => ({
      id: p.id,
      createdAt: p.created_at ?? '',
    }));
  }

  async createPin(input: PinterestCreatePinInput): Promise<{ pinId: string; url: string }> {
    const body = {
      board_id: input.boardId,
      title: input.title.slice(0, 100),
      description: input.description.slice(0, 500),
      alt_text: input.altText.slice(0, 500),
      link: input.link,
      media_source: {
        source_type: 'image_url' as const,
        url: input.imageUrl,
      },
    };
    const res = await this.#request('POST', '/pins', body);
    if (!res.ok) {
      throw await this.#errorFrom(res);
    }
    const json = (await res.json()) as { id: string };
    return {
      pinId: json.id,
      url: `https://www.pinterest.com/pin/${json.id}/`,
    };
  }

  async #request(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const token = await this.#tokenProvider();
    return fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json',
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  async #errorFrom(res: Response): Promise<PinterestApiError> {
    let payload: { code?: number; message?: string } = {};
    let rawBody = '';
    try {
      rawBody = await res.text();
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      // Body wasn't JSON — fall back to status + any raw text we got.
    }
    const message =
      payload.message ??
      (rawBody.trim().length > 0
        ? `HTTP ${res.status}: ${rawBody.slice(0, 200)}`
        : `HTTP ${res.status} ${res.statusText}`);
    const code = payload.code;
    // Pinterest's "insufficient scope" surfaces variably: 401 + code 7
    // or 403 with a message that includes "scope". Catch both.
    const isInsufficientScope =
      (res.status === 401 || res.status === 403) &&
      (code === 7 || /scope/i.test(message));
    return new PinterestApiError({
      status: res.status,
      ...(code !== undefined ? { code } : {}),
      message,
      isInsufficientScope,
    });
  }
}

/**
 * Construct a Pinterest client from env. Returns null when the
 * token isn't configured so callers can fall back to stub mode.
 */
export function pinterestClientFromEnv(): PinterestClient | null {
  if (describePinterestAuthMode() === 'none') return null;
  return new PinterestClient(async () => {
    const token = await getManagedPinterestToken();
    if (!token) throw new Error('Pinterest token unavailable (refresh failed and no static token)');
    return token;
  });
}

/**
 * High-level "what's the Pinterest connection look like right now?"
 * check. Surfaced to the admin UI so the operator can see whether the
 * token works, whether write scope has been granted, and how many
 * boards Pinterest sees on the account.
 */
export type PinterestStatus =
  | { state: 'no-token' }
  | { state: 'token-invalid'; message: string }
  | {
      state: 'connected-readonly';
      boards: PinterestBoard[];
      note: string;
    }
  | {
      state: 'connected-full';
      boards: PinterestBoard[];
    };

export async function checkPinterestStatus(): Promise<PinterestStatus> {
  const client = pinterestClientFromEnv();
  if (!client) return { state: 'no-token' };
  let boards: PinterestBoard[];
  try {
    boards = await client.listBoards();
  } catch (err) {
    const e = err as PinterestApiError;
    // Make a 401 self-diagnosing. The failure mode depends on which auth
    // mode is actually active — the old "update PINTEREST_ACCESS_TOKEN"
    // advice was wrong whenever the OAuth refresh trio was intended but
    // incomplete (the common footgun: token added to the wrong project or
    // not redeployed, so it silently falls back to the expired static token).
    const mode = describePinterestAuthMode();
    let message: string;
    if (e.status === 401) {
      message =
        mode === 'oauth-refresh'
          ? 'Token rejected (HTTP 401) in OAuth-refresh mode — the refresh token is invalid or expired. Re-run /api/pinterest/oauth/start to mint a fresh PINTEREST_REFRESH_TOKEN, update it in Vercel, and redeploy.'
          : `Token rejected (HTTP 401). Auth mode is "${mode}" — the OAuth refresh trio (PINTEREST_APP_ID + PINTEREST_APP_SECRET + PINTEREST_REFRESH_TOKEN) is NOT all set on THIS project, so it fell back to the expired static token. Add all three to this Vercel project's Production env and redeploy.`;
    } else {
      message = e.message ?? 'Unknown error reaching Pinterest API.';
    }
    return { state: 'token-invalid', message };
  }
  // Token works for reads. v1 doesn't have a cheap "do I have
  // pins:write?" probe — Pinterest doesn't expose a scopes endpoint
  // for user tokens. We assume trial-readonly by default. The
  // scheduler's first attempted post will surface either success
  // (full scope granted) or `insufficient_scope` (still trial),
  // and we can promote the status from there. For v1 we just say
  // "connected (read-only assumed during trial)" — the admin can
  // hit "Run Pinterest now" to verify.
  return {
    state: 'connected-readonly',
    boards,
    note: 'Token works for reads. Posting requires the pins:write scope, which Pinterest grants after full app review.',
  };
}

/**
 * Has anything been pinned to the board on this UTC day?
 *
 * Used by the catch-up cron: the board itself is the durable record
 * of whether today's batch ran (the marketing store is in-memory on
 * serverless). Returns:
 *   true  — at least one pin created today (batch ran; skip)
 *   false — newest pin is older than today (batch missed; run)
 *   null  — cannot determine (no client / API error); callers should
 *           SKIP on null to avoid double-posting on flaky reads.
 */
export async function pinterestPostedToday(
  boardId: string,
  now: Date = new Date(),
): Promise<boolean | null> {
  const client = pinterestClientFromEnv();
  if (!client || !boardId) return null;
  try {
    const pins = await client.listBoardPins(boardId, { pageSize: 5 });
    if (pins.length === 0) return false;
    const today = now.toISOString().slice(0, 10);
    return pins.some((p) => (p.createdAt ?? '').slice(0, 10) === today);
  } catch {
    return null;
  }
}
