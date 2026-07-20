import { z } from 'zod';
import { AnthropicModelClient } from '@lib/ai/anthropic-client';
import { planDayThemes, themeLabel } from '@lib/plan/themes';
import type { DayTheme } from '@lib/plan/types';

/**
 * gotript /plan — AI itinerary planner on **Expedia** (rebuilt from the retired
 * Viator builder; gotript is the Expedia brand and has no Viator key).
 *
 * gotript is an affiliate brand with no live inventory API — so the planner does
 * NOT list specific properties/tours. Instead:
 *   1. Claude (haiku) generates a realistic, destination- and vibe-specific
 *      day-by-day itinerary (grounded activity types, no invented brand names or
 *      prices) — cached per (destination, nights, vibe) via the page's revalidate.
 *   2. Every day + the header hand off to gotript's TRACKED Expedia search
 *      (`/api/go/expedia?category=…`) — attractions for things-to-do, hotels for
 *      the stay — so the itinerary funnels straight into the commission path.
 *
 * Never throws: if the AI key is absent or the call fails, a deterministic
 * theme-based itinerary renders instead. So /plan is always useful.
 */

export interface PlanQuery {
  destination: string;
  nights: number;
  vibeTags: readonly string[];
}

export interface PlanDayItem {
  time: 'Morning' | 'Midday' | 'Afternoon' | 'Evening';
  activity: string;
  why?: string;
}

export interface PlanDay {
  day: number;
  title: string;
  items: PlanDayItem[];
}

export interface Plan {
  destination: string;
  nights: number;
  vibe: readonly string[];
  summary: string;
  days: PlanDay[];
  /** True when Claude generated the itinerary; false = deterministic fallback. */
  aiGenerated: boolean;
  /** Tracked Expedia handoffs (Partnerize) for the whole trip. */
  thingsToDoHref: string;
  staysHref: string;
}

const TIME_BANDS = ['Morning', 'Midday', 'Afternoon', 'Evening'] as const;

const DaySchema = z.object({
  title: z.string().min(3).max(80),
  items: z
    .array(
      z.object({
        time: z.enum(TIME_BANDS),
        activity: z.string().min(6).max(220),
        why: z.string().max(180).optional(),
      }),
    )
    .min(2)
    .max(4),
});

const PlanSchema = z.object({
  summary: z.string().min(10).max(420),
  days: z.array(DaySchema).min(1).max(7),
});

const SYSTEM_PROMPT = [
  'You are a concise, practical travel-itinerary planner.',
  'Given a destination, a number of days, and a vibe, produce a realistic day-by-day plan.',
  'Rules:',
  '- Each day: a short evocative title (max ~7 words) + 2 to 4 time-banded items (Morning / Midday / Afternoon / Evening).',
  '- Name real, well-known neighborhoods, landmarks, and activity TYPES for the destination (e.g. "sunset felucca ride on the Nile", "tapas crawl in La Latina"). Group geographically-sensible things on the same day.',
  '- Do NOT invent specific hotel, tour-operator, or restaurant brand names, and never state prices, ratings, or availability.',
  '- Keep each activity under ~200 characters. Optional one-line "why" per item.',
  '- Match the vibe (foodie, culture, adventure, romantic, family, luxury, walkable) without being generic.',
  'Output STRICT JSON matching the schema: { summary, days: [{ title, items: [{ time, activity, why? }] }] }.',
].join('\n');

export async function buildPlan(query: PlanQuery): Promise<Plan> {
  const destination = query.destination.trim();
  const nights = clampNights(query.nights);
  const vibe = query.vibeTags;

  const href = (category: 'attractions' | 'hotels') =>
    `/api/go/expedia?category=${category}&destination=${encodeURIComponent(destination)}&adults=2`;
  const thingsToDoHref = href('attractions');
  const staysHref = href('hotels');

  const ai = await tryAiPlan(destination, nights, vibe);
  if (ai) {
    return {
      destination,
      nights,
      vibe,
      summary: ai.summary,
      days: ai.days,
      aiGenerated: true,
      thingsToDoHref,
      staysHref,
    };
  }

  const fb = fallbackPlan(destination, nights, vibe);
  return {
    destination,
    nights,
    vibe,
    summary: fb.summary,
    days: fb.days,
    aiGenerated: false,
    thingsToDoHref,
    staysHref,
  };
}

