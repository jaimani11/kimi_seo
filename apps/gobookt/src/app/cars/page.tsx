import type { Metadata } from 'next';
import { CategoryLanding } from '@/features/site/category-landing';

export const metadata: Metadata = {
  title: 'Car rentals · gobookt',
  description:
    'Rent a car at airports and city pick-up locations worldwide. Booking.com Cars — full insurance options.',
};

export default function CarsPage() {
  return (
    <CategoryLanding
      category="cars"
      heading="Car rentals — airport and city pick-up."
      subhead="Booking.com Cars compares rates across every major rental company.."
    />
  );
}
