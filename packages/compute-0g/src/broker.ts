import type { ComputeConfig } from './config.js';

/**
 * Wraps the 0G serving broker for ledger ops:
 *   - depositFund / transferFund — pre-fund a provider for inference
 *   - listService              — discover providers + models
 *   - getProcessedSecret       — short-lived API key for the OpenAI-compat proxy
 *
 * Day 2 wires `createZGComputeNetworkBroker` against an ethers wallet built
 * from ZG_WALLET_PRIVATE_KEY + cfg.rpcUrl.
 */
export interface ProviderInfo {
  address: string;
  url: string;
  model: string;
  pricePerToken?: string;
}

export interface BrokerHandle {
  listProviders(): Promise<ProviderInfo[]>;
  ensureFunded(provider: string, minAmount: bigint): Promise<void>;
  /** Returns a short-lived API key + the proxy base URL for the OpenAI client. */
  getInferenceCredentials(provider: string): Promise<{ apiKey: string; baseURL: string }>;
}

export function createBroker(_cfg: ComputeConfig, _signerPrivateKey: string): BrokerHandle {
  return {
    async listProviders() {
      throw new Error('broker.listProviders: not yet wired (Day 2)');
    },
    async ensureFunded() {
      throw new Error('broker.ensureFunded: not yet wired (Day 2)');
    },
    async getInferenceCredentials() {
      throw new Error('broker.getInferenceCredentials: not yet wired (Day 2)');
    },
  };
}
