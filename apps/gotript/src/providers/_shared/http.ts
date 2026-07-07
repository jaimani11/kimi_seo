import { ProviderError, ProviderTimeoutError } from './errors';

interface HttpJsonOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  signal: AbortSignal;
  /** Per-request timeout in ms. Default 8s. */
  timeoutMs?: number;
  /** Retry once on 5xx + transient network errors. Default true. */
  retry?: boolean;
  /** Provider id for error attribution. */
  providerId: string;
}

/**
 * Provider-friendly fetch wrapper.
 *
 *   - Combines the caller's AbortSignal with an internal timeout signal
 *     so the request bails fast on either condition.
 *   - Retries once on 5xx + transient network errors; never retries on
 *     4xx (those are permanent - caller's bug or auth issue).
 *   - Throws ProviderError subclasses so the orchestrator's
 *     degradation policy classifies failures correctly.
 *   - Returns `null` on 404 (deliberate: "no result" not "broken").
 */
export async function httpJson<T>(url: string, opts: HttpJsonOptions): Promise<T | null> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const retry = opts.retry !== false;

  for (let attempt = 0; attempt <= (retry ? 1 : 0); attempt += 1) {
    const controller = new AbortController();
    const onParentAbort = () => controller.abort(opts.signal.reason);
    if (opts.signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    opts.signal.addEventListener('abort', onParentAbort);
    const timeoutHandle = setTimeout(() => {
      controller.abort(
        new ProviderTimeoutError(`request to ${maskUrl(url)} timed out`, opts.providerId),
      );
    }, timeoutMs);

    try {
      const init: RequestInit = {
        method: opts.method ?? 'GET',
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          ...(opts.headers ?? {}),
        },
      };
      if (opts.body !== undefined) {
        init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
        init.headers = { ...init.headers, 'content-type': 'application/json' };
      }
      const res = await fetch(url, init);
      if (res.status === 404) return null;
      if (res.status >= 500 && attempt < 1 && retry) {
        continue;
      }
      if (!res.ok) {
        throw new ProviderError(`HTTP ${res.status} from ${maskUrl(url)}`, opts.providerId);
      }
      return (await res.json()) as T;
    } catch (err) {
      // AbortError: parent cancellation OR our timeout.
      if (err instanceof DOMException && err.name === 'AbortError') {
        const reason = controller.signal.reason;
        if (reason instanceof ProviderTimeoutError) throw reason;
        throw err;
      }
      // Network error → retry once.
      if (attempt < 1 && retry) continue;
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `${err instanceof Error ? err.message : String(err)}`,
        opts.providerId,
      );
    } finally {
      clearTimeout(timeoutHandle);
      opts.signal.removeEventListener('abort', onParentAbort);
    }
  }
  // Unreachable but keeps tsc happy without a definite assignment.
  return null;
}

function maskUrl(url: string): string {
  // Strip query string from logs - affiliate ids + api keys live there.
  const idx = url.indexOf('?');
  return idx >= 0 ? url.slice(0, idx) : url;
}
