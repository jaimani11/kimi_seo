'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * Interactive destination map — Leaflet over OpenStreetMap raster
 * tiles (no API key, attribution required and rendered). Leaflet is
 * loaded dynamically on mount so the library never runs during SSR
 * and never blocks first paint.
 *
 * Pin palette is fixed (not brand-accented) so the legend reads the
 * same across all four brands: center dot uses the brand accent,
 * attractions are amber, neighborhoods blue.
 *
 * Swapping tile providers later (e.g. a keyed MapTiler plan once
 * traffic justifies it) is a one-line change to TILE_URL.
 */

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const PIN_COLORS = {
  attraction: '#d97706',
  neighborhood: '#2563eb',
} as const;

export interface MapPin {
  lat: number;
  lng: number;
  label: string;
  kind: 'attraction' | 'neighborhood';
  /** Secondary popup line, e.g. "14 min walk from center". */
  detail?: string;
}

export function DestinationMap({
  cityName,
  center,
  pins,
  heightPx = 380,
}: {
  cityName: string;
  center: { lat: number; lng: number };
  pins: ReadonlyArray<MapPin>;
  heightPx?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinsKey = JSON.stringify(pins);

  useEffect(() => {
    let disposed = false;
    let map: import('leaflet').Map | null = null;

    (async () => {
      // Leaflet is UMD — depending on bundler interop the API surface
      // is either the module itself or its synthetic default.
      const mod = await import('leaflet');
      const L = (mod as { default?: typeof import('leaflet') }).default ?? mod;
      if (disposed || !containerRef.current) return;

      map = L.map(containerRef.current, {
        // Scroll-capture is hostile inside a long article — require a
        // click before the wheel zooms the map instead of the page.
        scrollWheelZoom: false,
        attributionControl: true,
      });
      map.on('click', () => map?.scrollWheelZoom.enable());

      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      const dot = (bg: string, size: number) =>
        L.divIcon({
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${bg};border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 1px 5px rgba(0,0,0,0.45)"></span>`,
        });

      const popupEl = (title: string, detail?: string) => {
        const root = document.createElement('div');
        root.style.cssText =
          'font-family:var(--font-inter),system-ui,sans-serif;font-size:13px;line-height:1.45;min-width:130px';
        const strong = document.createElement('strong');
        strong.textContent = title; // textContent — popup input is data, not markup
        root.appendChild(strong);
        if (detail) {
          const d = document.createElement('div');
          d.textContent = detail;
          d.style.cssText = 'opacity:0.72;margin-top:2px;font-size:12px';
          root.appendChild(d);
        }
        return root;
      };

      L.marker([center.lat, center.lng], {
        icon: dot('var(--accent-primary)', 16),
        zIndexOffset: 500,
      })
        .addTo(map)
        .bindPopup(popupEl(`${cityName} center`));

      for (const pin of pins) {
        L.marker([pin.lat, pin.lng], { icon: dot(PIN_COLORS[pin.kind], 13) })
          .addTo(map)
          .bindTooltip(pin.label, { direction: 'top', offset: [0, -8], opacity: 0.92 })
          .bindPopup(popupEl(pin.label, pin.detail));
      }

      if (pins.length > 0) {
        const bounds = L.latLngBounds([
          [center.lat, center.lng],
          ...pins.map((p) => [p.lat, p.lng] as [number, number]),
        ]);
        map.fitBounds(bounds.pad(0.22));
      } else {
        map.setView([center.lat, center.lng], 12);
      }
    })();

    return () => {
      disposed = true;
      map?.remove();
    };
    // pinsKey serializes pins; center changes always come with new pins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, pinsKey]);

  return (
    <div>
      <div
        ref={containerRef}
        role="application"
        aria-label={`Map of ${cityName}`}
        style={{
          height: `${heightPx}px`,
          borderRadius: '0.85rem',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          // Leaflet panes use z-index up to ~700 — isolate so they can
          // never float over the site header or dropdowns.
          position: 'relative',
          zIndex: 0,
          isolation: 'isolate',
          background: 'var(--surface-elevated)',
        }}
      />
      <p
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem 1.1rem',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.68rem',
          color: 'var(--ink-tertiary)',
          margin: '0.5rem 0 0',
        }}
      >
        <LegendDot color="var(--accent-primary)" label="City center" />
        {pins.some((p) => p.kind === 'attraction') ? (
          <LegendDot color={PIN_COLORS.attraction} label="Attractions" />
        ) : null}
        {pins.some((p) => p.kind === 'neighborhood') ? (
          <LegendDot color={PIN_COLORS.neighborhood} label="Neighborhoods" />
        ) : null}
        <span>Click the map to enable scroll zoom</span>
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem' }}>
      <span
        aria-hidden
        style={{
          width: '9px',
          height: '9px',
          borderRadius: '999px',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}
