/**
 * GetYourGuide affiliate integration.
 *
 * Partner ID: SL52HD5 (approved; widgets + deeplinks tier — API access
 * requires 100k visits first, per GYG's partner tiering).
 *
 * Money path:
 *   Pinterest / TikTok / Google → numiworks.com/destinations/{city}
 *   → GYG widget (script auto-renders) OR text deeplink
 *   → booking on getyourguide.com
 *   → commission attributed via the `partner_id=SL52HD5` param
 *
 * ## What's here
 *
 * - `GYG_PARTNER_ID` — env-overridable (falls back to the approved id
 *   in code so a fresh clone still commissions).
 * - `buildGygSearchUrl(input)` — deep-link builder, mirrors the
 *   Viator/Expedia builders. Attaches `partner_id` + `cmp` (campaign)
 *   + `psrc` (page source) so per-page attribution rolls up in the
 *   GYG partner dashboard.
 * - `buildGygActivityUrl(activityId)` — deep-link for a specific
 *   activity id once we surface the widget's activity picks.
 *
 * Widgets are rendered via the `<GygActivitiesWidget>` component in
 * `features/experiences/getyourguide-widget.tsx`. Both surfaces use the
 * same partner id so commissions attribute identically whether the
 * booking comes through a widget-embedded search or a deeplink click.
 *
 * ## Future API path
 *
 * When we cross 100k visits and get API access, keep this builder
 * surface stable — the widget module can be swapped out for our own
 * server-rendered results component fed by the API, and every existing
 * caller (`<GygSearchLink destination="Tokyo">`) still works.
 */

export const GYG_PARTNER_ID = (process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? 'SL52HD5').trim();

export interface GygSearchInput {
  destination: string;
  /** Optional campaign tag for per-page attribution in the GYG
   *  partner dashboard (e.g. 'destination-tokyo', 'itinerary-3day'). */
  campaign?: string;
  /** Optional page source hint (e.g. 'guide', 'itinerary', 'social'). */
  source?: string;
}

/**
 * Build a GetYourGuide search deeplink for a destination string.
 *
 * URL shape:
 *   https://www.getyourguide.com/s/?q={destination}
 *     &partner_id={SL52HD5}
 *     &cmp={campaign}
 *     &psrc={source}
 */
export function buildGygSearchUrl(input: GygSearchInput): string {
  const params = new URLSearchParams();
  params.set('q', input.destination);
  params.set('partner_id', GYG_PARTNER_ID);
  // GYG's canonical publisher-attribution param — same signal their
  // Link Builder tool bakes in when you paste an expedia.com URL. We
  // set it here so every deeplink attributes as "online_publisher"
  // in the GYG partner dashboard (not "manual" or "widget").
  params.set('utm_medium', 'online_publisher');
  if (input.campaign) params.set('cmp', input.campaign);
  if (input.source) params.set('psrc', input.source);
  return `https://www.getyourguide.com/s/?${params.toString()}`;
}

/**
 * Build a GetYourGuide activity-detail deeplink from a numeric
 * activity id. Used once we surface widget-picked activities as
 * standalone cards.
 *
 * URL shape mirrors the Link-Builder-generated format:
 *   https://www.getyourguide.com/-t{activityId}/
 *     ?partner_id=SL52HD5&utm_medium=online_publisher
 *
 * The `-t{id}` prefix redirects to the canonical
 * `/{city-slug-l{destId}}/{activity-slug}-t{activityId}/` on
 * GetYourGuide's side — no need to look up the destination slug
 * client-side.
 */
export function buildGygActivityUrl(
  activityId: string | number,
  opts?: { campaign?: string; source?: string },
): string {
  const params = new URLSearchParams();
  params.set('partner_id', GYG_PARTNER_ID);
  params.set('utm_medium', 'online_publisher');
  if (opts?.campaign) params.set('cmp', opts.campaign);
  if (opts?.source) params.set('psrc', opts.source);
  return `https://www.getyourguide.com/-t${activityId}/?${params.toString()}`;
}
