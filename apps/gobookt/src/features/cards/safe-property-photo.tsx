'use client';

import Image from 'next/image';
import { useState } from 'react';
import { propertyPhotoUrl, type PropertyPhoto } from '@lib/discovery/property';

interface SafePropertyPhotoProps {
  photo: PropertyPhoto;
  /** Image width hint passed to the CDN. Use the largest dimension a
   *  given card actually renders at. */
  width: number;
  /** Used by next/image to pick the right candidate from the srcset. */
  sizes: string;
  /** Use priority for above-the-fold cards only. */
  priority?: boolean;
  /** Hover-zoom on the image. Off for compact carousel cards where
   *  the surrounding container handles the translateY. */
  hoverZoom?: boolean;
}

/**
 * Shared photo renderer used by every card variant. On a 404/Network
 * error we fall back to the property's `fallbackGradient` so the card
 * never looks broken when Unsplash IDs rot.
 *
 * Why one shared component: every card has identical photo handling
 * needs (Next/Image, fill, object-cover, hover zoom on parent hover),
 * but cards have very different shapes around the photo. Centralizing
 * here lets each card focus on its layout while sharing the
 * graceful-degradation behavior we hard-won during the F1 work.
 */
export function SafePropertyPhoto({
  photo,
  width,
  sizes,
  priority,
  hoverZoom = true,
}: SafePropertyPhotoProps) {
  const [ok, setOk] = useState(true);

  if (!ok) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(140deg, ${photo.fallbackGradient[0]} 0%, ${photo.fallbackGradient[1]} 100%)`,
        }}
      />
    );
  }

  return (
    <Image
      src={propertyPhotoUrl(photo, width)}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setOk(false)}
      className={
        hoverZoom
          ? 'object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]'
          : 'object-cover'
      }
    />
  );
}
