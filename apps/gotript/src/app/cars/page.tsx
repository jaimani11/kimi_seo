import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Car rentals · gotript',
  description:
    'Rent a car at airports and city pick-up locations worldwide. Expedia Cars — full insurance options at the counter.',
};

export default function CarsPage() {
  return (
    <CategoryLanding
      category="cars"
      heading="Car rentals — airport and city pick-up."
      subhead="Expedia Cars compares rates across every major rental company."
    />
  );
}
