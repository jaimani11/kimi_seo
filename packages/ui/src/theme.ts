import type { BrandConfig } from '@adored/brand-config';

/**
 * Brand theming tokens — the bridge between BrandConfig.colors and
 * component styling.
 *
 * Components in @adored/ui never hardcode brand colors; they read
 * CSS custom properties. Apps inject them once (e.g. on <html> or a
 * top-level wrapper) via `brandCssVars(brand)`:
 *
 *   <div style={brandCssVars(BRAND)}>...</div>
 *
 * This is the contract that lets visually-divergent brands (navy/mint
 * stayviaowner vs Booking-blue trio) share components without
 * flattening their identities.
 */
export interface BrandCssVars {
  '--brand-primary': string;
  '--brand-secondary': string;
  '--brand-header': string;
  [key: `--${string}`]: string;
}

export function brandCssVars(brand: BrandConfig): BrandCssVars {
  return {
    '--brand-primary': brand.colors.primary,
    '--brand-secondary': brand.colors.secondary,
    '--brand-header': brand.colors.header,
  };
}
