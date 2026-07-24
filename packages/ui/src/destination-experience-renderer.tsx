import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { DestinationExperience, SectionData } from '@adored/brand-experience';
import { haversineKm, distanceLabel } from '@adored/travel-tools';
import { ClimatePanel, type ClimateMonths } from './climate-panel';
import { LocalTimeStrip } from './local-time';
import { DestinationMap, type MapPin } from './destination-map';
import { WalkDistances } from './walk-distances';

/**
 * DestinationExperienceRenderer — the brand-AGNOSTIC renderer for a
 * DestinationExperience produced by @adored/brand-experience's planner.
 *
 * It knows nothing about brands: it maps the section vocabulary to UI, themed
 * per brand through CSS variables. App-specific widgets (a Booking.com search
 * widget, an AI concierge) come in through `slots`. The app keeps the page
 * wrapper (SeoPageShell) and any bottom hand-off (SmartStayOffer).
 */

export interface DestinationExperiencePresentation {
  cityName: string;
  photoUrl: string;
  photoAlt: string;
  center: { lat: number; lng: number };
  climate?: { tz: string; months: ClimateMonths } | null;
}

export interface DestinationExperienceSlots {
  /** Rendered inside the hero, below the subhead (e.g. gotript itinerary chips). */
  heroBelow?: ReactNode;
  /** Rendered between the hero and the sections (e.g. gobookt search widget card). */
  afterHero?: ReactNode;
  /** Rendered in place of an `ai-prompt` section (e.g. numiworks concierge). */
  aiPrompt?: ReactNode;
}

export interface DestinationExperienceRendererProps {
  experience: DestinationExperience;
  presentation: DestinationExperiencePresentation;
  slots?: DestinationExperienceSlots;
}

export function DestinationExperienceRenderer({
  experience,
  presentation,
  slots,
}: DestinationExperienceRendererProps) {
  const { hero } = experience;
  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ minHeight: '48vh' }}>
        <div className="absolute inset-0">
          <Image src={presentation.photoUrl} alt={presentation.photoAlt} fill priority sizes="100vw" style={{ objectFit: 'cover' }} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(8,10,14,0.32) 0%, rgba(8,10,14,0.55) 60%, rgba(8,10,14,0.85) 100%)' }}
          />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pt-24 pb-20 text-center md:pt-28 md:pb-24">
          <p style={heroEyebrow}>{hero.eyebrow}</p>
          <h1 className="mt-3" style={heroH1}>{hero.heading}</h1>
          <p className="mx-auto mt-5 max-w-2xl" style={heroSub}>{hero.subhead}</p>
          {slots?.heroBelow ? <div className="mt-7 flex flex-wrap items-center justify-center gap-2">{slots.heroBelow}</div> : null}
        </div>
      </section>

      {slots?.afterHero ?? null}

      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {experience.sections.map((s) => (
          <section key={s.id} style={{ margin: '0 0 3rem' }}>
            <p style={eyebrowStyle}>{s.eyebrow}</p>
            <h2 style={h2Style}>{s.heading}</h2>
            {renderSection(s.data, presentation, slots)}
          </section>
        ))}
        {experience.crossLinks.length ? (
          <section style={{ margin: '0 0 3rem' }}>
            <p style={eyebrowStyle}>Related</p>
            <h2 style={h2Style}>{experience.crossLinksHeading}</h2>
            <ul style={{ ...listStyle, gap: '0.5rem' }}>
              {experience.crossLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} style={relatedLinkStyle}>{l.label} →</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </>
  );
}

