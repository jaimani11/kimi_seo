import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight } from '@/features/shared/icons';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { ExperienceJsonLd } from '@/features/seo/experience-json-ld';
import { Breadcrumbs } from '@/features/seo/breadcrumbs';
import { AutoFaq, AutoFaqJsonLd } from '@/features/seo/auto-faq';
import { ViewBeacon } from '@/features/analytics/view-beacon';
import { viatorClientFromEnv } from '@/providers/viator/client';
import { mapViatorProductToExperience } from '@/providers/viator/mapper';
import { formatExperienceDuration } from '@core/experience';
import { encodeAffiliateLink } from '@lib/affiliate/link-encoder';
import { isAllowedAffiliateHost } from '@lib/affiliate/allowlist';
import { canonicalUrl } from '@lib/site/origin';
import { partnerCtaLabel } from '@lib/branding/provider-branding';
import { ReasoningChips } from '@/features/experience-cards/reasoning-chips';
import { WhyViatorTooltip } from '@/features/shared/why-viator-tooltip';
import {
  formatAverageRating,
  formatPerPerson,
  formatReviewCount,
} from '@/features/experience-cards/format';
import type {
  ViatorProductDetail,
} from '@/providers/viator/types';

/**
 * Experience detail page. Server-rendered, fetches product content
 * from the Viator Partner API at request time.
 *
 * Layout:
 *   - SiteHeader (sticky nav)
 *   - Photo gallery hero (full-bleed top section)
 *   - Eyebrow (duration · destination · rating) + title
 *   - Italic summary
 *   - Two-column body:
 *     - left: description, highlights, inclusions, exclusions,
 *             cancellation policy, additional info
 *     - right (sticky): from-price, rating, "Reserve on Viator" CTA
 *   - SiteFooter
 *
 * SEO: dynamic metadata generation from product title + description.
 */

interface PageProps {
  params: Promise<{ productCode: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productCode } = await params;
  const product = await fetchProduct(productCode);
  if (!product) {
    return { title: 'Experience not found · stayviaowner' };
  }
  const title = `${product.title ?? 'Experience'} · stayviaowner`;
  const description = (product.description ?? '').slice(0, 240);
  const coverUrl = pickHeroPhoto(product, 1200);
  const canonical = canonicalUrl(`/experiences/${productCode}`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      ...(coverUrl ? { images: [{ url: coverUrl }] } : {}),
    },
  };
}

