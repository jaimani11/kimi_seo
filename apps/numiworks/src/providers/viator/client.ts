import { ProviderError, ProviderTimeoutError } from '@/providers/_shared/errors';
import {
  ViatorFreetextSearchResponseSchema,
  ViatorProductDetailSchema,
  type ViatorFreetextSearchRequest,
  type ViatorFreetextSearchResponse,
  type ViatorProductDetail,
} from './types';

/**
 * Low-level Viator Partner API client.
 *
 *   - Auth: `exp-api-key` header (server-side only - the key never
 *     reaches the browser).
 *   - Content-type: `application/json;version=2.0`. The version is
 *     part of the media type, not a header or URL segment.
 *   - Per-request affiliate tracking via `campaign-value` query param.
 *     Viator embeds it in the response `productUrl` for click-through
 *     attribution.
 *
 * Single method today (`/search/freetext`). Other endpoints can be
 * added the same way - they all share auth + media type.
 *
 * Why a hand-rolled client rather than reusing `_shared/http.ts`:
 * Viator's content-type is non-standard (`;version=2.0`) and our
 * shared helper overrides the caller's content-type to plain
 * `application/json`. Refactoring shared infra mid-slice is scope
 * creep; we localize the special-casing here instead.
 */

const VIATOR_MEDIA_TYPE = 'application/json;version=2.0';

export interface ViatorClientConfig {
  /** `exp-api-key` header value. Server-side only. */
  apiKey: string;
  /** Base URL - defaults to https://api.viator.com/partner. Allow an
   *  override so callers can point at the sandbox during dev. */
  baseUrl?: string;
  /** Affiliate campaign id appended to `productUrl` for attribution.
   *  Optional - URLs still work without it; commission just doesn't
   *  attribute to a campaign. */
  campaignValue?: string;
  /** Locale tag for the `Accept-Language` header. Defaults to en-US. */
  acceptLanguage?: string;
  /** Per-request timeout in milliseconds. Defaults to 8000. */
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = 'https://api.viator.com/partner';

export class ViatorClient {
  readonly #config: Required<Omit<ViatorClientConfig, 'campaignValue'>> &
    Pick<ViatorClientConfig, 'campaignValue'>;

  constructor(config: ViatorClientConfig) {
    if (!config.apiKey) {
      throw new Error('ViatorClient: apiKey is required');
    }
    this.#config = {
      apiKey: config.apiKey,
      baseUrl: stripTrailingSlash(config.baseUrl ?? DEFAULT_BASE_URL),
      campaignValue: config.campaignValue,
      acceptLanguage: config.acceptLanguage ?? 'en-US',
      timeoutMs: config.timeoutMs ?? 8000,
    };
  }

  /**
   * POST /search/freetext - natural-language search across products,
   * destinations, and attractions. The discovery rails use this for
   * the homepage "Things to do" sections.
   */
  async freetextSearch(
    body: ViatorFreetextSearchRequest,
    signal: AbortSignal,
  ): Promise<ViatorFreetextSearchResponse> {
    const url = this.#buildUrl('/search/freetext');
    const raw = await this.#request('POST', url, body, signal);
    return ViatorFreetextSearchResponseSchema.parse(raw);
  }

  /**
   * GET /products/{product-code} - full product content for the
   * experience detail page. Includes inclusions/exclusions,
   * cancellation policy, additional info sections, etc. that the
   * search summary doesn't carry.
   */
  async getProduct(productCode: string, signal: AbortSignal): Promise<ViatorProductDetail> {
    const url = this.#buildUrl(`/products/${encodeURIComponent(productCode)}`);
    const raw = await this.#request('GET', url, undefined, signal);
    return ViatorProductDetailSchema.parse(raw);
  }

  // ============== Internals ==============

  #buildUrl(path: string): string {
    const url = new URL(`${this.#config.baseUrl}${path}`);
    if (this.#config.campaignValue) {
      url.searchParams.set('campaign-value', this.#config.campaignValue);
    }
    return url.toString();
  }

  async #request(
    method: 'GET' | 'POST',
    url: string,
    body: unknown,
    parentSignal: AbortSignal,
  ): Promise<unknown> {
    const controller = new AbortController();
    const onParentAbort = () => controller.abort(parentSignal.reason);
    if (parentSignal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    parentSignal.addEventListener('abort', onParentAbort);

    const timeoutHandle = setTimeout(() => {
      controller.abort(new ProviderTimeoutError(`Viator ${method} ${url} timed out`, 'viator'));
    }, this.#config.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          accept: VIATOR_MEDIA_TYPE,
          'content-type': VIATOR_MEDIA_TYPE,
          'exp-api-key': this.#config.apiKey,
          'accept-language': this.#config.acceptLanguage,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new ProviderError(
          `Viator HTTP ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 240)}` : ''}`,
          'viator',
        );
      }
      return await res.json();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        const reason = controller.signal.reason;
        if (reason instanceof ProviderTimeoutError) throw reason;
        throw err;
      }
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(
        `Viator request failed: ${err instanceof Error ? err.message : String(err)}`,
        'viator',
      );
    } finally {
      clearTimeout(timeoutHandle);
      parentSignal.removeEventListener('abort', onParentAbort);
    }
  }
}

// ============== Env helper ==============

/**
 * Build a `ViatorClient` from the standard env vars. Returns null when
 * the API key isn't set so callers can degrade gracefully (homepage
 * still renders, the live rail is just absent).
 *
 * Environment:
 *   VIATOR_API_KEY            - required (`exp-api-key` header)
 *   VIATOR_PARTNER_ID         - optional (campaign-value query param)
 *   VIATOR_API_BASE_URL       - optional (defaults to prod)
 *   VIATOR_ACCEPT_LANGUAGE    - optional (defaults to en-US)
 */
export function viatorClientFromEnv(): ViatorClient | null {
  const apiKey = (process.env.VIATOR_API_KEY ?? '').trim();
  if (!apiKey) return null;
  const config: ViatorClientConfig = { apiKey };
  const partnerId = (process.env.VIATOR_PARTNER_ID ?? '').trim();
  if (partnerId.length > 0) config.campaignValue = partnerId;
  const baseUrl = (process.env.VIATOR_API_BASE_URL ?? '').trim();
  if (baseUrl.length > 0) config.baseUrl = baseUrl;
  const language = (process.env.VIATOR_ACCEPT_LANGUAGE ?? '').trim();
  if (language.length > 0) config.acceptLanguage = language;
  return new ViatorClient(config);
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}
