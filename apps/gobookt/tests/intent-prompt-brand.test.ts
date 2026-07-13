import { describe, expect, it } from 'vitest';
import { INTENT_SYSTEM_PROMPT } from '@lib/ai/prompts/intent-system';

/**
 * The live AI intent prompt must identify this deployment by its own
 * brand — not the internal "StayScout" codename (a brand-misID fixed as
 * a branding quick win). Guards against the codename regressing back in.
 */
describe('intent prompt brand identity', () => {
  it('names this site’s real brand (gobookt)', () => {
    expect(INTENT_SYSTEM_PROMPT).toContain('gobookt');
  });

  it('never uses the internal StayScout codename', () => {
    expect(INTENT_SYSTEM_PROMPT).not.toContain('StayScout');
  });
});
