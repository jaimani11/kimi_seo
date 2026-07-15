import { describe, expect, it } from 'vitest';
import { decorateOutboundUrl } from '@/lib/affiliate/decorate-outbound';

describe('decorateOutboundUrl', () => {
  it('appends utm_source, utm_medium, and utm_campaign', () => {
    const out = decorateOutboundUrl('https://www.viator.com/searchResults/all?text=Rome', {
      campaign: 'viator',
    });
    expect(out).toContain('utm_source=stayviaowner');
    expect(out).toContain('utm_medium=affiliate');
    expect(out).toContain('utm_campaign=viator');
  });

  it('appends utm_content and dpl_turn when provided', () => {
    const out = decorateOutboundUrl('https://www.viator.com/x', {
      campaign: 'rail',
      content: 'viator:12345P1',
      turnId: 't_abc',
    });
    expect(out).toContain('utm_content=viator%3A12345P1');
    expect(out).toContain('dpl_turn=t_abc');
  });

  it('preserves partner-set tracking params (does not overwrite)', () => {
    const out = decorateOutboundUrl(
      'https://www.viator.com/x?pid=PARTNER&utm_source=partner-thing',
      { campaign: 'viator' },
    );
    expect(out).toContain('pid=PARTNER');
    // Partner's own utm_source must not be clobbered.
    expect(out).toContain('utm_source=partner-thing');
    expect(out).not.toContain('utm_source=stayviaowner');
  });

  it('returns the input unchanged when the URL is unparseable', () => {
    expect(decorateOutboundUrl('not-a-url', { campaign: 'viator' })).toBe('not-a-url');
  });

  it('always overwrites dpl_turn (it is stayviaowner-private)', () => {
    const out = decorateOutboundUrl('https://www.viator.com/x?dpl_turn=stale', {
      campaign: 'viator',
      turnId: 't_fresh',
    });
    expect(out).toContain('dpl_turn=t_fresh');
    expect(out).not.toContain('dpl_turn=stale');
  });
});
