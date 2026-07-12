import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canonicalUrl } from '@lib/site/origin';
import { resolveDestinationPhoto } from '@lib/imagery/destination-photo';
import { findAccommodationCategory } from '@lib/seo/accommodation-categories';
import { findCityBySlug } from '@lib/seo/cities';
import {
  AccommodationCategoryPage,
  buildAccommodationCategoryJsonLd,
} from '@/features/seo/accommodation-category-page';

const CATEGORY_SLUG = 'condos';

export async function generateMetadata(): Promise<Metadata> {
  const category = findAccommodationCategory(CATEGORY_SLUG);
  if (!category) return { robots: { index: false, follow: false } };
  const canonical = canonicalUrl(`/${CATEGORY_SLUG}`);
  const heroCity = findCityBySlug(category.topCitySlugs[0] ?? '');
  const ogPhoto = resolveDestinationPhoto({
    name: heroCity?.name ?? category.name,
    country: heroCity?.countryCode ?? 'IT',
  });
  const title = `${category.name} · gotript`;
  const description = category.intro.slice(0, 155);
  const images = [{ url: ogPhoto.url, width: 1200, height: 630, alt: category.name }];
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default function Page() {
  const category = findAccommodationCategory(CATEGORY_SLUG);
  if (!category) notFound();
  const canonical = canonicalUrl(`/${CATEGORY_SLUG}`);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: buildAccommodationCategoryJsonLd({ category, canonical }),
        }}
      />
      <AccommodationCategoryPage category={category} />
    </>
  );
}
