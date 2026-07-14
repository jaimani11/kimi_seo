import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/features/site/site-header';
import { SiteFooter } from '@/features/site/site-footer';

export const metadata: Metadata = {
  title: 'Privacy Policy · gobookt',
  description:
    'How gobookt collects, uses, and shares information when you use our travel-planning service.',
  alternates: { canonical: 'https://gobookt.com/privacy' },
};

/**
 * Privacy Policy.
 *
 * Public, indexable, plain-language. Written to satisfy the
 * disclosure requirements of platform-API reviews (Pinterest,
 * Instagram/Meta, TikTok) and to be honest with visitors about
 * what gobookt actually does with their data.
 *
 * Updated whenever the underlying behavior changes — see "Last
 * updated" at the bottom.
 */
export default function PrivacyPolicyPage() {
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
            Privacy Policy
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
            What we collect, how we use it, who we share it with, and what you can do about it.
          </p>
        </header>

        <Section title="1. Who we are">
          <P>
            Gobookt (&ldquo;gobookt&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the
            travel-planning website at{' '}
            <Link href="/" style={{ color: 'var(--accent-primary)' }}>
              gobookt.com
            </Link>
            . We help travelers discover destinations, plan trips, and book bookable experiences
            through our partner Viator.
          </P>
        </Section>

        <Section title="2. Information we collect">
          <H>Information you give us</H>
          <P>
            When you use the AI concierge, type a search, save a trip, or contact us, you provide
            the text of those messages and any trip preferences you choose to share (destination,
            dates, party size, vibe tags). When you sign in (if available), you provide an email
            address.
          </P>
          <H>Information collected automatically</H>
          <ul style={ulStyle}>
            <Li>
              <strong>Session cookie.</strong> A first-party cookie storing a random anonymous
              session id so we can remember the trips you save during a visit, even before you
              sign in.
            </Li>
            <Li>
              <strong>Funnel events.</strong> When you view an experience, run a search, see an
              AI recommendation, or save a trip, we record a small event in our server-side
              database — bound to your session id (not your name or email). This lets us see
              which features people use without tracking you across other sites.
            </Li>
            <Li>
              <strong>Affiliate click log.</strong> When you click a &ldquo;Search on Booking.com&rdquo;
              or destination CTA, we record that the click happened (session id, partner id, the
              experience or destination clicked, timestamp) so we can confirm commission attribution
              with our partners.
            </Li>
            <Li>
              <strong>Standard request metadata.</strong> Like every website, our hosting provider
              receives your IP address, browser type, and the page you requested. We use this for
              security and aggregate reporting only.
            </Li>
          </ul>
          <H>What we do NOT collect</H>
          <P>
            We do not sell your data. We do not run third-party advertising trackers, pixel
            networks, retargeting cookies, or social-media pixels on our pages. We do not collect
            biometric data, precise GPS coordinates, or payment information (Viator handles all
            bookings on their own site).
          </P>
        </Section>

        <Section title="3. How we use information">
          <ul style={ulStyle}>
            <Li>To run the AI concierge, plan trips, and remember what you saved.</Li>
            <Li>
              To improve our content — anonymized event data tells us which destinations and
              experiences are most useful so we can build better guides.
            </Li>
            <Li>
              To attribute affiliate commission to the correct click when you book through a
              partner.
            </Li>
            <Li>To detect abuse and keep the site available.</Li>
            <Li>
              To respond to you if you contact us, with the message and email you sent us.
            </Li>
          </ul>
          <P>
            We do not use your information to train third-party machine-learning models, and we do
            not sell or rent your information to anyone.
          </P>
        </Section>

        <Section title="4. Third parties we share with">
          <P>
            We share the minimum information needed with a small number of specialist providers
            who help us run the site. Each is bound by their own privacy commitments.
          </P>
          <ul style={ulStyle}>
            <Li>
              <strong>Viator (Tripadvisor).</strong> When you click a Viator product link, you are
              taken to Viator&apos;s website and they receive standard click + browser metadata
              under their own privacy policy. We do not share your gobookt account information
              with them.
            </Li>
            <Li>
              <strong>Anthropic.</strong> The AI concierge sends your trip prompt to Anthropic to
              generate the travel plan. Anthropic processes the text under their published
              data-processing terms and does not train models on this traffic.
            </Li>
            <Li>
              <strong>Hosting + infrastructure (Vercel).</strong> Our website is served by Vercel,
              who receives standard server-request metadata to deliver pages and protect against
              abuse.
            </Li>
            <Li>
              <strong>Social platforms (Pinterest, Instagram, TikTok).</strong> We post content we
              generate ourselves to these platforms. We do not embed Pinterest, Instagram, or TikTok
              trackers on our pages, and clicking a gobookt link on those platforms simply opens
              our website with a UTM query string — no personal data is shared either direction.
            </Li>
            <Li>
              <strong>Analytics (optional).</strong> If we enable Plausible or Google Analytics 4
              in the future, that integration will be cookieless (Plausible) or aggregated (GA4)
              and disclosed here before it goes live.
            </Li>
          </ul>
        </Section>

        <Section title="5. How long we keep your data">
          <ul style={ulStyle}>
            <Li>
              <strong>Session cookies</strong> expire after 30 days of inactivity. Clearing your
              browser cookies removes them immediately.
            </Li>
            <Li>
              <strong>Funnel events + affiliate click logs</strong> are kept for up to 24 months
              for product analytics and partner reconciliation, then deleted.
            </Li>
            <Li>
              <strong>Saved trips</strong> tied to an anonymous session disappear when the session
              cookie expires. Trips tied to a signed-in account remain until you delete them or
              delete the account.
            </Li>
            <Li>
              <strong>Messages you send us</strong> are kept for as long as needed to respond and
              to handle any follow-up, then archived per standard retention.
            </Li>
          </ul>
        </Section>

        <Section title="6. Your choices and rights">
          <ul style={ulStyle}>
            <Li>
              <strong>Access + delete.</strong> Email us at the address below and we will provide
              a copy of the data we hold tied to your account or session, or delete it.
            </Li>
            <Li>
              <strong>Clear your session.</strong> Clearing cookies in your browser deletes your
              anonymous session immediately.
            </Li>
            <Li>
              <strong>Opt out of analytics events.</strong> Browser-side &ldquo;Do Not Track&rdquo;
              signals are respected. We also do not record events when the page is opened with a
              <code style={codeStyle}>?analytics=off</code> query string.
            </Li>
            <Li>
              <strong>EU + UK visitors.</strong> You have the rights described in GDPR / UK GDPR
              (access, rectification, deletion, restriction, portability, objection). Contact us
              and we will fulfill verifiable requests within 30 days.
            </Li>
            <Li>
              <strong>California visitors.</strong> You have the rights described in the CCPA /
              CPRA. We do not sell or share your personal information.
            </Li>
          </ul>
        </Section>

        <Section title="7. Children">
          <P>
            Gobookt is not directed at children under 13 (or under 16 in the EU). We do not
            knowingly collect personal information from children. If you believe a child has
            provided us information, contact us and we will delete it.
          </P>
        </Section>

        <Section title="8. Security">
          <P>
            We use HTTPS everywhere, store secrets only in encrypted environment variables, and
            keep affiliate-click and event logs on our hosting provider&apos;s infrastructure
            behind their security controls. No system is perfectly secure; if you discover a
            vulnerability, please contact us responsibly.
          </P>
        </Section>

        <Section title="9. International transfers">
          <P>
            Gobookt is operated globally and your data may be processed in the United States,
            the European Union, or wherever our service providers (above) operate. Where required
            by law, we use the standard contractual clauses or equivalent safeguards.
          </P>
        </Section>

        <Section title="10. Changes to this policy">
          <P>
            We may update this policy as the site evolves. The &ldquo;Last updated&rdquo; date
            below always reflects the current version. Material changes will be flagged in a
            prominent banner on the site for at least 30 days.
          </P>
        </Section>

        <Section title="11. Contact">
          <P>
            For privacy questions, data requests, or anything else, write to{' '}
            <a
              href="mailto:privacy@gobookt.com"
              style={{ color: 'var(--accent-primary)' }}
            >
              privacy@gobookt.com
            </a>
            . We aim to reply within 5 business days.
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

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)',
  fontSize: '0.85em',
  background: 'var(--surface-elevated)',
  padding: '0.1rem 0.35rem',
  borderRadius: '0.25rem',
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

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mt-5"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.75rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: 'var(--ink-tertiary)',
        margin: 0,
      }}
    >
      {children}
    </h3>
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
