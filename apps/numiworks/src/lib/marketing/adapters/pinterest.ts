/**
 * Shim — the Pinterest adapter lives in @adored/marketing as a
 * brand-injected base class; this binds numiworks's link builder +
 * photo resolver.
 */
import { BasePinterestAdapter } from '@adored/marketing';
import { resolveDestinationPhoto } from '@adored/imagery';
import { brandedNumiworksUrl } from '../branded-url';

export class PinterestAdapter extends BasePinterestAdapter {
  constructor() {
    super({
      buildLink: (args) => brandedNumiworksUrl(args),
      resolvePhoto: (q) => resolveDestinationPhoto(q),
    });
  }
}
