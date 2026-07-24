import type { DestinationExperience, ProviderId, SectionData } from './contracts';
import { BRAND_SPECS } from './specs';

export interface ValidationResult {
  pass: boolean;
  errors: string[];
}

/** CJ redirect domains carry Booking.com attribution. */
const CJ_BOOKING_DOMAINS = ['anrdoezrs.net', 'tkqlhce.com', 'dpbolvw.net', 'jdoqocy.com', 'kqzyfj.com'];

/**
 * Best-effort provider detection from an outbound href host. Returns null for
 * internal links, unknown hosts, and Partnerize (`prf.hn`) links whose brand
 * (Expedia vs Vrbo) can't be told from the host alone — so the CTA check flags
 * only CLEAR cross-provider leaks, never false-positives.
 */
export function providerOfHref(href: string): ProviderId | null {
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.includes('booking.com') || CJ_BOOKING_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
    return 'booking';
  }
  if (host.includes('expedia.com')) return 'expedia';
  if (host.includes('vrbo.com')) return 'vrbo';
  if (host.includes('viator.com')) return 'viator';
  return null;
}

/** The affiliate CTA hrefs a section exposes (internal links excluded). */
function ctaHrefs(data: SectionData): string[] {
  switch (data.kind) {
    case 'area-cards':
      return data.areas.map((a) => a.href).filter((h): h is string => !!h);
    case 'compare-map':
      return data.pins.map((p) => p.href).filter((h): h is string => !!h);
    case 'decision-card':
      return data.options.map((o) => o.href).filter((h): h is string => !!h);
    default:
      return [];
  }
}

/**
 * validateBrandExperience — architectural guardrail, run before a page ships.
 *
 * Fails when: a brand emits a forbidden section kind (gobookt≠ai-prompt/
 * planning, stayviaowner≠hotel types, etc.); a required section is missing; the
 * composition/hero/FAQ/JSON-LD is incomplete; a cross-link isn't site-internal;
 * or an affiliate CTA resolves to a provider outside the brand's allowed set
 * (e.g. a Booking.com link on gotript). These are the drift vectors as the
 * codebase grows — enforced here instead of relying on code review.
 */
export function validateBrandExperience(exp: DestinationExperience): ValidationResult {
  const spec = BRAND_SPECS[exp.brand];
  if (!spec) return { pass: false, errors: [`no BrandSpec registered for '${exp.brand}'`] };

  const errors: string[] = [];
  const kinds = new Set(exp.sections.map((s) => s.data.kind));

  for (const forbidden of spec.forbiddenSections) {
    if (kinds.has(forbidden)) errors.push(`${exp.brand}: forbidden section kind '${forbidden}' was emitted`);
  }
  for (const required of spec.requiredSections) {
    if (!kinds.has(required)) errors.push(`${exp.brand}: required section kind '${required}' is missing`);
  }

  if (exp.sections.length === 0) errors.push(`${exp.brand}: no sections composed`);
  if (!exp.hero.heading.trim()) errors.push(`${exp.brand}: empty hero heading`);
  if (exp.faq.length === 0) errors.push(`${exp.brand}: no FAQ emitted`);
  if (!exp.jsonLd.includes('TouristDestination')) errors.push(`${exp.brand}: JSON-LD missing TouristDestination`);
  if (!exp.jsonLd.includes('FAQPage')) errors.push(`${exp.brand}: JSON-LD missing FAQPage`);

  for (const l of exp.crossLinks) {
    if (!l.href.startsWith('/')) errors.push(`${exp.brand}: cross-link not site-internal: ${l.href}`);
  }

  const allowed = new Set<ProviderId>([
    spec.providers.primary,
    ...(spec.providers.secondary ? [spec.providers.secondary] : []),
  ]);
  for (const s of exp.sections) {
    for (const href of ctaHrefs(s.data)) {
      const provider = providerOfHref(href);
      if (provider && !allowed.has(provider)) {
        errors.push(
          `${exp.brand}: section '${s.id}' CTA uses provider '${provider}', not in allowed [${[...allowed].join(', ')}]`,
        );
      }
    }
  }

  return { pass: errors.length === 0, errors };
}
