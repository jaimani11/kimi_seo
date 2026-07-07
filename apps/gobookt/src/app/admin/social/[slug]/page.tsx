import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@lib/admin/require-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { findCityBySlug } from '@lib/seo/cities';
import { generateCitySocialPack } from '@lib/social/generator';
import { SocialPackView } from '@/features/admin/social-pack-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = findCityBySlug(slug);
  return {
    title: city ? `${city.name} social pack · Admin · gobookt` : 'Social · Admin · gobookt',
  };
}

export default async function AdminSocialCityPage({ params }: PageProps) {
  await requireAdmin();
  const { slug } = await params;
  const city = findCityBySlug(slug);
  if (!city) notFound();

  // Server-render the pack so the admin sees ready-to-copy content
  // immediately. Client can re-fetch via POST /api/social/generate
  // for an LLM regeneration.
  const pack = await generateCitySocialPack(city);

  return (
    <AdminShell
      section="social"
      title={`${city.name} social pack`}
      subtitle={`${city.countryName} · 10 × Pinterest + 10 × TikTok + 10 × Reels + 10 × Shorts · source: ${pack.source}`}
    >
      <SocialPackView pack={pack} citySlug={city.slug} />
    </AdminShell>
  );
}
