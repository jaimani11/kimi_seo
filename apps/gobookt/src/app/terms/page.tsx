import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

export const metadata: Metadata = {
  title: 'Terms of Service · gobookt',
  description: 'The terms governing your use of gobookt.com.',
  alternates: { canonical: 'https://www.gobookt.com/terms' },
};

/**
 * Terms of Service. Public and indexable so platform-API reviews
 * and visitors can find it easily.
 */
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <header className="mb-10">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.66rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Gobookt
          </p>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            Terms of Service
          </h1>
          <p
            className="mt-4"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '1.05rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            The agreement between you and gobookt when you use this site.
          </p>
        </header>

        <Section title="1. About gobookt">
          <P>
            Gobookt is a travel-planning website that helps you discover destinations and book
            experiences through our partner Viator. We are an independent publisher and not an
            agent of any travel supplier.
          </P>
        </Section>

        <Section title="2. Acceptance of these terms">
          <P>
            By using{' '}
            <Link href="/" style={{ color: 'var(--accent-primary)' }}>
              gobookt.com
            </Link>
            , you agree to these Terms of Service and our{' '}
            <Link href="/privacy" style={{ color: 'var(--accent-primary)' }}>
              Privacy Policy
            </Link>
            . If you do not agree, please stop using the site.
          </P>
        </Section>

        <Section title="3. What you can do">
          <ul style={ulStyle}>
            <Li>Read our destination guides and itineraries.</Li>
            <Li>Use the AI concierge to plan a trip.</Li>
            <Li>Save trips for later reference.</Li>
            <Li>
              Click through to Booking.com to search for stays, flights, attractions, cars, and cruises. Bookings happen
              on the partner&apos;s site, on their terms.
            </Li>
            <Li>Share links to our pages with others.</Li>
          </ul>
        </Section>

        <Section title="4. What you can't do">
          <ul style={ulStyle}>
            <Li>Use the site to break the law, infringe rights, or harm others.</Li>
            <Li>
              Scrape, mass-download, or systematically copy the content for republication. Our
              destination guides, social-content packs, and AI-generated plans are protected by
              copyright.
            </Li>
            <Li>
              Reverse-engineer, decompile, or attempt to extract source code from the site or the
              AI concierge.
            </Li>
            <Li>
              Interfere with the site&apos;s operation — sending denial-of-service traffic,
              probing for vulnerabilities without permission, abusing API endpoints.
            </Li>
            <Li>Impersonate gobookt or its operators.</Li>
          </ul>
        </Section>

        <Section title="5. Bookings happen with partners">
          <P>
            When you click a &ldquo;Search on Booking.com&rdquo; or similar CTA, you leave gobookt
            and book with the partner directly. The partner&apos;s terms, cancellation policies,
            pricing, and refund rights govern the booking. We may earn an affiliate commission on
            bookings — the price you pay is the same as if you had visited the partner directly.
          </P>
        </Section>

        <Section title="6. Accuracy of content">
          <P>
            We try hard to keep destination guides, pricing ranges, and bookable-experience
            listings accurate, but information changes. We do not guarantee that any specific
            detail is current or complete. Confirm prices, availability, visa rules, safety
            advisories, and cancellation policies directly with the relevant partner or government
            authority before you travel.
          </P>
          <P>
            The AI concierge generates trip suggestions using a large language model. Its output
            can contain errors. Treat it as a starting point, not authoritative travel advice.
          </P>
        </Section>

        <Section title="7. Intellectual property">
          <P>
            Gobookt owns or licenses everything on this site (text, photos, illustrations,
            code, brand). You may quote short excerpts with attribution and link to our pages
            freely. Anything beyond that requires written permission.
          </P>
          <P>
            User-submitted content (your trip prompts, saved trips, messages) belongs to you. You
            grant us a limited license to display it back to you in your session and to use
            aggregated, anonymized data to improve our service.
          </P>
        </Section>

        <Section title="8. Service availability">
          <P>
            We may add, change, suspend, or discontinue any part of the site at any time. We will
            try to give reasonable notice for material changes. The site is provided
            &ldquo;as is&rdquo; without warranty of any kind, to the extent permitted by law.
          </P>
        </Section>

        <Section title="9. Disclaimer + limitation of liability">
          <P>
            To the maximum extent permitted by law, gobookt is not liable for indirect,
            incidental, special, consequential, or punitive damages arising from your use of the
            site, including lost profits, data, or travel costs. Our total liability for any
            claim arising out of the site is limited to USD 100.
          </P>
          <P>
            Some jurisdictions don&apos;t allow these limits, so they may not apply to you.
          </P>
        </Section>

        <Section title="10. Indemnification">
          <P>
            You agree to indemnify and hold gobookt harmless from any claim arising out of your
            misuse of the site or violation of these terms.
          </P>
        </Section>

        <Section title="11. Governing law">
          <P>
            These terms are governed by the laws of the United States. Disputes will be heard in
            the federal or state courts located in the State of California.
          </P>
        </Section>

        <Section title="12. Changes to these terms">
          <P>
            We may update these terms as the site evolves. The &ldquo;Last updated&rdquo; date
            below reflects the current version. Material changes will be flagged in a prominent
            banner for at least 30 days.
          </P>
        </Section>

        <Section title="13. Contact">
          <P>
            For questions about these terms, write to{' '}
            <a href="mailto:hello@gobookt.com" style={{ color: 'var(--accent-primary)' }}>
              hello@gobookt.com
            </a>
            .
          </P>
        </Section>

        <p
          className="mt-12"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: 'var(--ink-tertiary)',
            margin: 0,
          }}
        >
          Last updated: June 14, 2026
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

const ulStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  color: 'var(--ink-secondary)',
  paddingLeft: '1.2rem',
  margin: '0.75rem 0 0 0',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)',
          fontWeight: 400,
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          color: 'var(--ink-primary)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-3"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.95rem',
        lineHeight: 1.7,
        color: 'var(--ink-secondary)',
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ marginTop: '0.45rem' }}>{children}</li>;
}
