/**
 * @adored/portfolio-revenue — the private, first-party monetization &
 * measurement core for the portfolio.
 *
 * This top-level barrel exports ONLY the domain-neutral measurement layer:
 * the event taxonomy, the swappable sink abstraction, and the Measurement
 * fan-out. It must never gain a dependency on any travel provider
 * (Booking/Expedia/VRBO/Viator) — travel-specific monetization logic lives in
 * @adored/affiliate and the apps, on top of this core.
 */
export * from './events/taxonomy';
export * from './events/sink';
export * from './events/emit';
