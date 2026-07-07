import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Hotels & stays · stayviaowner',
  description:
    'Search hotels, apartments, and vacation rentals across 175+ destinations. Expedia inventory, the price you pay is the same.',
};

export default function StaysPage() {
  return (
    <CategoryLanding
      category="hotels"
      heading="Stays — hotels, apartments, rentals."
      subhead="Search Expedia's full inventory of hotels, apart-hotels, vacation rentals, and resorts. Free cancellation on most stays."
    />
  );
}
