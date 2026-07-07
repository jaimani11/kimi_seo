import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Hotels & stays · gobookt',
  description:
    'Search hotels, apartments, and vacation rentals across 175+ destinations. Booking.com inventory, the price you pay is the same.',
};

export default function StaysPage() {
  return (
    <CategoryLanding
      category="hotels"
      heading="Stays — hotels, apartments, rentals."
      subhead="Search Booking.com's full inventory of hotels, apart-hotels, vacation rentals, and resorts. Free cancellation on most stays."
    />
  );
}
