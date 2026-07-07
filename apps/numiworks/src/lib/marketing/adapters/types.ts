import type { MarketingPlatform, MarketingPostPayload } from '../types';

/**
 * Pluggable platform adapter interface.
 *
 * Every adapter (Pinterest, Instagram, TikTok) implements this same
 * shape so the scheduler can dispatch uniformly. The adapter
 * decides whether to actually post via the platform's API or to
 * stub (log + return a placeholder url) when credentials aren't
 * configured.
 *
 * v1 ships three stub adapters that log + record success. Real API
 * integration is a follow-up: the dispatch surface stays exactly
 * the same; only the internals of `post()` change.
 *
 * Each adapter exposes its `requiredCredentials` so the admin UI
 * can show "set X to enable live posting" without each platform
 * needing its own UI logic.
 */

export interface MarketingAdapterPostInput {
  citySlug: string;
  cityName: string;
  payload: MarketingPostPayload;
}

export interface MarketingAdapterPostResult {
  /** Whether the post made it onto the platform. Stub adapters can
   *  return `mode: 'stub'` so the admin UI can distinguish a
   *  successful real post from a logged-only stub. */
  mode: 'stub' | 'live';
  /** Post URL (live) or a synthesized placeholder (stub). */
  externalUrl: string;
}

export interface MarketingAdapter {
  readonly platform: MarketingPlatform;
  /** Env vars the adapter checks at construction time to decide
   *  whether to post live vs. stub. Surfaced in the admin UI. */
  readonly requiredCredentials: readonly string[];
  /** True when all required credentials are present and the
   *  adapter is configured to post live. False = stub mode. */
  readonly isLive: boolean;
  post(input: MarketingAdapterPostInput): Promise<MarketingAdapterPostResult>;
}
