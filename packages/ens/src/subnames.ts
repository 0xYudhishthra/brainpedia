import type { Address } from 'viem';
import type { EnsClients } from './client.js';
import type { BrainTextRecords } from './types.js';

/**
 * Register `<label>.<parentName>` (e.g., yudhi.brainpedia.eth).
 *
 * Day 3 wires this against our deployed SubnameRegistrar.sol — the
 * address is resolved from EnsConfig (env), never inline.
 */
export interface RegisterSubnameInput {
  label: string;
  owner: Address;
  records?: BrainTextRecords;
}

export interface RegisterSubnameResult {
  fullName: string;
  txHash: `0x${string}`;
}

export async function registerSubname(
  clients: EnsClients,
  input: RegisterSubnameInput,
): Promise<RegisterSubnameResult> {
  const fullName = `${input.label}.${clients.config.parentName}`;
  void input.owner;
  void clients.config.subnameRegistrarAddress;
  throw new Error(`registerSubname(${fullName}): not yet implemented (Day 3)`);
}
