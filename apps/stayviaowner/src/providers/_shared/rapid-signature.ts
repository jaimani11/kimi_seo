import { createHmac } from 'node:crypto';

/**
 * Expedia EPS Rapid request signing.
 *
 * Rapid uses an HMAC-SHA512-based scheme: clients send an
 * `Authorization` header of the form:
 *
 *   EAN APIKey=<apiKey>,Signature=<hex>,timestamp=<epochSeconds>
 *
 * where signature = HMAC-SHA512( apiKey + sharedSecret + timestamp ).
 *
 * The timestamp is epoch seconds; Rapid rejects requests whose
 * timestamp drifts > ±5 minutes from server time. We mint per-request
 * (not per-batch) so a long-running call doesn't expire mid-flight.
 *
 * This signing module is shared between the Expedia and Vrbo
 * providers - both partners route through Expedia Group's Rapid API.
 *
 * Reference: https://developers.expediagroup.com/docs/rapid/getting-started/api-overview
 *
 * Note: production callers may want to reuse the `Customer-Ip` and
 * `Customer-Session-Id` headers per Rapid's affiliate-attribution
 * spec; those are added by the provider client, not here, since they
 * vary per-request based on the inbound user.
 */

export interface RapidCredentials {
  apiKey: string;
  sharedSecret: string;
}

export interface RapidSignedHeaders {
  /** The full `Authorization: EAN APIKey=…,Signature=…,timestamp=…` header value. */
  authorization: string;
  /** Hex signature for testing. */
  signature: string;
  /** Epoch seconds used in the signature (so callers can echo it for debugging). */
  timestamp: number;
}

/**
 * Build the signed Authorization header for a Rapid request.
 *
 * `nowSeconds` is overridable for tests so signatures are reproducible
 * without freezing time globally.
 */
export function signRapidRequest(
  creds: RapidCredentials,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): RapidSignedHeaders {
  const ts = String(nowSeconds);
  const signature = createHmac('sha512', creds.sharedSecret)
    .update(creds.apiKey + creds.sharedSecret + ts)
    .digest('hex');
  return {
    authorization: `EAN APIKey=${creds.apiKey},Signature=${signature},timestamp=${ts}`,
    signature,
    timestamp: nowSeconds,
  };
}

/**
 * Constant-time string compare for signature verification (in case
 * we ever build a Rapid webhook receiver). Avoids timing-attack
 * differential between equal-length signatures.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
