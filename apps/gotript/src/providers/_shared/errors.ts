// Provider error hierarchy. The orchestrator's degradation policy
// (spec §6.10) reads instanceof on these to classify failure modes.

export class ProviderError extends Error {
  readonly providerId?: string;
  constructor(message: string, providerId?: string) {
    super(message);
    this.name = 'ProviderError';
    if (providerId !== undefined) this.providerId = providerId;
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(message: string, providerId?: string) {
    super(message, providerId);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderEmptyResultError extends ProviderError {
  constructor(message: string, providerId?: string) {
    super(message, providerId);
    this.name = 'ProviderEmptyResultError';
  }
}
