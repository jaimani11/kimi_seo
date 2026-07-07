'use client';

import type { SearchOpportunityProvider } from '@core/search-opportunity';
import { ExternalLink } from '@/features/shared/icons';
import { ProvenanceBadge } from '@/features/shared/provenance-badge';
import { encodeAffiliateLink } from '@lib/affiliate/link-encoder';
import {
  partnerAriaLabel,
  partnerCardHint,
  partnerCardLabel,
  partnerCtaLabel,
} from '@lib/branding/provider-branding';

/**
 * Slice F1 - single provider card on the SearchOpportunityBoard.
 *
 * One per stay-inventory partner. Every CTA routes through `/r/[id]`
 * so:
 *   - the click lands in the AffiliateClick table (B4)
 *   - the redirect handler re-validates the host against the allowlist
 *   - the affcid travels through (E2)
 *
 * The chip uses the SEARCH variants from `ProvenanceBadge` - it's the
 * honest signal: "we don't have inventory in hand, this routes you to
 * the partner for live results." Distinct from the bold `LIVE` chip on
 * real proposal cards.
 *
 * **Branding**: card title + hint + CTA + aria label are all routed
 * through `lib/branding` so the surface stays brand-neutral in the
 * default mode (Booking.com review pending). The underlying
 * `provider.providerId` + URL remain unchanged - this is presentation
 * only, monetization tracking is unaffected.
 */

interface Props {
  provider: SearchOpportunityProvider;
  turnId?: string;
  /** Used for accessible label so the screen-reader user knows what
   *  destination they're searching for. */
  destinationName: string;
}

export function SearchOpportunityCard({ provider, turnId, destinationName }: Props) {
  const id = encodeAffiliateLink({
    url: provider.url,
    providerId: provider.providerId,
    ...(turnId ? { turnId } : {}),
  });
  const href = `/r/${id}`;

  // Map provider id → the chip-style provenance key.
  const chipKey = `${provider.providerId}-search`;

  const label = partnerCardLabel(provider.providerId);
  const hint = partnerCardHint(provider.providerId, provider.hint ?? '');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={partnerAriaLabel(provider.providerId, `stays in ${destinationName}`)}
      className="group flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
      style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.7rem',
        padding: '1.1rem 1.15rem',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: 'var(--elev-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-body-md)',
              color: 'var(--ink-primary)',
              fontWeight: 500,
              letterSpacing: '0.005em',
            }}
          >
            {label}
          </span>
          {hint ? (
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                lineHeight: 1.45,
                color: 'var(--ink-tertiary)',
              }}
            >
              {hint}
            </span>
          ) : null}
        </div>
        <ProvenanceBadge providerId={chipKey} variant="panel" />
      </div>

      <span
        className="inline-flex items-center gap-1.5 transition-opacity group-hover:opacity-90"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.75rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          fontWeight: 500,
        }}
      >
        {partnerCtaLabel(provider.providerId, 'find-dates', { arrow: false })}
        <ExternalLink size={11} strokeWidth={2.2} aria-hidden />
      </span>
    </a>
  );
}
