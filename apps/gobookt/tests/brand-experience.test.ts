import { describe, it, expect } from 'vitest';
import {
  toCityFacts,
  buildBrandPlan,
  validateBrandExperience,
  validateBrandSpec,
  BRAND_SPECS,
  BRANDSPEC_VERSION,
  type ProviderAdapters,
  type BrandId,
} from '@adored/brand-experience';

const FACTS = toCityFacts({
  city: {
    slug: 'paris',
    name: 'Paris',
    countryName: 'France',
    countryCode: 'FR',
    region: 'Île-de-France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  guide: {
    bestTimeToVisit: { months: 'April–June, September–October', blurb: 'Mild and pleasant.' },
    budget: { budgetDailyUSD: 80, midDailyUSD: 150, luxuryDailyUSD: 400, blurb: 'Varies by area.' },
    travelStyles: { family: 'Family text.', couples: 'Couples text.', solo: 'Solo text.' },
    food: [{ dish: 'Croissant', note: 'Buttery.' }],
    transportation: { primary: 'The Métro is fast.', tips: 'Very walkable.' },
    neighborhoods: [
      { name: 'Le Marais', blurb: 'Boutique shops and cafés.' },
      { name: 'Montmartre', blurb: 'The artsy hill.' },
    ],
    safety: 'Generally safe; watch for pickpockets.',
  },
  climate: { tz: 'Europe/Paris' },
  neighborhoodPois: [
    { name: 'Le Marais', lat: 48.8575, lng: 2.3622 },
    { name: 'Montmartre', lat: 48.8867, lng: 2.3431 },
  ],
});

const adapters: ProviderAdapters = {
  primarySearchHref: (q) => `https://tracked.example/search?ss=${encodeURIComponent(q)}`,
  wholeHomeHref: (c) => `https://tracked.example/vrbo?dest=${encodeURIComponent(c)}`,
};
const ctx = { canonical: 'https://x.com/destinations/paris', imageUrl: 'https://x.com/paris.jpg' };

describe('@adored/brand-experience engine', () => {
  it('gobookt composes an accommodation-first, valid experience', () => {
    const exp = buildBrandPlan('gobookt', FACTS, adapters, ctx);
    expect(validateBrandExperience(exp).pass).toBe(true);
    const kinds = exp.sections.map((s) => s.data.kind);
    expect(kinds).toContain('area-cards');
    expect(kinds).toContain('chip-grid');
    expect(kinds).not.toContain('itinerary-links');
    expect(kinds).not.toContain('ai-prompt');
    expect(exp.hero.heading).toBe('Where to stay in Paris');
    expect(exp.jsonLd).toContain('TouristDestination');
  });

  it('gotript composes a planning-first, valid experience with a hotel-vs-home decision', () => {
    const exp = buildBrandPlan('gotript', FACTS, adapters, ctx);
    expect(validateBrandExperience(exp).pass).toBe(true);
    const kinds = exp.sections.map((s) => s.data.kind);
    expect(kinds).toContain('itinerary-links');
    expect(kinds).toContain('decision-card');
    expect(kinds).not.toContain('chip-grid');
    expect(exp.hero.heading).toBe('The Paris Travel Guide');
  });

  it('validator rejects a section kind forbidden for the brand', () => {
    const exp = buildBrandPlan('gobookt', FACTS, adapters, ctx);
    exp.sections.push({
      id: 'injected',
      eyebrow: '',
      heading: 'x',
      data: { kind: 'ai-prompt', placeholder: 'p', ctaLabel: 'c' },
    });
    const result = validateBrandExperience(exp);
    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.includes('ai-prompt'))).toBe(true);
  });

  it('numiworks composes an experiences-first, valid experience (Viator, AI concierge)', () => {
    const exp = buildBrandPlan('numiworks', FACTS, adapters, ctx);
    expect(validateBrandExperience(exp).pass).toBe(true);
    const kinds = exp.sections.map((s) => s.data.kind);
    // ai-prompt is numiworks' signature — and it's FORBIDDEN on gobookt/gotript.
    expect(kinds).toContain('ai-prompt');
    expect(kinds).toContain('area-cards');
    // gotript's signatures must never appear on numiworks.
    expect(kinds).not.toContain('itinerary-links');
    expect(kinds).not.toContain('decision-card');
    expect(exp.hero.heading).toBe('Things to do in Paris');
    expect(exp.jsonLd).toContain('bookable on Viator');
  });

  it('numiworks lead section is the AI concierge, unlike the accommodation brands', () => {
    const nm = buildBrandPlan('numiworks', FACTS, adapters, ctx);
    const go = buildBrandPlan('gobookt', FACTS, adapters, ctx);
    expect(nm.sections[0]!.data.kind).toBe('ai-prompt');
    expect(go.sections[0]!.data.kind).not.toBe('ai-prompt');
    expect(nm.hero.heading).not.toBe(go.hero.heading);
  });

  it('throws for a brand with no registered spec yet', () => {
    expect(() => buildBrandPlan('stayviaowner' as BrandId, FACTS, adapters, ctx)).toThrow();
  });

  it('the same CityFacts yields meaningfully different experiences per brand', () => {
    const go = buildBrandPlan('gobookt', FACTS, adapters, ctx);
    const gt = buildBrandPlan('gotript', FACTS, adapters, ctx);
    expect(go.hero.heading).not.toBe(gt.hero.heading);
    const goKinds = go.sections.map((s) => s.data.kind);
    const gtKinds = gt.sections.map((s) => s.data.kind);
    expect(goKinds[0]).not.toBe(gtKinds[0]); // different lead section
    expect(JSON.stringify(goKinds)).not.toBe(JSON.stringify(gtKinds)); // structurally distinct
  });

  it('every registered BrandSpec satisfies the v1 invariants', () => {
    expect(BRANDSPEC_VERSION).toBe('1.0');
    for (const [brand, spec] of Object.entries(BRAND_SPECS)) {
      if (!spec) continue;
      const r = validateBrandSpec(spec);
      expect(r.pass, `${brand}: ${r.errors.join('; ')}`).toBe(true);
    }
  });

  it('validator flags a wrong-provider CTA (leakage)', () => {
    const gt = buildBrandPlan('gotript', FACTS, adapters, ctx);
    const dc = gt.sections.find((s) => s.data.kind === 'decision-card');
    if (dc && dc.data.kind === 'decision-card') {
      dc.data.options[0]!.href = 'https://www.booking.com/searchresults.html?ss=Paris';
    }
    const result = validateBrandExperience(gt);
    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.includes('booking'))).toBe(true);
  });

  it('validator flags a GetYourGuide CTA on numiworks (enforces the Viator switch)', () => {
    const nm = buildBrandPlan('numiworks', FACTS, adapters, ctx);
    const cards = nm.sections.find((s) => s.data.kind === 'area-cards');
    if (cards && cards.data.kind === 'area-cards') {
      cards.data.areas[0]!.href = 'https://www.getyourguide.com/paris-l16/?partner_id=SL52HD5';
    }
    const result = validateBrandExperience(nm);
    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.includes('getyourguide'))).toBe(true);
  });
});
