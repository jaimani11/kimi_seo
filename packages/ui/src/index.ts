/**
 * @adored/ui — shared UI primitives + brand theming tokens.
 *
 * Deliberately small: brands diverge visually BY DESIGN (stayviaowner's
 * navy/mint RentByOwner look vs the Booking-blue trio). Components move
 * here only when they are provably brand-neutral. Brand-specific look
 * comes in via the CSS variables emitted by brandCssVars(brand).
 *
 * Deliberately NOT here (and why):
 *   seo-page-shell — imports each brand's SiteHeader/SiteFooter
 *   auto-faq       — typed against app-local core/experience + Viator
 *                    provider types (extract after core types move)
 *   heroes/nav     — the brand identity itself
 */
export type { BrandCssVars } from './theme';
export { brandCssVars } from './theme';
export type { BreadcrumbItem } from './breadcrumbs';
export { Breadcrumbs } from './breadcrumbs';
