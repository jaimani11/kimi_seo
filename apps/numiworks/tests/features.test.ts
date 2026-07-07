import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getServerFeatures } from '@/lib/env/get-server-features';

const SAVED_KEYS = [
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'LANGFUSE_SECRET_KEY',
  'BOOKING_COM_AFFILIATE_ID',
  'BOOKING_COM_API_KEY',
  'EXPEDIA_API_KEY',
  'EXPEDIA_SHARED_SECRET',
] as const;

describe('getServerFeatures', () => {
  const saved: Partial<Record<(typeof SAVED_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const k of SAVED_KEYS) saved[k] = process.env[k];
    for (const k of SAVED_KEYS) delete process.env[k];
  });

  afterEach(() => {
    for (const k of SAVED_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('returns all-false when nothing is set', async () => {
    // clientFeatures is captured at module load - re-import after env nuke.
    const f = getServerFeatures();
    expect(f.database).toBe(false);
    expect(f.anthropic).toBe(false);
    expect(f.langfuse).toBe(false);
  });

  it('treats placeholder DATABASE_URL as not configured', () => {
    process.env.DATABASE_URL =
      'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public';
    expect(getServerFeatures().database).toBe(false);
  });

  it('flips database on for a real-looking DATABASE_URL', () => {
    process.env.DATABASE_URL = 'postgresql://user:pw@db.example.com:5432/stayscout?sslmode=require';
    expect(getServerFeatures().database).toBe(true);
  });

  it('flips anthropic on when ANTHROPIC_API_KEY is non-empty', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    expect(getServerFeatures().anthropic).toBe(true);
  });

  it('flips langfuse on when LANGFUSE_SECRET_KEY is non-empty', () => {
    process.env.LANGFUSE_SECRET_KEY = 'lf-test';
    expect(getServerFeatures().langfuse).toBe(true);
  });

  it('treats empty string as not configured', () => {
    process.env.ANTHROPIC_API_KEY = '';
    expect(getServerFeatures().anthropic).toBe(false);
  });

  it('providers.bookingCom is false when only one key is set', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = 'partner_42';
    expect(getServerFeatures().providers.bookingCom).toBe(false);
    delete process.env.BOOKING_COM_AFFILIATE_ID;
    process.env.BOOKING_COM_API_KEY = 'key_xyz';
    expect(getServerFeatures().providers.bookingCom).toBe(false);
  });

  it('providers.bookingCom flips on when BOTH keys are set', () => {
    process.env.BOOKING_COM_AFFILIATE_ID = 'partner_42';
    process.env.BOOKING_COM_API_KEY = 'key_xyz';
    expect(getServerFeatures().providers.bookingCom).toBe(true);
  });

  it('providers.expedia flips on when BOTH keys are set', () => {
    process.env.EXPEDIA_API_KEY = 'eps_key';
    process.env.EXPEDIA_SHARED_SECRET = 'eps_secret';
    expect(getServerFeatures().providers.expedia).toBe(true);
  });
});
