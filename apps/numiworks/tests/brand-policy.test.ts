import { describe, expect, it } from 'vitest';
import { assertBrandProvider, brandAllowsProvider } from '@adored/affiliate';

describe('brand-policy guard (Portfolio Revenue Engine)', () => {
  it('allows each brand its declared providers', () => {
    expect(brandAllowsProvider('gobookt', 'booking')).toBe(true);
    expect(brandAllowsProvider('gotript', 'expedia')).toBe(true);
    expect(brandAllowsProvider('gotript', 'vrbo')).toBe(true);
    expect(brandAllowsProvider('numiworks', 'viator')).toBe(true);
    expect(brandAllowsProvider('numiworks', 'vrbo')).toBe(true);
    expect(brandAllowsProvider('stayviaowner', 'vrbo')).toBe(true);
  });

  it('blocks cross-brand / cross-network leakage and fails closed', () => {
    // Booking-only brand must never emit Expedia/VRBO/Viator
    expect(brandAllowsProvider('gobookt', 'expedia')).toBe(false);
    expect(brandAllowsProvider('gobookt', 'vrbo')).toBe(false);
    expect(brandAllowsProvider('gobookt', 'viator')).toBe(false);
    // Viator/VRBO brand must never route to Booking
    expect(brandAllowsProvider('numiworks', 'booking')).toBe(false);
    // gotript is not approved for Booking
    expect(brandAllowsProvider('gotript', 'booking')).toBe(false);

    expect(() => assertBrandProvider('gobookt', 'expedia')).toThrow(/Brand-policy violation/);
    expect(() => assertBrandProvider('numiworks', 'booking')).toThrow(/may not monetize/);
  });

  it('fails closed for an unknown brand', () => {
    expect(brandAllowsProvider('nonexistent', 'expedia')).toBe(false);
    expect(() => assertBrandProvider('nonexistent', 'expedia')).toThrow(/unknown brand/);
  });
});
