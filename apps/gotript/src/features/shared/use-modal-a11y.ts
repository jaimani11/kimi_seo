'use client';

import { useEffect, useRef } from 'react';

/**
 * Modal accessibility primitives, in one hook.
 *
 * Handles:
 *  - ESC-to-close
 *  - Body scroll lock while the modal is mounted
 *  - Focus the first focusable element on mount
 *  - Trap focus within the modal (Tab cycles forward; Shift+Tab cycles back)
 *  - Restore focus to the previously-focused element on unmount
 *
 * Usage:
 *   const ref = useModalA11y(onClose);
 *   return <div ref={ref} role="dialog" aria-modal="true">…</div>;
 *
 * The element the ref points to is the modal's outermost container -
 * focus trap operates over its descendant focusable elements.
 *
 * Implementation notes:
 *  - All reads of `ref.current` happen inside event handlers (or
 *    deferred timers), never at the top of the effect body. Keeps
 *    React 19's compiler-aware lint rules happy + ensures we always
 *    see the current DOM rather than a captured stale reference.
 *  - The closer `onClose` is tracked in a ref so callers can pass an
 *    inline lambda without re-running the effect.
 */
export function useModalA11y(onClose: () => void): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  // Track the closer in a ref so the keydown effect doesn't re-run when
  // callers pass an inline `onClose` lambda whose identity changes per
  // render. Updating the ref inside its own effect (rather than during
  // render) satisfies React 19's no-mutation-during-render rule.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    // We capture the previously-focused element synchronously on mount
    // so focus restoration on unmount lands on the right thing even if
    // the user has focused elsewhere meanwhile.
    const previouslyFocused =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

    // Body scroll lock - store the prior overflow so we play nicely
    // with other overlays that might be present.
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function focusableElements(): HTMLElement[] {
      const root = ref.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('aria-hidden'));
    }

    // Autofocus the first focusable on mount (deferred one tick so the
    // DOM is settled). If nothing is focusable, do nothing.
    const focusTimer = window.setTimeout(() => {
      const first = focusableElements()[0];
      if (first) first.focus();
    }, 0);

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = ref.current;
      if (!root) return;
      const els = focusableElements();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const first = els[0]!;
      const last = els[els.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus on next tick so React has finished tearing down.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        window.setTimeout(() => previouslyFocused.focus(), 0);
      }
    };
  }, []);

  return ref;
}