async function tryAiPlan(
  destination: string,
  nights: number,
  vibe: readonly string[],
): Promise<{ summary: string; days: PlanDay[] } | null> {
  if (!(process.env.ANTHROPIC_API_KEY ?? '').trim()) return null;
  const vibeLine = vibe.length > 0 ? vibe.join(', ') : 'a relaxed, well-paced trip';
  try {
    const client = new AnthropicModelClient();
    const resp = await client.generate({
      model: 'claude-haiku-4-5',
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Destination: ${destination}\nDays: ${nights}\nVibe: ${vibeLine}\n\nBuild the ${nights}-day itinerary now.`,
        },
      ],
      responseSchema: PlanSchema,
      cacheKey: 'gotript-plan-v1',
      maxTokens: 1800,
      temperature: 0.6,
    });
    const days: PlanDay[] = resp.days.slice(0, nights).map((d, i) => ({
      day: i + 1,
      title: d.title.trim(),
      items: d.items.slice(0, 4).map((it) => ({
        time: it.time,
        activity: it.activity.trim(),
        ...(it.why?.trim() ? { why: it.why.trim() } : {}),
      })),
    }));
    if (days.length === 0) return null;
    return { summary: resp.summary.trim(), days };
  } catch (err) {
    console.warn('[plan] Claude itinerary generation failed — using deterministic fallback', {
      destination,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ── deterministic fallback (no AI) ───────────────────────────────────

const FALLBACK_ITEMS: Readonly<Record<DayTheme, PlanDayItem[]>> = {
  arrival: [
    { time: 'Afternoon', activity: 'Check in, drop the bags, and take a slow orientation walk around your neighborhood.' },
    { time: 'Evening', activity: 'An easy first dinner nearby — somewhere you can wander to on foot.' },
  ],
  'food-and-wine': [
    { time: 'Morning', activity: 'A local market wander — coffee, pastries, and whatever looks best.' },
    { time: 'Midday', activity: 'A food-tour-style lunch crawl through the classic eating streets.' },
    { time: 'Evening', activity: 'A longer, sit-down dinner in the food-famous quarter.' },
  ],
  'culture-and-history': [
    { time: 'Morning', activity: 'The headline museum or monument — go early to beat the queues.' },
    { time: 'Afternoon', activity: 'The historic old town on foot: squares, churches, and side streets.' },
    { time: 'Evening', activity: 'A relaxed dinner where the locals actually eat.' },
  ],
  adventure: [
    { time: 'Morning', activity: 'The signature active outing — a hike, ride, paddle, or climb.' },
    { time: 'Afternoon', activity: 'Somewhere to cool off and refuel after the effort.' },
    { time: 'Evening', activity: 'An early, hearty dinner — you earned it.' },
  ],
  'sunset-and-water': [
    { time: 'Afternoon', activity: 'A slow waterfront afternoon — beach, lake, or river.' },
    { time: 'Evening', activity: 'Sunset at the best-known viewpoint, then a small dinner.' },
  ],
  'day-trip': [
    { time: 'Morning', activity: 'Out early to a nearby town, village, or natural sight.' },
    { time: 'Afternoon', activity: 'Explore, eat local, and take your time.' },
    { time: 'Evening', activity: 'Back to base for a low-key dinner.' },
  ],
  'free-day': [
    { time: 'Midday', activity: 'No fixed plans — wander, revisit a favorite, or just rest.' },
  ],
  farewell: [
    { time: 'Morning', activity: 'A final walk, a last coffee, and any souvenir stops.' },
    { time: 'Afternoon', activity: 'Nothing that needs a reservation — keep it easy before you go.' },
  ],
};

function fallbackPlan(
  destination: string,
  nights: number,
  vibe: readonly string[],
): { summary: string; days: PlanDay[] } {
  const themes = planDayThemes(nights, vibe);
  // themeLabel can repeat when planDayThemes assigns the same theme to two
  // middle days (e.g. a foodie trip → two "food-and-wine" days). Keep titles
  // unique so the fallback never reads like a bug.
  const used = new Set<string>();
  const days: PlanDay[] = themes.map((theme, i) => {
    const base = themeLabel(theme, destination);
    let title = base;
    let k = 2;
    while (used.has(title)) title = `${base} · part ${k++}`;
    used.add(title);
    return {
      day: i + 1,
      title,
      items: FALLBACK_ITEMS[theme] ?? FALLBACK_ITEMS['culture-and-history'],
    };
  });
  const vibeText = vibe.length > 0 ? ` with a ${vibe.slice(0, 2).join(' + ')} lean` : '';
  const summary = `A ${nights}-day flow through ${destination}${vibeText} — a balanced day-by-day shape you can book piece by piece on Expedia.`;
  return { summary, days };
}

function clampNights(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 4;
  return Math.max(1, Math.min(7, Math.floor(n)));
}
