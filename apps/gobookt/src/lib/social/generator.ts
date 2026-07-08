import { AnthropicModelClient } from '@lib/ai/anthropic-client';
import type { SeoCity } from '@lib/seo/cities';
import { findDestinationGuide } from '@lib/seo/destination-content';
import { buildSocialPackFromTemplate } from './template-generator';
import { CitySocialPackSchema, type CitySocialPack } from './types';

/**
 * Produce a CitySocialPack — 10 Pinterest pins + 10 TikTok scripts +
 * 10 Reels scripts + 10 YouTube Shorts scripts — for a given city.
 *
 * Three modes, picked in order:
 *
 *   1. Static sample if available (Tokyo ships one for free).
 *   2. LLM mode (opt-in via MARKETING_LLM_PACKS=true) — richer voice.
 *   3. Template mode (DEFAULT) — pulls from DESTINATION_GUIDES, builds
 *      platform-appropriate scripts deterministically. Always works,
 *      costs nothing, and is the default so daily posting is free.
 *
 * The two non-static modes both run server-side; this file is safe to
 * import from a `'use server'` route handler.
 */

export interface SocialGeneratorOptions {
  /** Force-skip the static sample path even if one exists. Useful for
   *  admin regeneration. */
  skipSample?: boolean;
  /** Force-use the template mode regardless of whether ANTHROPIC_API_KEY
   *  is set. Useful for tests and deterministic snapshots. */
  forceTemplate?: boolean;
}

export async function generateCitySocialPack(
  city: SeoCity,
  opts: SocialGeneratorOptions = {},
): Promise<CitySocialPack> {
  // (1) Static sample
  if (!opts.skipSample) {
    const sample = await findSampleFor(city.slug);
    if (sample) return sample;
  }

  // (2) LLM mode — OFF by default. The deterministic template (mode 3)
  // pulls real guide facts and reads well, so a fresh LLM pack per city
  // per day (~$40/mo across all four brands) isn't worth it. Set
  // MARKETING_LLM_PACKS=true to opt back into the richer AI voice.
  if (
    !opts.forceTemplate &&
    process.env.ANTHROPIC_API_KEY &&
    process.env.MARKETING_LLM_PACKS === 'true'
  ) {
    try {
      return await generateWithAnthropic(city);
    } catch (err) {
      // Never fail the generation — fall through to the deterministic
      // template so admins always get a pack.
      console.warn('[social] Anthropic generation failed, falling back to template:', err);
    }
  }

  // (3) Template fallback
  return buildSocialPackFromTemplate(city);
}

async function findSampleFor(slug: string): Promise<CitySocialPack | null> {
  // Static-only registry — keep import-on-demand so route bundles
  // don't pull in unused sample text.
  if (slug === 'tokyo') {
    const { TOKYO_SAMPLE_PACK } = await import('./samples/tokyo');
    return TOKYO_SAMPLE_PACK;
  }
  return null;
}

// ============== Anthropic path ==============

const SOCIAL_GENERATION_SYSTEM = `You are a social-first travel content writer for gobookt, an AI travel planner.
Your output drives Pinterest pins, TikTok scripts, Instagram Reels, and YouTube Shorts.
Voice: confident, factual, friendly, never breathlessly hype.
Format: respond ONLY with valid JSON matching the schema you are given.
Every script and pin must include a CTA back to gobookt.com.
Hashtags must start with # and contain only letters/digits/underscores.`;

async function generateWithAnthropic(city: SeoCity): Promise<CitySocialPack> {
  const guide = findDestinationGuide(city.slug);
  const client = new AnthropicModelClient();
  const userPrompt = buildAnthropicPrompt(city, guide);

  const result = await client.generate<unknown>({
    model: 'claude-haiku-4-5',
    system: SOCIAL_GENERATION_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens: 2048,
    temperature: 0.6,
    responseSchema: CitySocialPackSchema,
  });

  // Validate the model output before returning. If invalid (rare with
  // a schema-constrained call), fall back to template.
  const parsed = CitySocialPackSchema.safeParse({
    ...(result as object),
    citySlug: city.slug,
    cityName: city.name,
    generatedAt: new Date().toISOString(),
    source: 'llm-anthropic',
  });
  if (!parsed.success) {
    console.warn('[social] Anthropic returned unparseable pack, falling back', parsed.error);
    return buildSocialPackFromTemplate(city);
  }
  return parsed.data;
}

function buildAnthropicPrompt(
  city: SeoCity,
  guide: ReturnType<typeof findDestinationGuide>,
): string {
  const guideJson = guide ? JSON.stringify(guide, null, 2) : '{}';
  return `Produce a CitySocialPack for ${city.name}, ${city.countryName}.

Destination metadata:
  slug: ${city.slug}
  name: ${city.name}
  country: ${city.countryName}
  oneLiner: ${city.oneLiner}

Destination guide (use specific facts from this; do not invent dishes,
neighborhoods, or budget numbers that contradict the guide):
${guideJson}

Required output: a JSON object with this shape (no extra fields):

{
  "pinterest": [PinterestPin, ... 10 total],
  "tiktok":    [ShortFormVideoScript, ... 10 total],
  "reels":     [ShortFormVideoScript, ... 10 total],
  "shorts":    [ShortFormVideoScript, ... 10 total]
}

PinterestPin: { platform: "pinterest", title (≤100), description (≤500),
  visualConcept (what the image shows), hashtags (3–8 #starting), cta }

ShortFormVideoScript: { platform: "tiktok" | "instagram-reels" | "youtube-shorts",
  hook (first 1–3 seconds, ≤140 chars),
  scenes (3–6 of them, each with { visual, text (≤80, overlay text),
    voiceover (≤25 words) }),
  cta, durationSec (15–30), musicCue, hashtags (5–15) }

Rules:
- Every CTA includes a gobookt.com mention.
- Use specific facts from the guide above. Don't fabricate.
- Voice: confident, factual, friendly. No "amazing", "epic",
  "unforgettable", "hidden gem" as a cliché.
- Each platform gets distinct angles — don't repeat the same idea
  twice across the 10 scripts.
- Reels and TikTok scripts can share angles but should phrase
  differently. Shorts skews more educational, TikTok more punchy.`;
}
