import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';
import { BookingStaySearchCard } from '@/features/site/booking-stay-search-card';
import { PopularDestinationsGrid } from '@/features/site/popular-destinations-grid';
import type { BookingComCategory } from '@lib/affiliate/booking-com-multicategory';

interface CategoryLandingProps {
  category: BookingComCategory;
  heading: string;
  subhead: string;
  destinationsSubhead?: string;
}

const HERO_BG = 'linear-gradient(135deg, #003580 0%, #006ce4 100%)';

/**
 * Shared shell for the vertical hub pages (/stays, /flights, /things-to-do,
 * /cars). Every hub leads with the tracked Booking.com stays WIDGET.
 *
 * Why not the old multi-tab search form: Booking's affiliate widget is
 * accommodation-only, and it's the only search that deep-links + tracks — the
 * previous multi-vertical form posted to /api/go/booking and only ever reached
 * the Booking HOMEPAGE for every category. gobookt is a Booking.com stays
 * specialist, so each hub keeps its own category H1 (for SEO/intent) and puts
 * the working, tracked stay search underneath — the stays hub gets a real
 * search; the flights/cars/attractions hubs cross-sell a stay like the per-city
 * vertical pages do.
 */
export function CategoryLanding({ category, heading, subhead }: CategoryLandingProps) {
  const isStays = category === 'hotels';
  const widgetHeading = isStays
    ? 'Search stays on Booking.com'
    : 'Planning your trip? Book your stay on Booking.com';

  return (
    <>
      <SiteHeader />
      <section
        className="relative w-full overflow-hidden"
        style={{ background: HERO_BG, color: '#ffffff' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 70% at 80% 20%, rgba(255,255,255,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 10% 90%, rgba(255,255,255,0.06) 0%, transparent 60%)',
          }}
        />
        <div
          className="relative mx-auto flex flex-col items-center justify-center text-center"
          style={{ maxWidth: '72rem', padding: '4.5rem 1.5rem 5.5rem' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              margin: 0,
              maxWidth: '52rem',
            }}
          >
            {heading}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 400,
              fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.96)',
              margin: '1.25rem auto 0',
              maxWidth: '46rem',
            }}
          >
            {subhead}
          </p>
          <div style={{ width: '100%', maxWidth: '60rem', margin: '2.25rem auto 0' }}>
            <BookingStaySearchCard heading={widgetHeading} />
          </div>
        </div>
      </section>
      <PopularDestinationsGrid />
      <SiteFooter />
    </>
  );
}
