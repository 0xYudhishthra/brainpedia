import { createPublicClient, http, type WalletClient } from 'viem';
import { addEnsContracts } from '@ensdomains/ensjs';
import type { ClientWithEns } from '@ensdomains/ensjs/contracts';
import { loadEnsConfig, viemChainForNetwork, type EnsConfig } from './config.js';

/**
 * Builds a viem PublicClient pre-configured with the ENS contract
 * deployment for the chosen network. We never hardcode Registry /
 * Resolver / NameWrapper addresses — `addEnsContracts` resolves them
 * from the chain id, which itself is selected by ENS_NETWORK env.
 */
export function createEnsPublicClient(cfg: EnsConfig = loadEnsConfig()): ClientWithEns {
  const chain = addEnsContracts(viemChainForNetwork(cfg.network));
  return createPublicClient({
    chain,
    transport: http(cfg.rpcUrl),
  });
}

export interface EnsClients {
  publicClient: ClientWithEns;
  config: EnsConfig;
  /** Optional — set when we need to write (subname registration, text record updates). */
  walletClient?: WalletClient;
}
