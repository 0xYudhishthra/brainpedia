import OpenAI from 'openai';
import type { ComputeConfig } from './config.js';
import { createBroker, type BrokerHandle, type InferenceHandle } from './broker.js';

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
  usage: { promptTokens: number; completionTokens: number };
  /** Whether the TEE-signed response verified. */
  verified: boolean;
}

export interface BrainInferenceClient {
  query(req: InferenceRequest): Promise<InferenceResponse>;
}

/**
 * Per-Brain inference client. Each Brain instantiates this with its own
 * compute config (typically pinned via ENS text record `brain.compute_url`),
 * and the orchestrator instantiates one for the synthesis step.
 *
 * The OpenAI SDK is used as a transport — the actual auth flows through
 * 0G broker per-request headers (from `BrokerHandle.getInferenceClient`).
 */
export function createBrainInferenceClient(
  cfg: ComputeConfig,
  signerPrivateKey: string,
): BrainInferenceClient {
  if (!cfg.providerAddress) {
    throw new Error('createBrainInferenceClient: ZG_COMPUTE_PROVIDER_ADDRESS missing');
  }
  const broker: BrokerHandle = createBroker(cfg, signerPrivateKey);
  let handle: InferenceHandle | null = null;

  async function getHandle(): Promise<InferenceHandle> {
    if (!handle) {
      await broker.acknowledgeProvider(cfg.providerAddress!);
      handle = await broker.getInferenceClient(cfg.providerAddress!);
    }
    return handle;
  }

  return {
    async query(req) {
      const h = await getHandle();
      const userContent = composePrompt(req);
      const headers = await h.headersFor(userContent);

      const openai = new OpenAI({ baseURL: h.endpoint, apiKey: '' });

      const { data: completion, response } = await openai.chat.completions
        .create(
          {
            model: h.model,
            messages: [
              { role: 'system', content: req.systemPrompt },
              { role: 'user', content: userContent },
            ],
          },
          { headers },
        )
        .withResponse();

      const answer = completion.choices[0]?.message.content ?? '';
      const chatId = response.headers.get('ZG-Res-Key') ?? completion.id;
      const verified = await h.verify(chatId, answer).catch(() => false);

      return {
        answer,
        citations: extractCitations(answer, req.context ?? []),
        confidence: null,
        usage: {
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
        },
        verified,
      };
    },
  };
}

function composePrompt(req: InferenceRequest): string {
  if (!req.context?.length) return req.userPrompt;
  const ctx = req.context
    .map((c) => `## ${c.title} (${c.slug})\n${c.body}`)
    .join('\n\n---\n\n');
  return `Context:\n\n${ctx}\n\n---\n\nQuestion: ${req.userPrompt}`;
}

function extractCitations(
  answer: string,
  context: Array<{ slug: string; title: string }>,
): string[] {
  const found = new Set<string>();
  for (const c of context) {
    if (answer.includes(c.slug) || answer.includes(c.title)) found.add(c.slug);
  }
  return [...found];
}
