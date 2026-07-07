import Script from 'next/script';

/**
 * Analytics script tags. Server component, injects whichever backend
 * is configured. No-ops when neither env var is set so dev / preview
 * deploys never hit external analytics.
 */
export function AnalyticsScript() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      {plausibleDomain ? (
        <Script
          src="https://plausible.io/js/script.outbound-links.js"
          data-domain={plausibleDomain}
          strategy="afterInteractive"
        />
      ) : null}
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
