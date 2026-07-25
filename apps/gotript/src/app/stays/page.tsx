import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Hotels & stays · gotript',
  description:
    'Search hotels, apartments, and vacation rentals worldwide. Searches hand off to Expedia.',
};

export default function StaysPage() {
  return (
    <CategoryLanding
      category="hotels"
      heading="Stays — hotels, apartments, rentals."
      subhead="Search Expedia's full inventory of hotels, apart-hotels, vacation rentals, and resorts. Refundable rates are labelled per property."
    />
  );
}
