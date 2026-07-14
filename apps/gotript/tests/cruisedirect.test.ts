import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cruiseDirectEnabled,
  cruiseDirectPid,
  resolveCruiseDirectUrl,
  describeCruiseDirectUrl,
} from '@adored/affiliate';

afterEach(() => vi.unstubAllEnvs());

const GOTRIPT_EVERGREEN = 'https://www.tkqlhce.com/click-101803920-15734200';
const NUMIWORKS_EVERGREEN = 'https://www.tkqlhce.com/click-101827399-15734200';
const GOBOOKT_EVERGREEN = 'https://www.tkqlhce.com/click-101803878-15734200';

function enableGotript(): void {
  vi.stubEnv('CRUISEDIRECT_ENABLED', 'true');
  vi.stubEnv('CRUISEDIRECT_EVERGREEN_URL', GOTRIPT_EVERGREEN);
}

/**
 * CruiseDirect must be strictly site-isolated: the PID comes only from the
 * per-project CRUISEDIRECT_EVERGREEN_URL, every link carries that PID, the
 * GoBookt PID can never appear, and everything fails safe when disabled.
 */
describe('CruiseDirect — site-isolated resolver', () => {
  it('is disabled (null) unless CRUISEDIRECT_ENABLED === "true"', () => {
    vi.stubEnv('CRUISEDIRECT_ENABLED', '');
    vi.stubEnv('CRUISEDIRECT_EVERGREEN_URL', GOTRIPT_EVERGREEN);
    expect(cruiseDirectEnabled()).toBe(false);
    expect(resolveCruiseDirectUrl('caribbean')).toBeNull();
  });

  it('derives the site PID from CRUISEDIRECT_EVERGREEN_URL', () => {
    enableGotript();
    expect(cruiseDirectPid()).toBe('101803920');
    vi.stubEnv('CRUISEDIRECT_EVERGREEN_URL', NUMIWORKS_EVERGREEN);
    expect(cruiseDirectPid()).toBe('101827399');
  });

  it('every built link carries the SITE pid (isolation) + a CJ domain', () => {
    enableGotript();
    const url = resolveCruiseDirectUrl('caribbean');
    expect(url).not.toBeNull();
    const d = describeCruiseDirectUrl(url as string);
    expect(d.pid).toBe('101803920');
    expect(d.creativeId).toBe('15534704');
    expect(d.cjDomain).not.toBeNull();

    // Swap to the Numiworks env → Numiworks PID, never GoTript's.
    vi.stubEnv('CRUISEDIRECT_EVERGREEN_URL', NUMIWORKS_EVERGREEN);
    expect(describeCruiseDirectUrl(resolveCruiseDirectUrl('caribbean') as string).pid).toBe(
      '101827399',
    );
  });

  it('evergreen returns the exact, authoritative env URL', () => {
    enableGotript();
    expect(resolveCruiseDirectUrl('evergreen')).toBe(GOTRIPT_EVERGREEN);
  });

  it('NEVER emits the GoBookt PID on a cruise link (hard guard)', () => {
    vi.stubEnv('CRUISEDIRECT_ENABLED', 'true');
    vi.stubEnv('CRUISEDIRECT_EVERGREEN_URL', GOBOOKT_EVERGREEN);
    expect(cruiseDirectPid()).toBeNull();
    expect(resolveCruiseDirectUrl('caribbean')).toBeNull();
    expect(resolveCruiseDirectUrl('evergreen')).toBeNull();
  });

  it('fails safe (null) when the evergreen env is unset', () => {
    vi.stubEnv('CRUISEDIRECT_ENABLED', 'true');
    vi.stubEnv('CRUISEDIRECT_EVERGREEN_URL', '');
    expect(resolveCruiseDirectUrl('caribbean')).toBeNull();
  });
});
