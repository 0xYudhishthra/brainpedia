import type { ComputeConfig } from './config.js';

export interface InferenceMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InferenceRequest {
  systemPrompt: string;
  userPrompt: string;
  /** Optional retrieved articles for RAG-style grounding. */
  context?: Array<{ slug: string; title: string; body: string }>;
}

export interface InferenceResponse {
  answer: string;
  /** Slugs cited from the context array, when applicable. */
  citations: string[];
  /** Self-reported confidence 0–1, if the model returns one. */
  confidence: number | null;
  /** Provider-reported usage (tokens or 0G units). */
  usage: { promptTokens: number; completionTokens: number; cost?: string };
}

/**
 * Per-Brain inference client. Each Brain instantiates this with its own
 * compute config (typically pinned via ENS text record `brain.compute_url`),
 * and the orchestrator instantiates one for the synthesis step.
 *
 * Day 2 swaps the body for:
 *   const broker = await createZGComputeNetworkBroker(wallet);
 *   const { secret } = await broker.inference.getProcessedSecret(providerAddr);
 *   const client = new OpenAI({ apiKey: secret, baseURL: `${providerUrl}/v1/proxy` });
 *   return client.chat.completions.create(...)
 */
export interface BrainInferenceClient {
  query(req: InferenceRequest): Promise<InferenceResponse>;
}

export function createBrainInferenceClient(
  _cfg: ComputeConfig,
  _signerPrivateKey: string,
): BrainInferenceClient {
  return {
    async query() {
      throw new Error('inference.query: not yet wired to 0G Compute broker (Day 2)');
    },
  };
}
