'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Check, ExternalLink, Sparkle, X } from '@/features/shared/icons';
import { useReducedMotion } from '@/features/shared/motion/reduced-motion';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  /** Async because the slug is minted on first call. */
  resolve: () => Promise<{ slug: string; url: string } | null>;
  tripName: string;
}

/**
 * Modal that surfaces the share URL. Mounts the slug-mint request when
 * opened (lazy - most saved trips never get shared). Two affordances:
 *   - Copy link (clipboard, with a sparkle on success)
 *   - Open in new tab (preview the public view)
 *
 * Mobile: prefer Web Share API when available - single tap into native
 * share sheet (iMessage, WhatsApp, etc.).
 */
export function ShareModal({ open, onClose, resolve, tripName }: ShareModalProps) {
  const reduced = useReducedMotion();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    // Reset / kick off resolve when `open` flips. State writes here are
    // the legitimate "sync external state into React" pattern that
    // react-hooks/set-state-in-effect is supposed to allow.
    if (!open) {
      setUrl(null);
      setError(null);
      setCopied(false);
      return;
    }
    setResolving(true);
    setError(null);
    void resolve().then((result) => {
      if (!result) {
        setError('Could not generate a share link.');
      } else {
        setUrl(result.url);
        // Native share sheet first - better mobile UX. Falls through to
        // the modal if unsupported or rejected.
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
          navigator
            .share({
              title: `${tripName} on StayScout`,
              text: 'Take a look at this trip',
              url: result.url,
            })
            .catch(() => {
              // User cancelled or unsupported - modal stays.
            });
        }
      }
      setResolving(false);
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, resolve, tripName]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  async function copyToClipboard() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Clipboard access denied. Copy manually below.');
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="share-modal"
          className="fixed inset-0 z-40 grid place-items-center px-4"
          style={{ background: 'rgba(8, 10, 14, 0.6)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="Share this trip"
            className="w-full max-w-md rounded-[16px] border p-5"
            style={{
              background: 'rgba(20, 23, 28, 0.96)',
              borderColor: 'var(--border-emphasis)',
            }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduced ? 0.18 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-tertiary)',
                  }}
                >
                  Share
                </p>
                <h2
                  className="mt-1"
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: 'var(--text-display-sm)',
                    fontWeight: 400,
                    color: 'var(--ink-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {tripName}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close share dialog"
                className="grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-[color:var(--surface-overlay)]"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }}
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </header>

            <p
              className="mt-3"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'var(--text-body-sm)',
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'var(--ink-secondary)',
                lineHeight: 1.5,
              }}
            >
              Anyone with the link can see the trip. They can save it to their own StayScout - your
              saved copy stays separate.
            </p>

            {resolving ? (
              <p
                className="mt-4"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 'var(--text-body-sm)',
                  fontStyle: 'italic',
                  color: 'var(--ink-tertiary)',
                }}
              >
                Generating link…
              </p>
            ) : error ? (
              <p
                className="mt-4"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--accent-warning)',
                }}
              >
                {error}
              </p>
            ) : url ? (
              <>
                <div
                  className="mt-4 flex items-stretch gap-2 rounded-[10px] border px-3 py-2"
                  style={{
                    background: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <code
                    className="min-w-0 flex-1 truncate"
                    style={{
                      fontFamily: 'var(--font-geist-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--ink-primary)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {url}
                  </code>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 transition-opacity hover:opacity-90"
                    style={{
                      background: 'var(--accent-primary)',
                      color: '#14171C',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: 500,
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} strokeWidth={2.2} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Sparkle width={14} />
                        Copy link
                      </>
                    )}
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 transition-colors hover:bg-[color:var(--surface-overlay)]"
                    style={{
                      borderColor: 'var(--border-emphasis)',
                      color: 'var(--ink-primary)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: 500,
                    }}
                  >
                    Preview
                    <ExternalLink size={14} strokeWidth={1.8} />
                  </a>
                </div>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
