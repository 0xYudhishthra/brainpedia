import { keccak256, toHex, type Address } from 'viem';
import type { EnsClients } from './client.js';

/**
 * Subnames-as-access-tokens (the "Most Creative Use of ENS" angle).
 *
 * When an agent pays to query a Brain, the AccessTokenRegistrar issues
 * a one-time-use subname under `client.<parentName>`:
 *
 *     agent7af2.client.brainpedia.eth → resolves to the authorized session
 *
 * The subname expires (or is burned) after TTL or first use. The Brain
 * checks resolution at query time as a capability — no separate API key
 * system. The registrar enforces TTL on chain.
 */
export interface IssueAccessTokenInput {
  /** The agent's address that paid for the query. */
  agent: Address;
  /** Which Brain ENS name they have permission to query. */
  brainEnsName: string;
  /** Optional override (defaults to EnsConfig.accessTokenTtlSeconds). */
  ttlSeconds?: number;
}

export interface IssuedAccessToken {
  /** The full subname, e.g. agent7af2.client.brainpedia.eth */
  tokenName: string;
  /** Block timestamp at which the token expires. */
  expiresAt: number;
  txHash: `0x${string}`;
}

export function deriveAccessTokenLabel(agent: Address, brainEnsName: string, salt: bigint): string {
  // Short deterministic label so the agent can derive their token name without an extra read.
  const hash = keccak256(toHex(`${agent.toLowerCase()}|${brainEnsName}|${salt}`));
  return `agent${hash.slice(2, 10)}`;
}

export async function issueAccessToken(
  clients: EnsClients,
  input: IssueAccessTokenInput,
): Promise<IssuedAccessToken> {
  void clients.config.accessTokenRegistrarAddress;
  void input;
  throw new Error('issueAccessToken: not yet implemented (Day 3)');
}

export async function revokeAccessToken(
  clients: EnsClients,
  tokenName: string,
): Promise<{ txHash: `0x${string}` }> {
  void tokenName;
  throw new Error('revokeAccessToken: not yet implemented (Day 3)');
}

export async function isAccessTokenValid(
  _clients: EnsClients,
  _tokenName: string,
): Promise<boolean> {
  throw new Error('isAccessTokenValid: not yet implemented (Day 3)');
}
