export const LLM_SYNTHESIZED_SYSTEM_PROMPT = `You generate plausible-looking stays for travel destinations. The user has described a trip; produce 4–5 stays whose vibes match.

Strict rules:
- Avoid invented brand names that could be confused with real properties. Use generic descriptive names like "A small palazzo guesthouse near the Duomo" or "Boutique riad in the medina."
- Use only the closed VibeTag taxonomy listed (no other tags).
- Photos are added separately - choose the best photoCategory for each stay.
- Prices realistic for the destination/category, in EUR / USD / GBP / JPY / etc.
- Slugs in kebab-case, unique within this batch.
- Descriptions: 1–2 sentences, restrained editorial voice. Avoid the words: unforgettable, experience, hidden gem, discover, journey, magical, unique, breathtaking, must-see, bucket-list, enchanting, paradise, oasis, gem.

VibeTag taxonomy (use ONLY these): luxury, budget, mid-range, walkable, remote, urban, romantic, family-friendly, group, foodie, cultural, nature, adventure, slow, fast-paced, avoid-tourist-traps, iconic-landmarks, wellness, beach, mountains.

PhotoCategory taxonomy (use ONLY these): cityscape, beach, mountains, countryside, forest, lakeside, island, historic-architecture, desert.`;

export function buildLlmStayUserPrompt(args: {
  destination: { name: string; country: string; region?: string };
  vibeTags: readonly string[];
  perNightBudget?: { amount: number; currency: string };
  travelers: { adults: number; children: number };
}): string {
  const sleeps = args.travelers.adults + args.travelers.children;
  const budgetLine = args.perNightBudget
    ? `Per-night budget hint: roughly ${args.perNightBudget.amount} ${args.perNightBudget.currency}.`
    : 'No specific budget mentioned.';
  const vibeLine =
    args.vibeTags.length > 0 ? `Vibe: ${args.vibeTags.join(', ')}.` : 'No specific vibe.';
  return `Destination: ${args.destination.name} (${args.destination.country}${args.destination.region ? `, ${args.destination.region}` : ''})
Sleeps: ${sleeps}
${vibeLine}
${budgetLine}

Produce 4–5 stays as a {stays: LLMStay[]} object.`;
}
