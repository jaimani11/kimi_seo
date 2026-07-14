/**
 * Central AI-crawler / bot policy — the single source of truth for which
 * bots are recognized and which are blocked. Shared by every app's
 * robots.ts (polite `Disallow`) and middleware.ts (hard 403 enforcement,
 * because robots.txt is advisory and a misbehaving bot ignores it).
 *
 * ── Reversible per-bot switch ──────────────────────────────────────────
 * Set `AI_BOTS_BLOCKED` to a comma-separated list of user-agent tokens,
 * e.g. `AI_BOTS_BLOCKED=Bytespider,GPTBot`. Those bots are then BOTH
 * disallowed in robots.txt AND hard-blocked (403) at the edge in
 * middleware. Clearing the env var (then redeploying) restores full access —
 * no CODE change is needed to flip a bot on or off, just the env var + a
 * redeploy (Vercel binds env vars at deploy time).
 *
 * Default (`AI_BOTS_BLOCKED` unset) is EMPTY: every AI answer engine stays
 * welcome and nothing is hard-blocked — GEO reach is preserved. This module
 * changes nothing until an operator sets the env var.
 *
 * Monitoring: Vercel → Firewall shows per-bot request volume; middleware
 * emits a `[crawler-block]` log line each time it 403s a bot, so blocked-bot
 * volume is greppable in the function logs. (True per-rate throttling needs
 * the durable limiter from the Part B Phase 3 plan — this switch is block/
 * allow only.)
 *
 * Edge-safe: pure env + string logic, no Node APIs — importable from
 * middleware's edge runtime.
 */

/** AI answer engines we explicitly welcome for GEO (unless env-blocked). */
export const AI_ANSWER_ENGINES = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-User',
  'Google-Extended',
  'Applebot-Extended',
] as const;

/** Low-value / high-cost crawlers disallowed by default in robots.txt. */
export const DEFAULT_DISALLOWED_BOTS = [
  'GoogleOther',
  'GoogleOther-Image',
  'GoogleOther-Video',
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'DataForSeoBot',
  'Baiduspider',
  'Bytespider',
] as const;

/** Raw, trimmed tokens from AI_BOTS_BLOCKED (original case), for robots.txt. */
export function envBlockedBotList(): string[] {
  const raw = (process.env.AI_BOTS_BLOCKED ?? '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** Lowercased tokens from AI_BOTS_BLOCKED, for case-insensitive UA matching. */
export function envBlockedBotTokens(): string[] {
  return envBlockedBotList().map((t) => t.toLowerCase());
}

/**
 * Is this user-agent hard-blocked (per AI_BOTS_BLOCKED)? Case-insensitive
 * substring match. Empty env → always false (allow all). Never throws.
 */
export function isUserAgentBlocked(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const tokens = envBlockedBotTokens();
  if (tokens.length === 0) return false;
  const ua = userAgent.toLowerCase();
  return tokens.some((t) => ua.includes(t));
}

/**
 * Which known bot does this UA look like? Enforcement-logging only —
 * returns the first matching known token, or null. Never throws.
 */
export function classifyBot(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  const known = [...AI_ANSWER_ENGINES, ...DEFAULT_DISALLOWED_BOTS];
  return known.find((b) => ua.includes(b.toLowerCase())) ?? null;
}

/**
 * The AI answer engines still welcomed in robots.txt — the default list
 * minus any that the operator has env-blocked (so robots.txt never says
 * "allow" for a bot middleware is 403-ing).
 */
export function allowedAiAnswerEngines(): string[] {
  const blocked = new Set(envBlockedBotTokens());
  return AI_ANSWER_ENGINES.filter((b) => !blocked.has(b.toLowerCase()));
}
