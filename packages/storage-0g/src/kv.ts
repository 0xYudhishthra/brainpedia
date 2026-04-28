import { keccak256, toUtf8Bytes, JsonRpcProvider, Wallet } from 'ethers';
import {
  Batcher,
  KvClient,
  Indexer,
  FixedPriceFlow__factory,
} from '@0glabs/0g-ts-sdk';
import type { ZgConfig } from './config.js';

/**
 * 0G Storage KV layer — used for the live, editable wiki state of a Brain.
 *
 * Wiring:
 *   - Batcher  (kv writes)  — needs storage nodes (from indexer.selectNodes),
 *                             a FixedPriceFlow contract instance, the EVM RPC.
 *   - KvClient (kv reads)   — points at the KV-node JSON-RPC endpoint.
 *
 * Stream id per Brain is a deterministic hash of the owner address so any
 * client (web app, MCP, other Brains) can derive and read state without an
 * out-of-band registry.
 */
export function streamIdForBrain(brainOwner: string): string {
  return keccak256(toUtf8Bytes(`brainpedia:${brainOwner.toLowerCase()}`));
}

export interface ArticleRecord {
  slug: string;
  title: string;
  body: string;
  /** Slugs of linked articles. */
  links: string[];
  /** Slugs of source notes used as inputs to compilation. */
  sources: string[];
  /** ISO-8601 last update. */
  updatedAt: string;
}

export interface BrainKvClient {
  putArticle(streamId: string, article: ArticleRecord): Promise<{ txHash: string }>;
  getArticle(streamId: string, slug: string): Promise<ArticleRecord | null>;
  listArticles(streamId: string): Promise<string[]>;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

const articleKey = (slug: string) => enc.encode(`article:${slug}`);
const indexKey = () => enc.encode('index:articles');

export function createBrainKvClient(cfg: ZgConfig, signerPrivateKey: string): BrainKvClient {
  const provider = new JsonRpcProvider(cfg.rpcUrl);
  const signer = new Wallet(signerPrivateKey, provider);
  const indexer = new Indexer(cfg.storageIndexerUrl);
  const flow = FixedPriceFlow__factory.connect(cfg.flowContractAddress, signer);
  const reader = new KvClient(cfg.kvRpcUrl);

  async function withBatcher<T>(fn: (b: Batcher) => Promise<T>): Promise<T> {
    const [nodes, err] = await indexer.selectNodes(1);
    if (err) throw err;
    const batcher = new Batcher(0, nodes, flow, cfg.rpcUrl);
    batcher.streamDataBuilder.addStreamId(''); // placeholder — caller will set keys
    return fn(batcher);
  }

  return {
    async putArticle(streamId, article) {
      return withBatcher(async (batcher) => {
        const value = enc.encode(JSON.stringify(article));
        batcher.streamDataBuilder.set(streamId, articleKey(article.slug), value);
        const [result, err] = await batcher.exec();
        if (err) throw err;
        return { txHash: result.txHash };
      });
    },

    async getArticle(streamId, slug) {
      const v = await reader.getValue(streamId, articleKey(slug));
      if (!v || !v.data) return null;
      try {
        return JSON.parse(dec.decode(Buffer.from(v.data, 'hex'))) as ArticleRecord;
      } catch {
        return null;
      }
    },

    async listArticles(streamId) {
      const v = await reader.getValue(streamId, indexKey());
      if (!v || !v.data) return [];
      try {
        return JSON.parse(dec.decode(Buffer.from(v.data, 'hex'))) as string[];
      } catch {
        return [];
      }
    },
  };
}
