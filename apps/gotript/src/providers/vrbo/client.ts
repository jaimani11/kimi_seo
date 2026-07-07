import type { ProviderSearchQuery } from '@core/provider';
import type { RapidCredentials } from '../_shared/rapid-signature';
import { searchExpedia } from '../expedia/client';
import { VRBO_RAPID_CATEGORY_IDS, type VrboSearchResponse } from './types';

/**
 * Vrbo Rapid client - same Rapid surface as Expedia, with a category
 * filter so only vacation-rental inventory comes back.
 *
 * If the partner contract grants Vrbo-only access, set `VRBO_API_KEY`
 * + `VRBO_SHARED_SECRET` (separate from `EXPEDIA_*`). Some EPS
 * partners share creds across both products; in that case set both
 * pairs to the same values.
 *
 * Reference: https://developers.expediagroup.com/docs/rapid/lodging/content/property-data-reference
 */
export async function searchVrbo(
  query: ProviderSearchQuery,
  creds: RapidCredentials,
  signal: AbortSignal,
  customerIp?: string,
): Promise<VrboSearchResponse | null> {
  const opts = {
    categoryIdsAllowlist: VRBO_RAPID_CATEGORY_IDS,
    ...(customerIp ? { customerIp } : {}),
  };
  return searchExpedia(query, creds, signal, opts);
}
