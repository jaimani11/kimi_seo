'use client';

import Image from 'next/image';
import { useState } from 'react';
import { pickExperiencePhoto, type Experience } from '@core/experience';

interface SafeExperiencePhotoProps {
  experience: Experience;
  width: number;
  sizes: string;
  priority?: boolean;
  hoverZoom?: boolean;
}

/**
 * Photo renderer for experience cards. Picks the right CDN variant
 * from the experience's photo list, falls back to a neutral gradient
 * when the URL fails or no photo exists.
 *
 * Unlike the property cards, experiences don't ship with a curated
 * `fallbackGradient` (the data comes from Viator at runtime). The
 * fallback is a neutral dark gradient consistent with the rest of
 * the cinematic dark theme.
 */
export function SafeExperiencePhoto({
  experience,
  width,
  sizes,
  priority,
  hoverZoom = true,
}: SafeExperiencePhotoProps) {
  const [ok, setOk] = useState(true);
  const photo = pickExperiencePhoto(experience.photos, width);

  if (!photo || !ok) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(140deg, #1a1f2a 0%, #3a4a5a 100%)',
        }}
      />
    );
  }

  return (
    <Image
      src={photo.url}
      alt={photo.alt ?? experience.title}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setOk(false)}
      className={
        hoverZoom
          ? 'object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]'
          : 'object-cover'
      }
      // next/image refuses unconfigured remote hosts. Viator uses
      // multiple CDN subdomains we don't know in advance; bypass the
      // optimizer for now and let the browser fetch the URL directly.
      // (Tradeoff: no automatic resizing/AVIF, but no 502s either.
      // We'll register Viator hosts in next.config once we know which.)
      unoptimized
    />
  );
}
