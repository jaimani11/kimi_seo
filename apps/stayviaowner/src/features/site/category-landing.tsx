import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { MultiCategoryHero } from '@/features/site/multi-category-hero';
import { PopularDestinationsGrid } from '@/features/site/popular-destinations-grid';
import type { ExpediaCategory } from '@lib/affiliate/expedia-multicategory';

interface CategoryLandingProps {
  category: ExpediaCategory;
  heading: string;
  subhead: string;
  destinationsSubhead?: string;
}

/**
 * Shared shell for the 5 vertical landing pages (/stays, /flights,
 * /things-to-do, /cars, /cruises). All five reuse the same hero
 * search, with the active category pre-selected via the search
 * form's initial state. SEO surface lives in the per-route page.tsx.
 */
export function CategoryLanding({
  category,
  heading,
  subhead,
}: CategoryLandingProps) {
  return (
    <>
      <SiteHeader />
      <MultiCategoryHero initialCategory={category} />
      <section className="mx-auto max-w-5xl px-6 py-14">
        <header className="mx-auto max-w-3xl text-center">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Gotript
          </p>
          <h2
            className="mt-3"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(1.8rem, 3.6vw, 2.8rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {heading}
          </h2>
          <p
            className="mt-4"
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 400,
              fontSize: '1.05rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            {subhead}
          </p>
        </header>
      </section>
      <PopularDestinationsGrid />
      <SiteFooter />
    </>
  );
}
