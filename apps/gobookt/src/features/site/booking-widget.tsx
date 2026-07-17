'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

/**
 * Booking.com Affiliate Widget — gobookt's accommodation search.
 *
 * Why the widget instead of a hand-rolled form: every fixed CJ creative we have
 * (homepage banner 17293132, Advanced-Link 17323532) ignores a `?url=` deep-link
 * and dumps the user on the Booking.com HOMEPAGE — so a custom form can track
 * but can never carry the searched destination. Booking's own affiliate widget
 * runs the search INSIDE Booking's SDK, so the destination + dates AND the CJ
 * attribution both survive. It's the supported path to a tracked, city-correct
 * Booking.com search.
 *
 * gobookt-only. CJ creative 17323532, site 101803878, jdoqocy redirect domain
 * (already on the affiliate host allowlist). The `<img>` is the CJ impression
 * pixel from the creative. Rendered client-side (Booking's SDK builds an
 * iframe); a min-height reserves space so the iframe load causes no layout shift.
 */

declare global {
  interface Window {
    Booking?: { AffiliateWidget: new (config: unknown) => unknown };
  }
}

const WIDGET_ID = 'bookingAffiliateWidget_18a018c8-4aa6-48fa-af33-b904bc49b3e6';
// http→https: a plain-http resource is blocked as mixed content on our https pages.
const DESTINATION_OVERRIDE = 'https://www.jdoqocy.com/click-101803878-17323532?sid=';

export function BookingSearchWidget() {
  const inited = useRef(false);

  function init(): void {
    if (inited.current) return;
    if (typeof window === 'undefined' || !window.Booking?.AffiliateWidget) return;
    inited.current = true;
    // eslint-disable-next-line no-new
    new window.Booking.AffiliateWidget({
      iframeSettings: { selector: WIDGET_ID, responsive: true },
      widgetSettings: { destinationurloverride: DESTINATION_OVERRIDE },
    });
  }

  // Client-side nav: if the SDK already loaded on a previous page, init now.
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        src="https://www.booking.com/affiliate/prelanding_sdk"
        strategy="afterInteractive"
        onLoad={init}
      />
      <div
        id={WIDGET_ID}
        style={{ minHeight: 120, width: '100%' }}
        aria-label="Booking.com stay search"
      >
        &nbsp;
      </div>
      {/* CJ impression pixel (creative 17323532). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://www.ftjcfx.com/image-101803878-17323532"
        width={1}
        height={1}
        alt=""
        aria-hidden
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
    </>
  );
}
