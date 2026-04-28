import {
  loadZgConfig,
  createBrainLogClient,
  type ArticleRecord,
} from '@brainpedia/storage-0g';
import { loadComputeConfig, createBrainInferenceClient } from '@brainpedia/compute-0g';
import {
  loadEnsConfig,
  createEnsPublicClient,
  isAccessTokenValid,
  type EnsConfig,
} from '@brainpedia/ens';
import type { Address } from 'viem';

export interface BrainOptions {
  /** ENS name this Brain serves (used in responses + ENS resolution). */
  ensName: string;
  /** Latest 0G Storage merkle root (snapshot manifest). */
  storageRoot: string;
  /** Number of articles to retrieve as context per query. */
  topK?: number;
  /** Identity hex used to derive the system prompt. */
  specialty: string;
  /** Whether to enforce ENS access tokens. Defaults to true in production. */
  enforceAccessTokens?: boolean;
}

export interface BrainQueryRequest {
  prompt: string;
  /** ENS-issued access token, e.g. `agent7af2.client.brainpedia.eth`. */
  accessToken?: string;
  /** Address of the agent making the call (for access-token lookup). */
  agent?: Address;
}

export interface BrainQueryResult {
  answer: string;
  citations: string[];
  confidence: number | null;
  brainEnsName: string;
  storageRoot: string;
  verified: boolean;
}

/**
 * The pure query handler — no transport assumptions. Wire it behind
 * AXL's MCP routing, raw HTTP, A2A, or direct in-process calls.
 *
 * Day-of-demo wiring:
 *   1. fetchSnapshot(storageRoot) → SnapshotManifest with articles inlined
 *   2. naive top-K retrieval (substring match) for v0; swap for embeddings
 *      retrieval against KV-stored vectors in v1
 *   3. createBrainInferenceClient → 0G Compute call with system prompt +
 *      retrieved context + the user's prompt
 */
export function createBrainHandler(opts: BrainOptions, signerPrivateKey: string) {
  const zg = loadZgConfig();
  const compute = loadComputeConfig();
  const ens = loadEnsConfig();
  const log = createBrainLogClient(zg, signerPrivateKey);
  const inference = createBrainInferenceClient(compute, signerPrivateKey);
  const ensClient = createEnsPublicClient(ens);

  const systemPrompt =
    `You are ${opts.ensName} — a specialised Brain in the Brainpedia network. ` +
    `Your specialty: ${opts.specialty}. Answer ONLY from the provided context articles. ` +
    `Cite the slug of each article you use. If the context doesn't contain the answer, ` +
    `say so explicitly — do not hallucinate.`;

  return {
    async query(req: BrainQueryRequest): Promise<BrainQueryResult> {
      // 1. Access-token check (ENS subname capability).
      if (opts.enforceAccessTokens !== false && req.accessToken && req.agent) {
        const label = req.accessToken.split('.')[0]!;
        const ok = await isAccessTokenValid(
          { publicClient: ensClient, config: ens as EnsConfig },
          label,
          req.agent,
        );
        if (!ok) throw new Error(`brain.query: invalid access token "${req.accessToken}"`);
      }

      // 2. Retrieve articles (top-K from the latest snapshot).
      const manifest = await log.fetchSnapshot(opts.storageRoot);
      const articles = topKByPromptOverlap(req.prompt, manifest.payload, opts.topK ?? 4);

      // 3. Run inference.
      const result = await inference.query({
        systemPrompt,
        userPrompt: req.prompt,
        context: articles.map((a) => ({ slug: a.slug, title: a.title, body: a.body })),
      });

      return {
        answer: result.answer,
        citations: result.citations,
        confidence: result.confidence,
        brainEnsName: opts.ensName,
        storageRoot: opts.storageRoot,
        verified: result.verified,
      };
    },
  };
}

/**
 * Naive lexical retrieval — counts shared 4+-letter tokens between prompt and
 * each article. Replace with embeddings (stored as KV vectors) post-hackathon.
 */
function topKByPromptOverlap(prompt: string, articles: ArticleRecord[], k: number): ArticleRecord[] {
  const promptTokens = tokenise(prompt);
  return articles
    .map((a) => {
      const overlap = countOverlap(promptTokens, tokenise(`${a.title} ${a.body}`));
      return { article: a, score: overlap };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
    .map((s) => s.article);
}

function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 4),
  );
}

function countOverlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}
