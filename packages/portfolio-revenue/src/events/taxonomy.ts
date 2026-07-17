/**
 * Portfolio Revenue Engine — domain-neutral event taxonomy.
 *
 * Single source of truth for the events + dimensions the measurement core
 * understands. This module is DOMAIN-NEUTRAL by contract: it must never
 * reference Booking.com / Expedia / VRBO / Viator or any travel concept.
 * Future owned products (FintraHub, LyraMind, BioSense) emit the SAME event
 * shape with their own names — travel is simply the first adapter on top of it.
 *
 * Privacy: dimensions carry NO PII — no names, emails, IPs, or precise geo.
 * Only coarse, anonymous attributes needed to attribute revenue.
 */

/**
 * Canonical event names emitted across the portfolio. Travel Phase 1 uses the
 * universal-lifecycle + handoff subset; other products reserve the conversion
 * names and add their own domain events later.
 */
export type PortfolioEventName =
  // Universal lifecycle
  | 'page_view'
  | 'cta_viewed'
  | 'cta_clicked'
  // Outbound / affiliate handoff (travel Phase 1)
  | 'handoff_started'
  | 'handoff_failed'
  // Conversion (populated later by reconciliation / product adapters)
  | 'conversion_reported'
  | 'conversion_confirmed'
  | 'conversion_cancelled'
  // Experimentation (name reserved; build deferred until traffic)
  | 'experiment_exposure';

/**
 * Domain-neutral dimensions attached to every event. All optional — an adapter
 * sets only what it has. Values are constrained to GA4-friendly scalars so any
 * sink (GA4, logs, a future DB) can persist them without transformation.
 */
export interface PortfolioEventDimensions {
  /** The owned property that emitted this (e.g. 'gotript', 'fintrahub'). */
  brand?: string;
  /** Page path the interaction happened on (path only — never a query with PII). */
  page?: string;
  /** Coarse page family for grouping (e.g. 'rentals', 'itinerary', 'pricing'). */
  pageFamily?: string;
  /** Where on the page (e.g. 'inline-card', 'hero', 'end-of-article'). */
  placement?: string;
  /** Outbound partner key, domain-neutral string (e.g. 'expedia', 'vrbo'). */
  provider?: string;
  /** Attribution network, domain-neutral string (e.g. 'partnerize', 'cj'). */
  network?: string;
  /** Free-form subject the event is about (e.g. a destination, a plan tier). */
  subject?: string;
  /** ISO YYYY-MM-DD when the interaction carries a date range. */
  startDate?: string;
  endDate?: string;
  /** Anonymous session id (no PII). */
  sessionId?: string;
  /** Per-interaction click id — the join key to a downstream conversion. */
  clickId?: string;
  /** Experiment + variant when the event happened under a test. */
  experiment?: string;
  variant?: string;
  /** Coarse device class: 'mobile' | 'desktop' | 'tablet'. */
  device?: string;
  /** Traffic source when known (e.g. 'organic', 'pinterest'). */
  source?: string;
}

/** A fully-formed event ready for a sink. */
export interface PortfolioEvent {
  name: PortfolioEventName;
  dimensions: PortfolioEventDimensions;
  /** Unix epoch ms. Stamped by the emitter (callers may pass a fixed value in
   *  tests for determinism). */
  at: number;
}
