import type { NextRequest } from 'next/server';
import { requireAdmin } from '@lib/admin/require-admin';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import { getMarketingStore } from '@lib/marketing/marketing-store';
import {
  MarketingPlatformConfigSchema,
  type MarketingScheduleConfig,
} from '@lib/marketing/types';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET → returns the current MarketingScheduleConfig.
 * PUT → updates one or more per-platform entries.
 *
 * The PUT body is a partial: callers send only the platforms they
 * want to update. The admin UI POSTs all three at once, but other
 * scripts can patch individually.
 */

const UpdateSchema = z.object({
  pinterest: MarketingPlatformConfigSchema.optional(),
  instagram: MarketingPlatformConfigSchema.optional(),
  tiktok: MarketingPlatformConfigSchema.optional(),
});

export async function GET(): Promise<Response> {
  await requirePasswordAdmin();
  await requireAdmin();
  const store = getMarketingStore();
  const config = await store.getConfig();
  return Response.json({ config });
}

export async function PUT(req: NextRequest): Promise<Response> {
  await requirePasswordAdmin();
  await requireAdmin();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'validation failed', issues: parsed.error.issues }, { status: 400 });
  }
  const store = getMarketingStore();
  const current = await store.getConfig();
  const next: MarketingScheduleConfig = {
    ...current,
    ...(parsed.data.pinterest ? { pinterest: parsed.data.pinterest } : {}),
    ...(parsed.data.instagram ? { instagram: parsed.data.instagram } : {}),
    ...(parsed.data.tiktok ? { tiktok: parsed.data.tiktok } : {}),
    updatedAt: new Date().toISOString(),
  };
  await store.putConfig(next);
  return Response.json({ config: next });
}
