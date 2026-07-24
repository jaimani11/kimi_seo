import type { Metadata } from 'next';
import { canonicalUrl } from '@lib/site/origin';
import { CategoryLanding } from '@/features/site/category-landing';

// /stays is a thin Booking.com "find a place to stay" landing that overlaps
// the home (also a stays-search surface) — the one real duplicate cluster on
// gobookt. Point its canonical at the home so Google consolidates the pair
// onto `/` instead of choosing /stays over the home ("Duplicate, Google chose
// a different canonical"). The home is now the primary stays surface.
export const metadata: Metadata = {
  title: 'Hotels & stays · gobookt',
  description:
    'Search hotels, apartments, and vacation rentals worldwide. Powered by Booking.com.',
  alternates: { canonical: canonicalUrl('/') },
};

export default function StaysPage() {
  return (
    <CategoryLanding
      category="hotels"
      heading="Stays — hotels, apartments, rentals."
      subhead="Search Booking.com's full inventory of hotels, apart-hotels, vacation rentals, and resorts."
    />
  );
}
