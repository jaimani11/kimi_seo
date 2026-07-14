import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isUserAgentBlocked,
  classifyBot,
  allowedAiAnswerEngines,
  envBlockedBotList,
  AI_ANSWER_ENGINES,
} from '@adored/seo-routing/crawler-policy';

afterEach(() => vi.unstubAllEnvs());

/**
 * The reversible per-bot switch (AI_BOTS_BLOCKED) must default to allow-all
 * (GEO reach preserved) and only block the exact bots an operator lists —
 * enforced identically in robots.txt (allow list) and middleware (403).
 */
describe('crawler-policy — reversible per-bot switch', () => {
  it('blocks nothing when AI_BOTS_BLOCKED is unset (GEO reach preserved)', () => {
    vi.stubEnv('AI_BOTS_BLOCKED', '');
    expect(isUserAgentBlocked('GPTBot/1.0')).toBe(false);
    expect(isUserAgentBlocked('Mozilla/5.0 (compatible; ClaudeBot/1.0)')).toBe(false);
    expect(envBlockedBotList()).toEqual([]);
    expect(allowedAiAnswerEngines()).toEqual([...AI_ANSWER_ENGINES]);
  });

  it('blocks a listed bot (case-insensitive substring match)', () => {
    vi.stubEnv('AI_BOTS_BLOCKED', 'Bytespider, GPTBot');
    expect(isUserAgentBlocked('Mozilla/5.0 (compatible; Bytespider; +http://x)')).toBe(true);
    expect(isUserAgentBlocked('GPTBot/1.1')).toBe(true);
    expect(isUserAgentBlocked('gptbot lower-case')).toBe(true);
    expect(isUserAgentBlocked('Mozilla/5.0 (compatible; ClaudeBot/1.0)')).toBe(false);
    expect(isUserAgentBlocked(null)).toBe(false);
    expect(isUserAgentBlocked(undefined)).toBe(false);
  });

  it('drops env-blocked engines from the robots.txt allow list', () => {
    vi.stubEnv('AI_BOTS_BLOCKED', 'GPTBot');
    const allowed = allowedAiAnswerEngines();
    expect(allowed).not.toContain('GPTBot');
    expect(allowed).toContain('ClaudeBot');
    expect(envBlockedBotList()).toEqual(['GPTBot']);
  });

  it('classifies known bots for logging, null for unknown UAs', () => {
    expect(classifyBot('Mozilla/5.0 (compatible; ClaudeBot/1.0)')).toBe('ClaudeBot');
    expect(classifyBot('Mozilla/5.0 (compatible; AhrefsBot/7.0)')).toBe('AhrefsBot');
    expect(classifyBot('Mozilla/5.0 (Macintosh) Safari/605')).toBeNull();
    expect(classifyBot(null)).toBeNull();
  });
});