export default async function ExperienceDetailPage({ params }: PageProps) {
  const { productCode } = await params;
  const product = await fetchProduct(productCode);
  if (!product) notFound();

  const exp = mapViatorProductToExperience(product, { currency: 'USD' });
  const durationLabel = formatExperienceDuration(exp.duration);
  const rating = formatAverageRating(exp.reviews.averageRating);
  const heroPhotos = pickGalleryPhotos(product);
  const reserveHref = buildReserveHref(product, productCode);
  const pageCanonical = canonicalUrl(`/experiences/${productCode}`);
  const destination = exp.location.destination;
  const inclusions = (product.inclusions ?? [])
    .map((i) => i.description?.trim())
    .filter((s): s is string => Boolean(s && s.length > 0));
  const exclusions = (product.exclusions ?? [])
    .map((e) => e.description?.trim())
    .filter((s): s is string => Boolean(s && s.length > 0));
  const additionalInfo = (product.additionalInfo ?? [])
    .map((a) => a.description?.trim())
    .filter((s): s is string => Boolean(s && s.length > 0));
  const cancellationText = product.cancellationPolicy?.description?.trim() ?? null;

  return (
    <>
      <ExperienceJsonLd
        product={product}
        productCode={productCode}
        experience={exp}
        canonicalUrl={pageCanonical}
        imageUrl={heroPhotos[0] ?? null}
      />
      <AutoFaqJsonLd product={product} experience={exp} />
      <ViewBeacon
        event="experience_view"
        refValue={productCode}
        metadata={{
          title: exp.title.slice(0, 200),
          imageUrl: heroPhotos[0] ?? '',
          destination: destination.slice(0, 80),
          priceFromUsd:
            exp.pricing.currency === 'USD' ? exp.pricing.fromPerPerson : 0,
          currency: exp.pricing.currency,
        }}
      />
      <SiteHeader />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Experiences', href: '/search' },
          ...(destination
            ? [{ label: destination, href: `/search?q=${encodeURIComponent(destination)}` }]
            : []),
          { label: product.title ?? 'Experience' },
        ]}
      />

      {/* Photo gallery */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: 'var(--surface-base)' }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-2 px-6 pt-8 md:grid-cols-3 md:gap-3 md:pt-12">
          {/* Hero photo - left 2 cols on desktop */}
          <div
            className="relative w-full overflow-hidden md:col-span-2"
            style={{
              aspectRatio: '4 / 3',
              borderRadius: '0.95rem',
              background: 'linear-gradient(140deg, #1a1f2a 0%, #3a4a5a 100%)',
            }}
          >
            {heroPhotos[0] ? (
              <Image
                src={heroPhotos[0]}
                alt={product.title ?? 'Experience'}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>

          {/* Two thumbnails stacked - right col on desktop */}
          <div className="hidden flex-col gap-3 md:flex">
            {[heroPhotos[1], heroPhotos[2]].map((url, i) => (
              <div
                key={url ?? i}
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio: '4 / 3',
                  borderRadius: '0.85rem',
                  background: 'linear-gradient(140deg, #1a1f2a 0%, #3a4a5a 100%)',
                  flex: 1,
                }}
              >
                {url ? (
                  <Image
                    src={url}
                    alt={`${product.title ?? 'Experience'} photo ${i + 2}`}
                    fill
                    sizes="33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-[1.6fr_1fr] md:gap-12 md:py-16">
        {/* Left column: narrative content */}
        <div className="flex flex-col gap-8">
          {/* Eyebrow + title */}
          <header className="flex flex-col gap-3">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.66rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                margin: 0,
              }}
            >
              {[durationLabel, exp.location.destination || 'Experience'].filter(Boolean).join(' · ')}
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: 'var(--ink-primary)',
                margin: 0,
              }}
            >
              {product.title ?? 'Experience'}
            </h1>
            {rating !== null ? (
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  color: 'var(--ink-secondary)',
                  margin: 0,
                }}
              >
                <strong style={{ fontWeight: 600 }}>{rating}</strong>{' '}
                <span style={{ color: 'var(--ink-tertiary)' }}>
                  from {formatReviewCount(exp.reviews.total)} travelers
                </span>
              </p>
            ) : null}
          </header>

          {/* Italic summary */}
          {exp.summary ? (
            <p
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '1.1rem',
                lineHeight: 1.55,
                color: 'var(--ink-secondary)',
                margin: 0,
                maxWidth: '40rem',
              }}
            >
              {exp.summary}
            </p>
          ) : null}

          {/* Full description */}
          {product.description ? (
            <Section title="About">
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontWeight: 300,
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  color: 'var(--ink-secondary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {product.description}
              </p>
            </Section>
          ) : null}

          {inclusions.length > 0 ? (
            <Section title="What's included">
              <BulletList items={inclusions} />
            </Section>
          ) : null}

          {exclusions.length > 0 ? (
            <Section title="What's not included">
              <BulletList items={exclusions} />
            </Section>
          ) : null}

          {additionalInfo.length > 0 ? (
            <Section title="Good to know">
              <BulletList items={additionalInfo.slice(0, 8)} />
            </Section>
          ) : null}

          {cancellationText ? (
            <Section title="Cancellation">
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontWeight: 300,
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  color: 'var(--ink-secondary)',
                  margin: 0,
                }}
              >
                {cancellationText}
              </p>
            </Section>
          ) : null}

          <AutoFaq product={product} experience={exp} />
        </div>

        {/* Right column: sticky reserve panel */}
        <aside>
          <div
            className="sticky top-24 flex flex-col gap-5 rounded-[18px] border p-6 md:p-7"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--elev-card)',
            }}
          >
            <div className="flex flex-col gap-1">
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                  margin: 0,
                }}
              >
                From
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: '1.85rem',
                  fontWeight: 400,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {exp.pricing.fromPerPerson > 0
                  ? formatPerPerson(exp.pricing.fromPerPerson, exp.pricing.currency)
                  : 'Quote on request'}
              </p>
              {exp.pricing.fromPerPerson > 0 ? (
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.78rem',
                    color: 'var(--ink-tertiary)',
                    margin: 0,
                  }}
                >
                  per person
                </p>
              ) : null}
            </div>

            <ReasoningChips experience={exp} max={4} size="md" />

            {durationLabel ? (
              <DataRow label="Duration" value={durationLabel} />
            ) : null}
            {exp.confirmation ? (
              <DataRow
                label="Confirmation"
                value={exp.confirmation === 'instant' ? 'Instant' : 'On request'}
              />
            ) : null}
            {exp.flags.includes('free-cancellation') ? (
              <DataRow label="Cancellation" value="Free" />
            ) : null}

            {reserveHref ? (
              <a
                href={reserveHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group inline-flex items-center justify-between gap-3 transition-all"
                style={{
                  marginTop: '0.6rem',
                  padding: '1rem 1.3rem',
                  borderRadius: '999px',
                  background: 'var(--accent-primary)',
                  color: '#1a1a1a',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {partnerCtaLabel('viator', 'reserve', { arrow: false })}
                <ArrowRight
                  size={15}
                  strokeWidth={2.4}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
            ) : (
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.78rem',
                  color: 'var(--ink-tertiary)',
                  margin: 0,
                }}
              >
                Not bookable through our partner right now.
              </p>
            )}

            <div
              className="flex items-center justify-between gap-2 border-t pt-3"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.65rem',
                  lineHeight: 1.55,
                  color: 'var(--ink-tertiary)',
                  margin: 0,
                }}
              >
                Affiliate link · same price as direct
              </p>
              <WhyViatorTooltip align="right" />
            </div>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </>
  );
}

