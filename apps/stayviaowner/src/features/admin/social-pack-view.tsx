'use client';

import { useState, useTransition } from 'react';
import type {
  CitySocialPack,
  PinterestPin,
  ShortFormVideoScript,
} from '@lib/social/types';

/**
 * Tabbed view of a city's social pack with copy-to-clipboard per item
 * and a "Regenerate" button that calls `/api/social/generate`.
 *
 * Server renders the initial pack (either the static sample, the LLM
 * output, or the template fallback); client can swap it in place
 * after a regeneration.
 */
export function SocialPackView({
  pack: initialPack,
  citySlug,
}: {
  pack: CitySocialPack;
  citySlug: string;
}) {
  const [pack, setPack] = useState<CitySocialPack>(initialPack);
  const [tab, setTab] = useState<TabKey>('pinterest');
  const [pending, startTransition] = useTransition();
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const regenerate = (forceTemplate: boolean) => {
    setStatusNote(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/social/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            citySlug,
            skipSample: true,
            forceTemplate,
          }),
        });
        if (!res.ok) {
          setStatusNote(`Regeneration failed (HTTP ${res.status}).`);
          return;
        }
        const next = (await res.json()) as CitySocialPack;
        setPack(next);
        setStatusNote(`Regenerated · source: ${next.source}`);
      } catch (err) {
        setStatusNote(`Regeneration failed: ${(err as Error).message}`);
      }
    });
  };

  const counts: Record<TabKey, number> = {
    pinterest: pack.pinterest.length,
    tiktok: pack.tiktok.length,
    reels: pack.reels.length,
    shorts: pack.shorts.length,
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap gap-1">
          {(Object.keys(counts) as TabKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-pressed={tab === k}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                background:
                  tab === k ? 'var(--accent-primary)' : 'var(--surface-raised)',
                color: tab === k ? '#fff' : 'var(--ink-secondary)',
                border:
                  tab === k
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {TAB_LABELS[k]} ({counts[k]})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => regenerate(false)}
            disabled={pending}
            style={regenButtonStyle(pending)}
          >
            {pending ? 'Regenerating…' : 'Regenerate (auto)'}
          </button>
          <button
            type="button"
            onClick={() => regenerate(true)}
            disabled={pending}
            style={{ ...regenButtonStyle(pending), background: 'var(--surface-raised)', color: 'var(--ink-primary)' }}
          >
            Force template
          </button>
        </div>
      </div>

      {statusNote ? (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: 'var(--ink-secondary)',
            margin: 0,
          }}
        >
          {statusNote}
        </p>
      ) : null}

      {tab === 'pinterest' ? <PinterestList items={pack.pinterest} /> : null}
      {tab === 'tiktok' ? <ScriptList items={pack.tiktok} /> : null}
      {tab === 'reels' ? <ScriptList items={pack.reels} /> : null}
      {tab === 'shorts' ? <ScriptList items={pack.shorts} /> : null}
    </div>
  );
}

type TabKey = 'pinterest' | 'tiktok' | 'reels' | 'shorts';

const TAB_LABELS: Record<TabKey, string> = {
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
  reels: 'Reels',
  shorts: 'Shorts',
};

function regenButtonStyle(pending: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-inter)',
    fontSize: '0.78rem',
    fontWeight: 600,
    padding: '0.4rem 0.9rem',
    borderRadius: '999px',
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    cursor: pending ? 'wait' : 'pointer',
    opacity: pending ? 0.7 : 1,
  };
}

// ============== Pinterest ==============

