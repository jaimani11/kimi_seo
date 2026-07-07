import { providerId, type ProviderId } from '@core/ids';
import type { Provider, ProviderContext, ProviderSearchQuery } from '@core/provider';
import { fakeStayPool } from './fake-stays';

/**
 * Deterministic stay provider for orchestrator-integration tests.
 *
 * Pre-H2 these tests relied on `MockItalyProvider` to satisfy the
 * inventory branch of the orchestrator. After H2 the mock provider
 * is gone, so we inject this stub via `OrchestratorOptions.providerRouter`
 * + `routeDecider` to force the proposal path for testing.
 *
 * Same shape every call - 6 fake stays. Tests assert on the event
 * stream, not on the stay content, so the consistent fixture pool
 * is enough.
 */
export const stubStayProvider: Provider = {
  id: providerId('test-stub') as ProviderId,
  displayName: 'Test Stub',
  capabilities: {
    realtime: true,
    affiliateAttribution: false,
    supportsAvailability: false,
    supportsBooking: false,
  },
  async search(_q: ProviderSearchQuery, _ctx: ProviderContext) {
    return {
      stays: fakeStayPool(6),
      badges: [{ kind: 'curated' as const, label: 'Test Stub' }],
      freshness: {
        fetchedAt: new Date().toISOString(),
        dataMaxAgeMs: 60 * 60 * 1000,
        source: 'live' as const,
      },
    };
  },
};
