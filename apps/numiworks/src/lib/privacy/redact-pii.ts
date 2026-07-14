/**
 * Best-effort PII redaction for user-supplied trip prose before it is stored
 * (memory) or logged.
 *
 * This is deliberately CONSERVATIVE — it targets high-signal, low-false-positive
 * formats and prefers letting an ambiguous token through over mangling normal
 * trip text ("5 days", "2 adults", "$3,000 budget", "March 2026" must survive).
 * It is NOT a guarantee of complete PII removal.
 *
 * LIMITATIONS (documented + tested):
 *   - Free-text street addresses, personal names, and many international
 *     passport/ID and phone formats are only caught when they match a
 *     recognizable shape; plenty will pass through.
 *   - Reservation codes are only redacted when preceded by a keyword
 *     (booking/confirmation/PNR/…) AND containing a digit, to avoid clobbering
 *     ordinary words like "flights".
 *   - Payment cards are Luhn-validated to avoid redacting long non-card numbers.
 *
 * The right primary defense is to persist STRUCTURED, normalized preferences
 * (destination, dates, party, budget band, interests) rather than raw prose —
 * this redactor is the secondary net for the raw text we do keep.
 */

export interface RedactionResult {
  /** The redacted text. */
  text: string;
  /** Total number of redactions applied. */
  redactions: number;
  /** Which categories fired (no raw values) — safe for telemetry. */
  kinds: string[];
}

/** Luhn checksum — used to avoid redacting long non-card digit runs. */
function luhnValid(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * Redact likely PII from a string. Returns the redacted text plus which
 * categories fired (for privacy-safe telemetry — never the raw values).
 */
export function redactPii(input: string): RedactionResult {
  if (!input) return { text: input, redactions: 0, kinds: [] };

  const kinds = new Set<string>();
  let count = 0;
  let text = input;

  const apply = (kind: string, re: RegExp, replacement: string): void => {
    text = text.replace(re, () => {
      kinds.add(kind);
      count++;
      return replacement;
    });
  };

  // 1. Email (run first so its digits can't be misread as a phone).
  apply('email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]');

  // 2. Payment card — 13-19 digits, optionally single-separated, Luhn-valid.
  text = text.replace(/\b(?:\d[ -]?){13,19}\b/g, (m) => {
    const digits = m.replace(/[ -]/g, '');
    if (luhnValid(digits)) {
      kinds.add('card');
      count++;
      return '[redacted-card]';
    }
    return m;
  });

  // 3. US SSN shape.
  apply('id', /\b\d{3}-\d{2}-\d{4}\b/g, '[redacted-id]');
  // 4. Passport-ish: 1-2 uppercase letters + 7-9 digits.
  apply('id', /\b[A-Z]{1,2}\d{7,9}\b/g, '[redacted-id]');

  // 5. Street address: number + word(s) + a street-type suffix.
  apply(
    'address',
    /\b\d{1,5}\s+(?:[A-Z][A-Za-z]*\.?\s+){1,4}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Ln|Lane|Dr|Drive|Way|Ct|Court|Pl|Place|Sq|Square|Ter|Terrace|Hwy|Highway)\b\.?/g,
    '[redacted-address]',
  );

  // 6. Reservation/booking code — keyword-gated, must contain a digit; keep the
  //    keyword, redact only the code.
  text = text.replace(
    /\b((?:confirmation|booking|reservation|pnr|conf|ref(?:erence)?)\b[\s#:]*)((?=[A-Z0-9]*\d)[A-Z0-9]{5,8})\b/gi,
    (_m, kw: string) => {
      kinds.add('reservation');
      count++;
      return `${kw}[redacted-reservation]`;
    },
  );

  // 7. Phone — conservative, run last. Intl (+…), parenthesized area code,
  //    separated US-style, then a bare 10-15 digit run.
  apply('phone', /\+\d[\d .\-()]{7,}\d/g, '[redacted-phone]');
  apply('phone', /\(\d{3}\)\s?\d{3}[ .\-]?\d{4}/g, '[redacted-phone]');
  apply('phone', /\b\d{3}[ .\-]\d{3}[ .\-]\d{4}\b/g, '[redacted-phone]');
  apply('phone', /\b\d{10,15}\b/g, '[redacted-phone]');

  return { text, redactions: count, kinds: [...kinds] };
}

/** Convenience: just the redacted text. */
export function redactPiiText(input: string): string {
  return redactPii(input).text;
}
