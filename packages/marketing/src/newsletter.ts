/**
 * Newsletter capture — Resend-backed, brand-parameterized.
 *
 * Why Resend Audiences as the store: the marketing store is in-memory
 * and evaporates across serverless lambdas, so subscriber emails MUST
 * live somewhere durable. Resend Audiences hold the contacts on
 * Resend's side (no database to run), dedupe by email, and give us
 * compliant one-click unsubscribe on every broadcast for free.
 *
 * Everything is raw `fetch` — no SDK dependency, works cleanly on the
 * Node serverless runtime.
 *
 * Env (per Vercel project):
 *   RESEND_API_KEY     — from resend.com/api-keys
 *   RESEND_AUDIENCE_ID — the brand's audience (resend.com/audiences)
 *   NEWSLETTER_FROM    — optional; defaults to "{brand} <newsletter@{domain}>"
 *                        (the domain must be verified in Resend to send)
 *
 * Without the API key + audience id the capture endpoint stays live and
 * returns a friendly "launching soon" — the form never looks broken.
 */

const RESEND_BASE = 'https://api.resend.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewsletterBrand {
  /** Display name, e.g. "numiworks". */
  name: string;
  /** Bare domain, e.g. "numiworks.com". */
  domain: string;
  /** Canonical origin, e.g. "https://www.numiworks.com". */
  siteUrl: string;
  /** Brand accent for the email template. */
  primaryColor: string;
}

export interface NewsletterEnv {
  apiKey: string;
  audienceId: string;
  from: string;
}

export type SubscribeStatus =
  | 'subscribed'
  | 'already'
  | 'invalid'
  | 'not-configured'
  | 'error';

export interface SubscribeResult {
  ok: boolean;
  status: SubscribeStatus;
  message: string;
}

/** The Resend config from env, or null when capture isn't wired yet. */
export function getNewsletterEnv(brand: NewsletterBrand): NewsletterEnv | null {
  const apiKey = (process.env.RESEND_API_KEY ?? '').trim();
  const audienceId = (process.env.RESEND_AUDIENCE_ID ?? '').trim();
  if (!apiKey || !audienceId) return null;
  const from =
    (process.env.NEWSLETTER_FROM ?? '').trim() ||
    `${brand.name} <newsletter@${brand.domain}>`;
  return { apiKey, audienceId, from };
}

/** True once RESEND_API_KEY + RESEND_AUDIENCE_ID are set. */
export function isNewsletterConfigured(brand: NewsletterBrand): boolean {
  return getNewsletterEnv(brand) !== null;
}

/**
 * Add an email to the brand's Resend audience and fire a welcome note.
 * Duplicate-safe (Resend dedupes by email). Never throws — always
 * returns a UI-friendly result.
 */
export async function subscribeEmail(args: {
  email: string;
  brand: NewsletterBrand;
  /** Where the signup happened, e.g. "footer" | "guide" — informational. */
  source?: string;
}): Promise<SubscribeResult> {
  const email = args.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, status: 'invalid', message: 'Please enter a valid email address.' };
  }

  const env = getNewsletterEnv(args.brand);
  if (!env) {
    return {
      ok: false,
      status: 'not-configured',
      message: 'Newsletter sign-up is launching soon — check back shortly.',
    };
  }

  try {
    const res = await fetch(`${RESEND_BASE}/audiences/${env.audienceId}/contacts`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    if (res.ok) {
      // Best-effort welcome — never fail the subscribe if the send errors
      // (e.g. sending domain not yet verified in Resend).
      void sendWelcomeEmail(email, args.brand, env).catch(() => {});
      return {
        ok: true,
        status: 'subscribed',
        message: "You're in! Check your inbox for a welcome note.",
      };
    }

    // Resend surfaces an existing contact as a 4xx with "already" in the
    // body — treat that as success, not an error.
    const body = await res.text();
    if (res.status === 409 || /already|exists/i.test(body)) {
      return { ok: true, status: 'already', message: "You're already subscribed — thanks!" };
    }
    // Surface the real Resend failure in the server logs so it's diagnosable:
    // 403 = key lacks contact-write permission (Sending-only key), 404 = wrong
    // audience id, 401 = bad/expired key. Body truncated; no PII.
    console.error('[newsletter] Resend add-contact failed', {
      status: res.status,
      audienceId: env.audienceId,
      body: body.slice(0, 300),
    });
    return { ok: false, status: 'error', message: 'Something went wrong. Please try again.' };
  } catch (err) {
    console.error('[newsletter] Resend add-contact threw', {
      message: (err as Error)?.message ?? String(err),
    });
    return { ok: false, status: 'error', message: 'Something went wrong. Please try again.' };
  }
}

async function sendWelcomeEmail(
  email: string,
  brand: NewsletterBrand,
  env: NewsletterEnv,
): Promise<void> {
  await fetch(`${RESEND_BASE}/emails`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.from,
      to: email,
      subject: `Welcome to ${brand.name} — better trips, delivered`,
      html: welcomeEmailHtml(brand),
    }),
  });
}

/** Subscriber count for the admin panel; null when not configured. */
export async function getSubscriberCount(brand: NewsletterBrand): Promise<number | null> {
  const env = getNewsletterEnv(brand);
  if (!env) return null;
  try {
    const res = await fetch(`${RESEND_BASE}/audiences/${env.audienceId}/contacts`, {
      headers: { authorization: `Bearer ${env.apiKey}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: unknown[] };
    return Array.isArray(body.data) ? body.data.length : null;
  } catch {
    return null;
  }
}

/**
 * Create + send a Resend broadcast (the newsletter itself) to the whole
 * audience. Resend injects the compliant unsubscribe footer. Returns the
 * broadcast id on success, null otherwise.
 */
export async function sendNewsletterBroadcast(args: {
  brand: NewsletterBrand;
  subject: string;
  html: string;
}): Promise<string | null> {
  const env = getNewsletterEnv(args.brand);
  if (!env) return null;
  try {
    const create = await fetch(`${RESEND_BASE}/broadcasts`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audience_id: env.audienceId,
        from: env.from,
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!create.ok) return null;
    const { id } = (await create.json()) as { id?: string };
    if (!id) return null;
    const send = await fetch(`${RESEND_BASE}/broadcasts/${id}/send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.apiKey}` },
    });
    return send.ok ? id : null;
  } catch {
    return null;
  }
}

function welcomeEmailHtml(brand: NewsletterBrand): string {
  const accent = brand.primaryColor;
  return `<!doctype html>
<html><body style="margin:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0c1426;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px -12px rgba(0,0,0,0.18);">
      <div style="background:${accent};height:6px;"></div>
      <div style="padding:34px 32px 8px;">
        <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${accent};">${brand.name}</p>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;font-weight:800;">Welcome aboard 👋</h1>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#475569;">
          Thanks for subscribing. You'll get occasional, genuinely useful travel ideas —
          where to go, when to visit, and where to stay — no spam, easy to unsubscribe anytime.
        </p>
        <p style="margin:22px 0 0;">
          <a href="${brand.siteUrl}/destinations" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;">
            Explore destinations →
          </a>
        </p>
      </div>
      <div style="padding:24px 32px 30px;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
          You're receiving this because you signed up at
          <a href="${brand.siteUrl}" style="color:#94a3b8;">${brand.domain}</a>.
          You can unsubscribe from any newsletter email in one click.
        </p>
      </div>
    </div>
  </div>
</body></html>`;
}
