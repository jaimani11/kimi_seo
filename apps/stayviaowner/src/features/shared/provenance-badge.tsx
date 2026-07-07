import type { ProviderId } from '@core/ids';
import { getBrandingMode } from '@lib/branding/provider-branding';

interface ProvenanceBadgeProps {
  providerId: ProviderId | string;
  /** Variant - visual emphasis. `on-photo` is high-contrast for placement
   *  over hero/alternative imagery; `panel` is muted for the detail header. */
  variant?: 'on-photo' | 'panel';
}

interface ChipSpec {
  label: string;
  /** 'live' = real provider; 'curated' = our hand-picked dataset;
   *  'preview' = AI-synthesized; 'unknown' = fallback. */
  tone: 'live' | 'curated' | 'preview' | 'unknown';
}

/** Brand-explicit labels - used only when branding mode is `explicit`
 *  (admin/operator surfaces, or once partnership review completes). */
const EXPLICIT_PROVENANCE: Readonly<Record<string, ChipSpec>> = {
  expedia: { label: 'EXPEDIA · LIVE', tone: 'live' },
  vrbo: { label: 'VRBO · LIVE', tone: 'live' },
  'mock-italy': { label: 'CURATED · ITALY', tone: 'curated' },
  'llm-synthesized': { label: 'AI PREVIEW', tone: 'preview' },
  'expedia-search': { label: 'SEARCH · EXPEDIA', tone: 'preview' },
  'vrbo-search': { label: 'SEARCH · VRBO', tone: 'preview' },
  'hotels-com-search': { label: 'SEARCH · HOTELS.COM', tone: 'preview' },
};

/** Brand-neutral labels - used in the default and hidden modes. The
 *  tone (color) stays the same so the visual distinction between LIVE
 *  and SEARCH is preserved; only the brand text is generalized. */
const NEUTRAL_PROVENANCE: Readonly<Record<string, ChipSpec>> = {
  expedia: { label: 'LIVE', tone: 'live' },
  vrbo: { label: 'LIVE', tone: 'live' },
  'mock-italy': { label: 'CURATED', tone: 'curated' },
  'llm-synthesized': { label: 'AI PREVIEW', tone: 'preview' },
  'expedia-search': { label: 'PARTNER SEARCH', tone: 'preview' },
  'vrbo-search': { label: 'PARTNER SEARCH', tone: 'preview' },
  'hotels-com-search': { label: 'PARTNER SEARCH', tone: 'preview' },
};

function provenanceFor(providerId: string): ChipSpec {
  const mode = getBrandingMode();
  const table = mode === 'explicit' ? EXPLICIT_PROVENANCE : NEUTRAL_PROVENANCE;
  return (
    table[providerId] ?? {
      label: String(providerId).toUpperCase(),
      tone: 'unknown' as const,
    }
  );
}

/**
 * Per-listing provenance chip. Tells the user where a stay came from -
 * a real partner API (Expedia/Vrbo/Expedia), our hand-curated
 * Italian dataset, or AI-synthesized for unfamiliar destinations.
 *
 * The `AI PREVIEW` chip is intentionally distinct (warning-tone border)
 * so users never confuse a model-generated stay with a live partner
 * listing. Honesty is the load-bearing thing.
 *
 * Vocabulary mirrors the EntitlementBadge from C4 - same surface +
 * geist-mono uppercase pattern - so the operator/admin chrome and the
 * end-user chrome read consistently.
 */
export function ProvenanceBadge({ providerId, variant = 'on-photo' }: ProvenanceBadgeProps) {
  const spec = provenanceFor(String(providerId));
  const colors = toneColors(spec.tone, variant);

  return (
    <span
      className="inline-flex items-center"
      style={{
        fontFamily: 'var(--font-geist-mono)',
        fontSize: '0.55rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.45rem',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.fg,
        borderRadius: '0.2rem',
        // Soft drop-shadow on photos so the chip stays legible across
        // varied photography. Negligible on the muted panel variant.
        textShadow: variant === 'on-photo' ? '0 1px 2px rgba(0,0,0,0.4)' : undefined,
        backdropFilter: variant === 'on-photo' ? 'blur(4px)' : undefined,
      }}
      // Use aria-label so screen readers can spell out the source rather
      // than reading the squashed letterspacing version.
      aria-label={`Source: ${spec.label}`}
    >
      {spec.label}
    </span>
  );
}

/** Tone → CSS color tuple, parameterized by photo vs panel placement. */
function toneColors(
  tone: ChipSpec['tone'],
  variant: 'on-photo' | 'panel',
): { bg: string; border: string; fg: string } {
  if (variant === 'on-photo') {
    // High-contrast on top of stay photos.
    if (tone === 'live') {
      return {
        bg: 'rgba(0,0,0,0.4)',
        border: 'var(--accent-primary)',
        fg: 'var(--accent-primary)',
      };
    }
    if (tone === 'curated') {
      return {
        bg: 'rgba(0,0,0,0.4)',
        border: 'rgba(237,230,219,0.7)',
        fg: '#EDE6DB',
      };
    }
    if (tone === 'preview') {
      return {
        bg: 'rgba(0,0,0,0.4)',
        border: 'var(--accent-warning)',
        fg: 'var(--accent-warning)',
      };
    }
    return {
      bg: 'rgba(0,0,0,0.4)',
      border: 'rgba(237,230,219,0.5)',
      fg: 'rgba(237,230,219,0.85)',
    };
  }
  // Panel variant - muted.
  if (tone === 'live') {
    return {
      bg: 'var(--surface-overlay)',
      border: 'var(--accent-primary)',
      fg: 'var(--accent-primary)',
    };
  }
  if (tone === 'curated') {
    return {
      bg: 'var(--surface-overlay)',
      border: 'var(--border-emphasis)',
      fg: 'var(--ink-secondary)',
    };
  }
  if (tone === 'preview') {
    return {
      bg: 'var(--surface-overlay)',
      border: 'var(--accent-warning)',
      fg: 'var(--accent-warning)',
    };
  }
  return {
    bg: 'var(--surface-overlay)',
    border: 'var(--border-subtle)',
    fg: 'var(--ink-tertiary)',
  };
}
