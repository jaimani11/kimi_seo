import { clientFeatures } from './features';

/**
 * Server-side runtime feature flags. Reads from process.env at the time
 * of call (not at module load) so tests that set env vars dynamically
 * see the latest values.
 */
export interface ServerFeatures {
  auth: boolean;
  database: boolean;
  anthropic: boolean;
  langfuse: boolean;
  /** Which orchestrator engine the singleton would construct right now. */
  orchestratorEngine: 'hand-rolled' | 'langgraph';
  /** Real (env-keyed) provider availability. Mock providers are always on. */
  providers: {
    bookingCom: boolean;
    expedia: boolean;
  };
  /** Slice C1 - memory subsystem backing. Surfaced on /admin. */
  memory: {
    /** Always 'in-memory' in C1 mock-safe path; 'pgvector' when DB + flag set. */
    kind: 'in-memory' | 'pgvector';
    /** 'bag-of-words' default; 'anthropic' opt-in via env flag. */
    embedding: 'bag-of-words' | 'anthropic';
  };
  /** Slice C4 - billing provider backing. Surfaced on /admin. */
  billing: {
    /** 'mock' (everyone authed = premium) or 'stripe' (real Checkout + webhook). */
    kind: 'mock' | 'stripe';
  };
  /** Slice D - booking provider backing. Surfaced on /admin. */
  bookings: {
    /** 'mock' in Slice D. 'live' once D.x ships real provider booking. */
    kind: 'mock' | 'live';
    /** True iff `STAYSCOUT_LIVE_BOOKING=1`. The seam exists; the wiring
     *  lands in D.x. Operators see "live is configured but inactive" via
     *  this flag without surprises in the demo. */
    liveEnabled: boolean;
  };
  /** Slice E2 - Expedia affiliate creator platform. Surfaced on /admin. */
  affiliate: {
    /** True iff a non-empty Expedia affcid is configured. Affiliate
     *  links work without it (URL still resolves) but commission
     *  doesn't track. */
    expediaConfigured: boolean;
  };
}

function isPresent(name: string): boolean {
  const v = process.env[name];
  // Treat empty AND the placeholder URL we use for `prisma generate` as
  // "not configured" - placeholder lets codegen run without forcing every
  // dev to set up Postgres locally.
  if (typeof v !== 'string' || v.length === 0) return false;
  if (v.includes('placeholder@localhost') || v === 'placeholder') return false;
  return true;
}

export function getServerFeatures(): ServerFeatures {
  return {
    auth: clientFeatures.auth && isPresent('CLERK_SECRET_KEY'),
    database: isPresent('DATABASE_URL'),
    anthropic: isPresent('ANTHROPIC_API_KEY'),
    langfuse: isPresent('LANGFUSE_SECRET_KEY'),
    orchestratorEngine:
      process.env.STAYSCOUT_ORCHESTRATOR === 'langgraph' ? 'langgraph' : 'hand-rolled',
    providers: {
      bookingCom: isPresent('BOOKING_COM_AFFILIATE_ID') && isPresent('BOOKING_COM_API_KEY'),
      expedia: isPresent('EXPEDIA_API_KEY') && isPresent('EXPEDIA_SHARED_SECRET'),
    },
    memory: {
      kind:
        isPresent('DATABASE_URL') && process.env.STAYSCOUT_PGVECTOR === '1'
          ? 'pgvector'
          : 'in-memory',
      embedding:
        isPresent('ANTHROPIC_API_KEY') && process.env.STAYSCOUT_USE_ANTHROPIC_EMBEDDINGS === '1'
          ? 'anthropic'
          : 'bag-of-words',
    },
    billing: {
      // Stripe mode requires all three vars. Partial config falls back
      // to mock - see `getBillingSubsystem()` for the warning + reason.
      kind:
        isPresent('STRIPE_SECRET_KEY') &&
        isPresent('STRIPE_WEBHOOK_SECRET') &&
        isPresent('STRIPE_PRICE_ID')
          ? 'stripe'
          : 'mock',
    },
    bookings: {
      // Slice D ships only the mock provider. D.x adds the env-driven
      // switch behind STAYSCOUT_LIVE_BOOKING + per-provider keys.
      kind: 'mock',
      liveEnabled: process.env.STAYSCOUT_LIVE_BOOKING === '1',
    },
    affiliate: {
      // True when ANY of the four affcid forms is set. Mirrors the
      // multi-name resolution in getExpediaAffiliateConfig().
      expediaConfigured:
        isPresent('NEXT_PUBLIC_EXPEDIA_AFFILIATE_CID') || isPresent('EXPEDIA_AFFILIATE_CID'),
    },
  };
}