function renderSection(data: SectionData, p: DestinationExperiencePresentation, slots?: DestinationExperienceSlots): ReactNode {
  switch (data.kind) {
    case 'climate':
      return (
        <>
          {p.climate ? <LocalTimeStrip cityName={p.cityName} tz={p.climate.tz} lat={p.center.lat} lng={p.center.lng} /> : null}
          {data.intro ? <p style={paragraphStyle}>{data.intro}</p> : null}
          {p.climate ? <ClimatePanel cityName={p.cityName} months={p.climate.months} /> : null}
        </>
      );
    case 'area-cards':
      return (
        <>
          {data.intro ? <p style={paragraphStyle}>{data.intro}</p> : null}
          <ul style={{ ...listStyle, gap: '0.75rem' }}>
            {data.areas.map((a) => (
              <li key={a.name} style={areaCardStyle}>
                <div>
                  <p style={areaNameStyle}>{a.name}</p>
                  <p style={areaBlurbStyle}>{a.blurb}</p>
                </div>
                {a.href ? (
                  <a href={a.href} rel="sponsored nofollow noopener noreferrer" style={areaCtaStyle}>{a.ctaLabel} →</a>
                ) : (
                  <span style={areaUnavailStyle}>Search temporarily unavailable</span>
                )}
              </li>
            ))}
          </ul>
        </>
      );
    case 'compare-map': {
      const pins: MapPin[] = data.pins.map((pin) => ({
        lat: pin.lat,
        lng: pin.lng,
        label: pin.name,
        kind: pin.kind,
        detail: distanceLabel(haversineKm(p.center, { lat: pin.lat, lng: pin.lng })),
        ...(pin.href ? { href: pin.href } : {}),
        ...(pin.ctaLabel ? { ctaLabel: pin.ctaLabel } : {}),
      }));
      return (
        <>
          {data.intro ? <p style={paragraphStyle}>{data.intro}</p> : null}
          <DestinationMap cityName={p.cityName} center={p.center} pins={pins} />
          <WalkDistances items={pins.filter((x) => x.detail).map((x) => ({ name: x.label, kind: x.kind, label: x.detail ?? '' }))} />
        </>
      );
    }
    case 'chip-grid':
      return (
        <>
          {data.intro ? <p style={paragraphStyle}>{data.intro}</p> : null}
          <ul style={typeGridStyle}>
            {data.chips.map((c) => (
              <li key={c.label} style={typeCardStyle}>
                <p style={typeLabelStyle}>{c.label}</p>
                <p style={typeNoteStyle}>{c.note}</p>
              </li>
            ))}
          </ul>
        </>
      );
    case 'profile-list':
      return (
        <ul style={listStyle}>
          {data.items.map((it) => (
            <li key={it.label} style={listItemStyle}>
              <strong style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>{it.label}.</strong> {it.text}
            </li>
          ))}
        </ul>
      );
    case 'itinerary-links':
      return (
        <>
          {data.intro ? <p style={paragraphStyle}>{data.intro}</p> : null}
          <ul style={itineraryRow}>
            {data.options.map((o) => (
              <li key={o.days}><Link href={o.href} style={itineraryChip}>{o.label} →</Link></li>
            ))}
          </ul>
        </>
      );
    case 'decision-card':
      return (
        <>
          {data.intro ? <p style={paragraphStyle}>{data.intro}</p> : null}
          {data.options.map((o) => (
            <div key={o.title} style={decisionCard}>
              <div>
                <p style={decisionTitle}>{o.title}</p>
                <p style={decisionNote}>{o.note}</p>
              </div>
              {o.href ? (
                <a href={o.href} rel="sponsored nofollow noopener noreferrer" style={decisionCta}>{o.ctaLabel} →</a>
              ) : (
                <span style={areaUnavailStyle}>Temporarily unavailable</span>
              )}
            </div>
          ))}
        </>
      );
    case 'prose':
      return <>{data.paragraphs.map((para, i) => <p key={i} style={paragraphStyle}>{para}</p>)}</>;
    case 'cta-list':
      return (
        <ul style={{ ...listStyle, gap: '0.5rem' }}>
          {data.links.map((l) => (
            <li key={l.href}><Link href={l.href} style={relatedLinkStyle}>{l.label} →</Link></li>
          ))}
        </ul>
      );
    case 'ai-prompt':
      return slots?.aiPrompt ?? null;
    default:
      return null;
  }
}

const heroEyebrow: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', fontWeight: 700, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.6)' };
const heroH1: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: 'clamp(2.4rem, 5.4vw, 4rem)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.025em', color: '#ffffff', margin: 0, textShadow: '0 2px 14px rgba(0,0,0,0.55)' };
const heroSub: CSSProperties = { fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1rem, 1.6vw, 1.2rem)', lineHeight: 1.55, color: 'rgba(255,255,255,0.95)', margin: '1.25rem auto 0', textShadow: '0 1px 6px rgba(0,0,0,0.55)' };
const eyebrowStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.66rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 700, margin: 0 };
const h2Style: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--ink-primary)', margin: '0.4rem 0 1rem' };
const paragraphStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--ink-secondary)', margin: '0 0 0.8rem' };
const listStyle: CSSProperties = { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' };
const listItemStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1.02rem', lineHeight: 1.6, color: 'var(--ink-secondary)' };
const areaCardStyle: CSSProperties = { listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1.1rem', borderRadius: '0.85rem', background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)' };
const areaNameStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, color: 'var(--ink-primary)', margin: 0 };
const areaBlurbStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--ink-secondary)', margin: '0.2rem 0 0' };
const areaCtaStyle: CSSProperties = { flexShrink: 0, fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', padding: '0.5rem 0.9rem', borderRadius: '999px', background: 'var(--accent-primary)', color: '#ffffff', textDecoration: 'none' };
const areaUnavailStyle: CSSProperties = { flexShrink: 0, fontFamily: 'var(--font-inter)', fontSize: '0.76rem', color: 'var(--ink-tertiary)', fontStyle: 'italic' };
const typeGridStyle: CSSProperties = { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' };
const typeCardStyle: CSSProperties = { padding: '0.85rem 1rem', borderRadius: '0.75rem', background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)' };
const typeLabelStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.92rem', fontWeight: 800, color: 'var(--ink-primary)', margin: 0 };
const typeNoteStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--ink-secondary)', margin: '0.25rem 0 0' };
const itineraryRow: CSSProperties = { listStyle: 'none', padding: 0, margin: '0.5rem 0 0', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' };
const itineraryChip: CSSProperties = { display: 'inline-flex', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 700, padding: '0.55rem 1rem', borderRadius: '999px', background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--accent-primary)', textDecoration: 'none' };
const decisionCard: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.15rem', borderRadius: '0.85rem', background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', marginTop: '0.5rem' };
const decisionTitle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 800, color: 'var(--ink-primary)', margin: 0 };
const decisionNote: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--ink-secondary)', margin: '0.2rem 0 0' };
const decisionCta: CSSProperties = { flexShrink: 0, fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', padding: '0.5rem 0.9rem', borderRadius: '999px', background: 'var(--accent-primary)', color: '#ffffff', textDecoration: 'none' };
const relatedLinkStyle: CSSProperties = { fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none' };
