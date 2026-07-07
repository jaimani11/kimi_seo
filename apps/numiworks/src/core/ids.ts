// Nominal/branded IDs. We use a tagged union over `string` so the compiler
// distinguishes IDs of different kinds. Values are still plain strings at runtime.

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type StayId = Brand<string, 'StayId'>; // `${ProviderId}:${nativeId}`
export type ProviderId = Brand<string, 'ProviderId'>;
export type AgentId = Brand<string, 'AgentId'>; // 'intent' | 'search' | ...
export type SessionId = Brand<string, 'SessionId'>;
export type TurnId = Brand<string, 'TurnId'>;
export type StepId = Brand<string, 'StepId'>;
export type ProposalId = Brand<string, 'ProposalId'>;

// Constructor helpers - the only way to mint a branded value at runtime.
// (We don't validate format here; producers like the orchestrator are
//  expected to pass shaped strings.)
export const stayId = (s: string): StayId => s as StayId;
export const providerId = (s: string): ProviderId => s as ProviderId;
export const agentId = (s: string): AgentId => s as AgentId;
export const sessionId = (s: string): SessionId => s as SessionId;
export const turnId = (s: string): TurnId => s as TurnId;
export const stepId = (s: string): StepId => s as StepId;
export const proposalId = (s: string): ProposalId => s as ProposalId;
