/**
 * Share slugs are unguessable, not authenticated. 16 chars from a 62-char
 * alphabet ≈ 95 bits of entropy - enough to defeat enumeration without
 * pulling a dep. Output is URL-safe (no `/`, `+`, `=`, padding).
 *
 * Generation uses crypto.getRandomValues, which is uniform - we mod-mask
 * with rejection sampling to keep the distribution flat (the naive
 * `% 62` approach is biased because 256 % 62 ≠ 0).
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_LENGTH = 16;

export function mintShareSlug(): string {
  const out = new Array<string>(SLUG_LENGTH);
  let written = 0;
  // Pull 32 random bytes per pass; reject any byte ≥ 248 (62 * 4 = 248)
  // so the remaining 0..247 maps uniformly into the 62-char alphabet.
  while (written < SLUG_LENGTH) {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && written < SLUG_LENGTH; i += 1) {
      const b = buf[i] as number;
      if (b >= 248) continue;
      out[written] = ALPHABET[b % 62] as string;
      written += 1;
    }
  }
  return out.join('');
}

/** Validate a share slug is shaped like one we'd mint. Cheap pre-DB check. */
export function isValidShareSlug(slug: string): boolean {
  if (slug.length !== SLUG_LENGTH) return false;
  for (let i = 0; i < slug.length; i += 1) {
    if (!ALPHABET.includes(slug[i] as string)) return false;
  }
  return true;
}
