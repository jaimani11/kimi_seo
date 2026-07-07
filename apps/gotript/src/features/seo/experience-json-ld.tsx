import type { ViatorProductDetail } from '@/providers/viator/types';
import type { Experience } from '@core/experience';
import { formatExperienceDuration } from '@core/experience';

/**
 * schema.org Product + Offer + AggregateRating + BreadcrumbList JSON-LD
 * for the experience detail page. Two payloads, emitted as separate
 * <script> tags so Google can parse each independently and recover
 * gracefully if one is malformed.
 *
 * Product schema unlocks the "rich result" treatment in Google search:
 * star rating, review count, price band, "in stock" pill all visible
 * in the SERP. Single biggest CTR lever for an affiliate site.
 *
 * BreadcrumbList unlocks the breadcrumb-path display in SERPs - the
 * URL is replaced by Home > Destinations > Rome > {Experience name},
 * which both reads cleaner and ranks measurably better.
 */

export interface ExperienceJsonLdProps {
  product: ViatorProductDetail;
  productCode: string;
  experience: Experience;
  /** Absolute canonical URL of this page. */
  canonicalUrl: string;
  /** Cover-quality image URL. */
  imageUrl: string | null;
}

export function ExperienceJsonLd({
  product,
  productCode,
  experience,
  canonicalUrl,
  imageUrl,
}: ExperienceJsonLdProps) {
  const productLd = buildProductLd({ product, productCode, experience, canonicalUrl, imageUrl });
  const breadcrumbsLd = buildBreadcrumbsLd({ experience, canonicalUrl, productCode });

  return (
    <>
      <script
        type="application/ld+json"
        // The HTML-escaping rules for JSON-LD inside <script> require
        // closing tags inside string values be escaped. JSON.stringify
        // followed by the replace below is the canonical safe pattern.
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(productLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsLd),
        }}
      />
    </>
  );
}

// ============== Builders ==============

function buildProductLd(args: ExperienceJsonLdProps): Record<string, unknown> {
  const { product, productCode, experience, canonicalUrl, imageUrl } = args;

  const description = (product.description ?? experience.summary ?? '').trim().slice(0, 5000);
  const images = product.images
    ?.flatMap((i) => (i.variants ?? []).map((v) => v.url))
    .filter((u): u is string => Boolean(u))
    .slice(0, 8) ?? (imageUrl ? [imageUrl] : []);

  const out: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title ?? experience.title,
    sku: `viator-${productCode}`,
    description,
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: 'Viator',
    },
    category: experience.tags?.[0] ?? 'Tours and Activities',
  };

  if (images.length > 0) out.image = images;

  if (experience.pricing.fromPerPerson > 0) {
    out.offers = {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: experience.pricing.currency,
      price: experience.pricing.fromPerPerson.toFixed(2),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Viator',
      },
    };
  }

  if (
    experience.reviews.averageRating !== null &&
    experience.reviews.averageRating > 0 &&
    experience.reviews.total > 0
  ) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: experience.reviews.averageRating.toFixed(2),
      reviewCount: experience.reviews.total,
      bestRating: '5',
      worstRating: '1',
    };
  }

  const durationLabel = formatExperienceDuration(experience.duration);
  if (durationLabel) {
    out.additionalProperty = [
      {
        '@type': 'PropertyValue',
        name: 'Duration',
        value: durationLabel,
      },
    ];
  }

  return out;
}

function buildBreadcrumbsLd(args: {
  experience: Experience;
  canonicalUrl: string;
  productCode: string;
}): Record<string, unknown> {
  const origin = safeOrigin(args.canonicalUrl);
  const destination = args.experience.location.destination;
  const items: Record<string, unknown>[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${origin}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Experiences',
      item: `${origin}/search`,
    },
  ];

  if (destination) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: destination,
      item: `${origin}/search?q=${encodeURIComponent(destination)}`,
    });
  }

  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: args.experience.title,
    item: args.canonicalUrl,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

// ============== Helpers ==============

function safeJsonLd(value: unknown): string {
  // Stringify and neutralize sequences that would close the <script>
  // tag or be misinterpreted by HTML parsers.
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

function safeOrigin(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}
