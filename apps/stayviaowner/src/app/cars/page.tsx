import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  // Retired vertical: stayviaowner is a Vrbo whole-home rental brand, so this
  // off-brand Expedia page is de-linked from nav + kept out of the index.
  robots: { index: false, follow: false },
  title: 'Car rentals · stayviaowner',
  description:
    'Rent a car at airports and city pick-up locations worldwide. Expedia Cars — full insurance options, free cancellation on most rentals.',
};

export default function CarsPage() {
  return (
    <CategoryLanding
      category="cars"
      heading="Car rentals — airport and city pick-up."
      subhead="Expedia Cars compares rates across every major rental company. Free cancellation on most bookings."
    />
  );
}
