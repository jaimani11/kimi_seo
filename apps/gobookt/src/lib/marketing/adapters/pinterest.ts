/**
 * Shim — the Pinterest adapter lives in @adored/marketing as a
 * brand-injected base class; this binds gobookt's link builder +
 * photo resolver.
 */
import { BasePinterestAdapter } from '@adored/marketing';
import { resolveDestinationPhoto } from '@adored/imagery';
import { brandedGobooktUrl } from '../branded-url';

export class PinterestAdapter extends BasePinterestAdapter {
  constructor() {
    super({
      buildLink: (args) => brandedGobooktUrl(args),
      resolvePhoto: (q) => resolveDestinationPhoto(q),
    });
  }
}
