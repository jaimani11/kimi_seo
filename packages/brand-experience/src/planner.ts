import type {
  BrandId,
  BrandSpec,
  CityFacts,
  DestinationExperience,
  ExperienceSection,
  ProviderAdapters,
} from './contracts';
import { BRAND_SPECS } from './specs';

export interface PlanContext {
  canonical: string;
  imageUrl: string;
}

/**
 * buildBrandPlan — the pure planner. Given a brand, the city facts, the app's
 * money-path adapters, and page context, it composes the brand's
 * DestinationExperience from its BrandSpec policies. No React, no app imports,
 * no I/O — deterministic and unit-testable.
 */
export function buildBrandPlan(
  brand: BrandId,
  facts: CityFacts,
  adapters: ProviderAdapters,
  ctx: PlanContext,
): DestinationExperience {
  const spec = BRAND_SPECS[brand];
  if (!spec) throw new Error(`buildBrandPlan: no BrandSpec registered for '${brand}'`);

  const sections: ExperienceSection[] = [];
  for (const s of spec.sections) {
    const data = s.build(facts, adapters);
    if (data) sections.push({ id: s.id, eyebrow: s.eyebrow, heading: s.heading(facts), data });
  }

  const faq = spec.faqPolicy(facts);

  return {
    brand,
    hero: spec.hero(facts),
    sections,
    faq,
    jsonLd: buildJsonLd(spec, facts, faq, ctx),
    crossLinks: spec.linkPolicy(facts),
  };
}

function buildJsonLd(
  spec: BrandSpec,
  facts: CityFacts,
  faq: Array<{ question: string; answer: string }>,
  ctx: PlanContext,
): string {
  const destination = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: `${facts.name}, ${facts.countryName}`,
    description: spec.schemaDescription(facts),
    url: ctx.canonical,
    image: ctx.imageUrl,
    address: {
      '@type': 'PostalAddress',
      addressCountry: facts.countryCode,
      addressLocality: facts.name,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: facts.coordinates.lat,
      longitude: facts.coordinates.lng,
    },
    containedInPlace: { '@type': 'Country', name: facts.countryName },
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
  return JSON.stringify([destination, faqPage]).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