// ============== Server-side helpers ==============

async function fetchProduct(productCode: string): Promise<ViatorProductDetail | null> {
  const client = viatorClientFromEnv();
  if (!client) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), 12_000);
  try {
    const product = await client.getProduct(productCode, controller.signal);
    return product;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickGalleryPhotos(product: ViatorProductDetail): string[] {
  const out: string[] = [];
  const images = product.images ?? [];
  const ordered = [
    ...images.filter((i) => i.isCover),
    ...images.filter((i) => !i.isCover),
  ];
  for (const img of ordered) {
    // Pick the widest variant available, capped at 1600px for SSR
    // bandwidth.
    const variants = img.variants ?? [];
    if (variants.length === 0) continue;
    const sorted = [...variants].sort((a, b) => b.width - a.width);
    const picked = sorted.find((v) => v.width <= 1600) ?? sorted[0];
    if (picked?.url) out.push(picked.url);
    if (out.length >= 3) break;
  }
  return out;
}

function pickHeroPhoto(product: ViatorProductDetail, targetWidth: number): string | null {
  const images = product.images ?? [];
  const cover = images.find((i) => i.isCover) ?? images[0];
  if (!cover) return null;
  const variants = [...(cover.variants ?? [])].sort((a, b) => a.width - b.width);
  for (const v of variants) {
    if (v.width >= targetWidth) return v.url;
  }
  return variants.at(-1)?.url ?? null;
}

function buildReserveHref(
  product: ViatorProductDetail,
  productCode: string,
): string | null {
  const url = product.productUrl;
  if (!url || url.length === 0) return null;
  if (!isAllowedAffiliateHost(url)) return null;
  const id = encodeAffiliateLink({
    url,
    providerId: 'viator',
    stayId: `viator-${productCode}`,
  });
  return `/r/${id}`;
}

// ============== Presentational sub-components ==============

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex list-none flex-col gap-2 pl-0">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontWeight: 300,
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: 'var(--ink-secondary)',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              minWidth: '0.4rem',
              height: '0.4rem',
              borderRadius: '999px',
              background: 'var(--accent-primary)',
              marginTop: '0.55rem',
              flexShrink: 0,
            }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-3 border-b py-2"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.62rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '0.92rem',
          fontWeight: 400,
          color: 'var(--ink-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
