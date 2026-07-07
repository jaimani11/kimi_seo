import type { Metadata } from 'next';
import { CruisesLanding } from '@/features/site/cruises-landing';

export const metadata: Metadata = {
  title: 'Cruises — Mediterranean, Caribbean, Alaska & more · gobookt',
  description:
    'River, ocean, and expedition cruises across every major line — Royal Caribbean, MSC, Carnival, NCL, Princess, Disney, Virgin. Mediterranean, Caribbean, Alaska, Norwegian fjords, Asia. Powered by Booking.com Cruises.',
};

export default function CruisesPage() {
  return <CruisesLanding />;
}