function PinterestList({ items }: { items: PinterestPin[] }) {
  return (
    <ol
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
      style={{ listStyle: 'none', padding: 0, margin: 0 }}
    >
      {items.map((pin, i) => (
        <li
          key={i}
          className="flex flex-col gap-2 rounded-xl border p-4"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <header className="flex items-baseline justify-between gap-2">
            <p
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.7rem',
                color: 'var(--ink-tertiary)',
                margin: 0,
              }}
            >
              Pin #{i + 1}
            </p>
            <CopyAllButton
              payload={[
                `TITLE: ${pin.title}`,
                ``,
                `DESCRIPTION: ${pin.description}`,
                ``,
                `VISUAL: ${pin.visualConcept}`,
                ``,
                `CTA: ${pin.cta}`,
                ``,
                `HASHTAGS: ${pin.hashtags.join(' ')}`,
              ].join('\n')}
            />
          </header>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            {pin.title}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              color: 'var(--ink-secondary)',
              margin: 0,
            }}
          >
            {pin.description}
          </p>
          <FieldLabel>Visual</FieldLabel>
          <p style={fieldValueStyle}>{pin.visualConcept}</p>
          <FieldLabel>CTA</FieldLabel>
          <p style={fieldValueStyle}>{pin.cta}</p>
          <FieldLabel>Hashtags</FieldLabel>
          <p
            style={{
              ...fieldValueStyle,
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.78rem',
            }}
          >
            {pin.hashtags.join(' ')}
          </p>
        </li>
      ))}
    </ol>
  );
}

// ============== Short-form video scripts ==============

function ScriptList({ items }: { items: ShortFormVideoScript[] }) {
  return (
    <ol
      className="grid grid-cols-1 gap-3"
      style={{ listStyle: 'none', padding: 0, margin: 0 }}
    >
      {items.map((s, i) => (
        <li
          key={i}
          className="flex flex-col gap-2 rounded-xl border p-4"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <header className="flex items-baseline justify-between gap-2">
            <p
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '0.7rem',
                color: 'var(--ink-tertiary)',
                margin: 0,
              }}
            >
              {s.platform} · script #{i + 1} · {s.durationSec}s
            </p>
            <CopyAllButton payload={scriptToText(s)} />
          </header>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              margin: 0,
            }}
          >
            Hook: {s.hook}
          </p>
          <ol
            className="flex flex-col gap-2"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {s.scenes.map((scene, sceneIdx) => (
              <li
                key={sceneIdx}
                className="grid grid-cols-[3.5rem_1fr] gap-3 rounded-lg border p-3"
                style={{
                  background: 'var(--surface-raised)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--ink-tertiary)',
                  }}
                >
                  scene {sceneIdx + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <FieldLabel>Visual</FieldLabel>
                  <p style={fieldValueStyle}>{scene.visual}</p>
                  <FieldLabel>Text overlay</FieldLabel>
                  <p style={fieldValueStyle}>{scene.text}</p>
                  <FieldLabel>Voiceover</FieldLabel>
                  <p style={fieldValueStyle}>{scene.voiceover}</p>
                </div>
              </li>
            ))}
          </ol>
          <FieldLabel>CTA</FieldLabel>
          <p style={fieldValueStyle}>{s.cta}</p>
          <FieldLabel>Music</FieldLabel>
          <p style={fieldValueStyle}>{s.musicCue}</p>
          <FieldLabel>Hashtags</FieldLabel>
          <p
            style={{
              ...fieldValueStyle,
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.78rem',
            }}
          >
            {s.hashtags.join(' ')}
          </p>
        </li>
      ))}
    </ol>
  );
}

function scriptToText(s: ShortFormVideoScript): string {
  const lines = [
    `PLATFORM: ${s.platform}`,
    `DURATION: ${s.durationSec}s`,
    `MUSIC: ${s.musicCue}`,
    ``,
    `HOOK: ${s.hook}`,
    ``,
    ...s.scenes.flatMap((scene, i) => [
      `SCENE ${i + 1}`,
      `  Visual: ${scene.visual}`,
      `  Text: ${scene.text}`,
      `  Voiceover: ${scene.voiceover}`,
      ``,
    ]),
    `CTA: ${s.cta}`,
    ``,
    `HASHTAGS: ${s.hashtags.join(' ')}`,
  ];
  return lines.join('\n');
}

// ============== Shared bits ==============

function CopyAllButton({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(payload);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          // ignore — older browsers
        }
      }}
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '0.3rem 0.7rem',
        borderRadius: '999px',
        background: copied ? 'var(--accent-primary)' : 'var(--surface-raised)',
        color: copied ? '#fff' : 'var(--ink-secondary)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.6rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight: 700,
        color: 'var(--ink-tertiary)',
        margin: '0.3rem 0 0',
      }}
    >
      {children}
    </p>
  );
}

const fieldValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.88rem',
  lineHeight: 1.5,
  color: 'var(--ink-secondary)',
  margin: 0,
};
