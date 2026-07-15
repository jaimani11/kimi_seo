'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useModalA11y } from '@/features/shared/use-modal-a11y';
import { useMarketplaceDrawerStore, type MarketplaceDrawerItem } from './use-marketplace-drawer-store';
import { PropertyDrawerBody } from './property-drawer-body';

/**
 * Slide-in detail surface for the hybrid booking flow.
 *
 * Mounted once at the app root via `<MarketplaceDrawerHost />`.
 * Hero / standard / editorial cards open it; compact cards keep
 * their direct partner hand-off.
 *
 * The drawer is the storytelling moment. It should never feel
 * transactional - more "I want this trip" than "complete purchase."
 * That means:
 *
 *   - Full-bleed cinematic photo at the top
 *   - One italic pull line of editorial copy
 *   - Restrained metadata grid (cancellation, duration) only as
 *     a quiet footer
 *   - Single confident CTA. No urgency language, no countdowns,
 *     no "X people viewing this" pressure
 *   - Slow ease-in, slow ease-out (~400ms) - the curtain feel
 */
export function MarketplaceDrawerHost() {
  const item = useMarketplaceDrawerStore((s) => s.item);
  const close = useMarketplaceDrawerStore((s) => s.close);

  return (
    <AnimatePresence>{item ? <Drawer item={item} onClose={close} /> : null}</AnimatePresence>
  );
}

function Drawer({ item, onClose }: { item: MarketplaceDrawerItem; onClose: () => void }) {
  const dialogRef = useModalA11y(onClose);
  const titleId = 'marketplace-drawer-title';

  // Close on browser back / forward so the URL never gets out of sync
  // with what the user sees. Cheap, no router subscription needed.
  useEffect(() => {
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
        onClick={onClose}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 70,
          background: 'rgba(8, 10, 14, 0.62)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Panel */}
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 80,
          width: 'min(640px, 100vw)',
          background: 'var(--surface-base)',
          boxShadow: '-40px 0 80px rgba(0,0,0,0.55)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {item.kind === 'property' ? (
          <PropertyDrawerBody property={item.property} titleId={titleId} onClose={onClose} />
        ) : null}
      </motion.div>
    </>
  );
}
