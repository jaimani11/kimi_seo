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

export interface PinterestApiError {
  status: number;
  /** Pinterest's error code, when their JSON body carries one. */
  code?: number;
  /** Human-readable message — Pinterest's, ours, or the raw body. */
  message: string;
  /** True when the request looks like a scope issue (insufficient
   *  permissions) rather than a malformed-request or auth failure.
   *  Lets the admin UI show "waiting for pins:write scope" specifically. */
  isInsufficientScope: boolean;
}

export class PinterestClient {
  readonly #token: string;
  constructor(token: string) {
    this.#token = token;
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
    return fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.#token}`,
        accept: 'application/json',
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

  async #errorFrom(res: Response): Promise<PinterestApiError> {
    let payload: { code?: number; message?: string } = {};
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      // Body wasn't JSON — keep going with status info only.
    }
    const message = payload.message ?? `HTTP ${res.status} ${res.statusText}`;
    const code = payload.code;
    // Pinterest's "insufficient scope" surfaces variably: 401 + code 7
    // or 403 with a message that includes "scope". Catch both.
    const isInsufficientScope =
      (res.status === 401 || res.status === 403) &&
      (code === 7 || /scope/i.test(message));
    return {
      status: res.status,
      ...(code !== undefined ? { code } : {}),
      message,
      isInsufficientScope,
    };
  }
}

/**
 * Construct a Pinterest client from env. Returns null when the
 * token isn't configured so callers can fall back to stub mode.
 */
export function pinterestClientFromEnv(): PinterestClient | null {
  const token = (process.env.PINTEREST_ACCESS_TOKEN ?? '').trim();
  if (!token) return null;
  return new PinterestClient(token);
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
    return {
      state: 'token-invalid',
      message:
        e.status === 401
          ? 'Token rejected (HTTP 401). Regenerate it in your Pinterest dashboard and update PINTEREST_ACCESS_TOKEN.'
          : e.message ?? 'Unknown error reaching Pinterest API.',
    };
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
