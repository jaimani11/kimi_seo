# BrandSpec Contract — `@adored/brand-experience`

Adding a travel brand (or a new page type) should mean **writing a spec**, not
another rendering system. This is the contract.

## The three layers

```
CityFacts            objective facts about a place (no brand opinion)
   │  buildBrandPlan(brand, facts, adapters, ctx)   ← pure business logic
DestinationExperience   this brand's interpretation (hero/sections/faq/schema/links)
   │  validateBrandExperience(exp)                  ← guardrail, before ship
   │  <DestinationExperienceRenderer>               ← brand-agnostic React (@adored/ui)
HTML
```

Rules the types enforce:
- `CityFacts` and `DestinationExperience` are **separate types** — a renderer
  can never mix raw facts with brand interpretation.
- The **planner is pure**: no React, no affiliate/app imports. Money-path hrefs
  arrive through injected `ProviderAdapters`.
- A **BrandSpec describes identity, not a section list** — the planner composes
  the page from its policies.

## CityFacts (layer 1)

Objective, brand-neutral data adapted from `@adored/seo-data` via
`toCityFacts(input)`: `slug/name/countryName/countryCode/region`, `coordinates`,
`bestTime`, `budget`, `travelStyles`, `foods`, `transportation`, `neighborhoods`,
`neighborhoodPois`, `safety`, optional `climate.tz`. No opinions, no CTAs.

## BrandSpec fields (the product definition)

| Field | Why it exists |
|---|---|
| `brand` | The brand id (`gobookt`/`gotript`/`numiworks`/`stayviaowner`). |
| `purpose` | The one job this page does ("Help someone choose accommodation"). |
| `audience` | Who it is for. |
| `primaryQuestion` | The single user question the page answers ("Where should I stay?"). |
| `narrative` | Voice/framing note used by copy. |
| `providers` | `{ primary, secondary? }` — the ONLY affiliate providers allowed. The validator flags any CTA outside this set. |
| `hero(facts)` | `{ eyebrow, heading, subhead }`. |
| `sections[]` | Ordered `SectionSpec`s (the section policy). Each has `id/kind/eyebrow/heading(facts)/build(facts,adapters)`. `build` returns `null` to omit a section for a city. |
| `faqPolicy(facts)` | The FAQ Q&A pairs → FAQPage JSON-LD. Brand-specific questions (accommodation vs planning). |
| `schemaDescription(facts)` | Crawler-facing TouristDestination description, brand-framed. |
| `crossLinksHeading` | Heading for the related-links block ("Keep exploring stays"). |
| `linkPolicy(facts)` | Internal related links (must be site-relative). |
| `requiredSections[]` | Section kinds that MUST appear (validator fails if missing). |
| `forbiddenSections[]` | Section kinds this brand must NEVER emit (validator fails if present). |

## SectionKind vocabulary

`climate` · `area-cards` · `compare-map` (optional `areas` list + map) ·
`chip-grid` (hotel types / experience categories / property types) ·
`profile-list` · `itinerary-links` · `decision-card` · `prose` · `cta-list` ·
`ai-prompt` (rendered via a slot). The renderer maps each kind to UI, themed per
brand through CSS variables.

## ProviderAdapters (injected by the app)

```ts
interface ProviderAdapters {
  primarySearchHref: (query: string) => string | null; // null = fail-closed
  wholeHomeHref?: (city: string) => string | null;
}
```
The engine stays pure; the app supplies money-path-safe builders (gobookt →
`bookingHotelsSearchHref`, gotript → `buildExpediaCategoryUrl`). A `null` renders
a controlled "temporarily unavailable" state, never a wrong link.

## The validator (architectural guardrail)

`validateBrandExperience(exp)` fails on: a forbidden section kind; a missing
required kind; empty composition/hero/FAQ; JSON-LD missing TouristDestination or
FAQPage; a non-internal cross-link; **or an affiliate CTA whose host maps to a
provider outside `providers`** (e.g. a Booking.com link on gotript). Run it in a
test per brand — drift becomes a failing build, not a code-review miss.

## Adding a brand

1. Write a `BrandSpec` in `src/specs.ts` and register it in `BRAND_SPECS`.
2. In the app's destination page: `toCityFacts(...)` → `buildBrandPlan(brand, …)`
   → `<DestinationExperienceRenderer>` with the app's `ProviderAdapters` + any
   slots (search widget, AI concierge). Keep `SeoPageShell` + bottom hand-off in
   the page.
3. Verify with the harness: `node scripts/functional-surface.mjs capture <url> a.json`
   before + `diff a.json b.json` after — **functional** equivalence (headings,
   links, schema, CTAs, canonical), not byte-for-byte.

## Verified brands

- **gobookt** — accommodation-decision. Providers: booking. Required: area-cards,
  chip-grid. Forbidden: ai-prompt, itinerary-links, decision-card.
- **gotript** — trip-planning. Providers: expedia, vrbo. Required: itinerary-links,
  decision-card. Forbidden: ai-prompt, chip-grid.
