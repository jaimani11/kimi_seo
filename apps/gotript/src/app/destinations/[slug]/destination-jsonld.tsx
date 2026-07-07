import type { CuratedDestination } from '@lib/curation/destinations';

interface JsonLdProps {
  destination: CuratedDestination;
  baseUrl: string;
  imageUrl?: string;
}

/**
 * Schema.org TouristDestination JSON-LD. Inlined as a script tag in
 * the destination page so crawlers find it without a separate request.
 *
 * Why we ship this: Google Travel + general SERP rich-result eligibility.
 * Cost is a few hundred bytes; upside is the page's eligibility for
 * destination panels, knowledge-graph linking, etc.
 */
export function DestinationJsonLd({ destination, baseUrl, imageUrl }: JsonLdProps) {
  const url = `${baseUrl}/destinations/${destination.slug}`;
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.name,
    description: destination.oneLiner,
    address: {
      '@type': 'PostalAddress',
      addressCountry: destination.country,
      addressRegion: destination.region,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: destination.coordinates.lat,
      longitude: destination.coordinates.lng,
    },
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify is the safe stringifier - no unescaped HTML can
      // sneak in from our hand-curated content, but using it is the
      // standard pattern for Schema.org JSON-LD in React.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
