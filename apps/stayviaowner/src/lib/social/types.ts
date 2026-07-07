/**
 * Social content shapes. Each platform has its own structural needs:
 *
 *   Pinterest        - still image with title + description; visual
 *                      concept guides the designer/AI image gen.
 *   TikTok / Reels   - short vertical video script; hook → scenes →
 *   / YouTube Shorts   CTA; mood / hashtags / duration.
 *
 * All four platforms share `cta`, `hashtags`, and `cityName` so
 * downstream analytics + linking treats them uniformly.
 *
 * The CTA always points back to stayviaowner (per the brief). Platform-
 * appropriate length limits are enforced by the schema below — the
 * Pinterest title field, for example, is hard-capped at 100 chars
 * because Pinterest truncates it visually beyond that.
 */

import { z } from 'zod';

export const SocialPlatformSchema = z.enum([
  'pinterest',
  'tiktok',
  'instagram-reels',
  'youtube-shorts',
]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const HashtagSchema = z
  .string()
  .min(2)
  .max(40)
  .regex(/^#[a-zA-Z0-9_]+$/, 'Hashtags must start with # and contain only letters/digits/_');

export const PinterestPinSchema = z.object({
  platform: z.literal('pinterest'),
  /** ≤ 100 chars — Pinterest truncates titles beyond ~70 visible chars. */
  title: z.string().min(8).max(100),
  /** ≤ 500 chars — Pinterest's hard cap is 500. */
  description: z.string().min(40).max(500),
  /** What the image should show. Used to brief designers or feed an
   *  image-gen model. */
  visualConcept: z.string().min(20).max(280),
  hashtags: z.array(HashtagSchema).min(3).max(8),
  /** Call to action — always pointed at stayviaowner. */
  cta: z.string().min(10).max(120),
  /** Optional themed slug (e.g. `paris-with-kids`). When present the
   *  Pinterest adapter routes the pin's link to `/{pathSlug}` instead
   *  of the default VRBO/guide rotation. */
  pathSlug: z.string().min(2).max(120).optional(),
});
export type PinterestPin = z.infer<typeof PinterestPinSchema>;

export const VideoSceneSchema = z.object({
  /** What's visually on screen for this scene. */
  visual: z.string().min(10).max(220),
  /** On-screen text overlay. ≤ ~60 chars renders cleanly on a phone. */
  text: z.string().min(2).max(80),
  /** Spoken voiceover. ≤ 25 words keeps a scene under 5 seconds. */
  voiceover: z.string().min(8).max(220),
});
export type VideoScene = z.infer<typeof VideoSceneSchema>;

export const ShortFormVideoScriptSchema = z.object({
  platform: z.enum(['tiktok', 'instagram-reels', 'youtube-shorts']),
  /** Opening hook — the first 1–3 seconds. Critical for retention. */
  hook: z.string().min(8).max(140),
  /** 3–6 scenes total. Each ~3–5 seconds keeps the whole video 15–30s. */
  scenes: z.array(VideoSceneSchema).min(3).max(6),
  /** Closing CTA — what the viewer should do next. */
  cta: z.string().min(10).max(140),
  /** Target duration in seconds. Enforced 15–30 per the brief. */
  durationSec: z.number().int().min(15).max(30),
  /** Music vibe / genre cue — "ambient lo-fi", "uplifting indie", etc. */
  musicCue: z.string().min(4).max(80),
  hashtags: z.array(HashtagSchema).min(5).max(15),
});
export type ShortFormVideoScript = z.infer<typeof ShortFormVideoScriptSchema>;

export const SocialContentItemSchema = z.discriminatedUnion('platform', [
  PinterestPinSchema,
  ShortFormVideoScriptSchema.extend({ platform: z.literal('tiktok') }),
  ShortFormVideoScriptSchema.extend({ platform: z.literal('instagram-reels') }),
  ShortFormVideoScriptSchema.extend({ platform: z.literal('youtube-shorts') }),
]);
export type SocialContentItem = z.infer<typeof SocialContentItemSchema>;

export const CitySocialPackSchema = z.object({
  citySlug: z.string().min(2),
  cityName: z.string().min(2),
  pinterest: z.array(PinterestPinSchema).min(1).max(20),
  tiktok: z.array(ShortFormVideoScriptSchema).min(1).max(20),
  reels: z.array(ShortFormVideoScriptSchema).min(1).max(20),
  shorts: z.array(ShortFormVideoScriptSchema).min(1).max(20),
  generatedAt: z.string().datetime(),
  /** Where the content came from. */
  source: z.enum(['sample', 'llm-anthropic', 'template-fallback']),
});
export type CitySocialPack = z.infer<typeof CitySocialPackSchema>;
