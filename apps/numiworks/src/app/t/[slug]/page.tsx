import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidShareSlug } from '@lib/session/share-slug';
import { getSessionStore } from '@lib/session/factory';
import { SharedTripView } from '@/features/shared-trip/shared-trip-view';

/**
 * Public read-only view of a shared trip. The slug is unguessable
 * (95-bit entropy) - anyone with the URL can read; nobody can guess.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidShareSlug(slug)) {
    return { title: 'Trip not found · numiworks' };
  }
  const trip = await getSessionStore().getTripBySlug(slug);
  if (!trip) {
    return { title: 'Trip not found · numiworks' };
  }
  const summary = trip.proposalSummary;
  return {
    title: `${summary.heroStayName} in ${summary.destinationName} · numiworks`,
    description: trip.proposal.reasoning.summary,
  };
}

export default async function SharedTripPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isValidShareSlug(slug)) notFound();

  const trip = await getSessionStore().getTripBySlug(slug);
  if (!trip) notFound();

  return (
    <SharedTripView
      slug={slug}
      proposal={trip.proposal}
      intent={trip.intent}
      proposalSummary={trip.proposalSummary}
      bookmarkedAt={trip.bookmarkedAt}
    />
  );
}
