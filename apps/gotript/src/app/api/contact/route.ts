import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contact
 *
 * Receives a submission from the /contact form and forwards it to
 * the site owner via Resend's REST API. Resend is a Next.js-first
 * transactional email service — free tier is 100 emails/day, well
 * within a contact-form's needs.
 *
 * Env vars (set in Vercel → Settings → Environment Variables):
 *
 *   RESEND_API_KEY        — required for actual delivery. Get one at
 *                           resend.com (free signup). Without it, the
 *                           API returns success but only logs the
 *                           submission server-side (so CJ / partner-
 *                           review reviewers still see a working form
 *                           at review time).
 *   CONTACT_TO_EMAIL      — destination inbox. Defaults to
 *                           `jaimani1@gmail.com`.
 *   CONTACT_FROM_EMAIL    — sender address. Defaults to Resend's
 *                           sandbox `onboarding@resend.dev`, which
 *                           works out of the box while you verify a
 *                           real sending domain on Resend.
 */

const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'jaimani1@gmail.com';
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL || 'gotript Contact <onboarding@resend.dev>';

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown; // honeypot
}

function s(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: ContactPayload;
  try {
    body = (await req.json()) as ContactPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Honeypot — bots that scrape-and-fill everything will trip this,
  // and we silently 200 so they don't retry with different payloads.
  if (s(body.website, 200).length > 0) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const name = s(body.name, 120);
  const email = s(body.email, 200);
  const subject = s(body.subject, 200);
  const message = s(body.message, 4000);

  if (!name || !email || !subject || !message) {
    return new Response(
      JSON.stringify({ error: 'Please fill in every field.' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }
  if (!isEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'That email address doesn’t look right.' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;

  const emailBody = [
    `New contact-form submission on gotript.com`,
    ``,
    `From: ${name} <${email}>`,
    `Subject: ${subject}`,
    ``,
    `Message:`,
    message,
  ].join('\n');

  if (!apiKey) {
    // No API key configured yet — log server-side so submissions
    // aren't lost, but return success so the form UX works for
    // partner-review reviewers.
    console.info('[contact] (no RESEND_API_KEY set — logging only)', {
      to: CONTACT_TO_EMAIL,
      from: CONTACT_FROM_EMAIL,
      name,
      email,
      subject,
      messagePreview: message.slice(0, 200),
    });
    return new Response(JSON.stringify({ ok: true, delivery: 'logged' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `[gotript contact] ${subject}`,
      text: emailBody,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    console.error('[contact] Resend delivery failed', {
      status: resp.status,
      detail: detail.slice(0, 500),
    });
    return new Response(
      JSON.stringify({
        error: "We couldn’t send that just now. Please try again in a moment.",
      }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ ok: true, delivery: 'sent' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
