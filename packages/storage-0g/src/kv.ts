import { keccak256, toUtf8Bytes } from 'ethers';
import type { ZgConfig } from './config.js';

/**
 * 0G Storage KV layer — used for the live, editable wiki state of a Brain.
 *
 * Wiring (filled in Day 2 against @0glabs/0g-ts-sdk):
 *   - Batcher: batches mutations against the Flow contract
 *   - KvClient: reads stream state from the storage indexer
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
  putArticle(streamId: string, article: ArticleRecord): Promise<void>;
  getArticle(streamId: string, slug: string): Promise<ArticleRecord | null>;
  listArticles(streamId: string): Promise<string[]>;
}

/**
 * Stub — Day 2 swaps for the real Batcher/KvClient pair.
 */
export function createBrainKvClient(_cfg: ZgConfig, _signerPrivateKey: string): BrainKvClient {
  return {
    async putArticle() {
      throw new Error('putArticle: not yet wired to @0glabs/0g-ts-sdk Batcher (Day 2)');
    },
    async getArticle() {
      throw new Error('getArticle: not yet wired to KvClient (Day 2)');
    },
    async listArticles() {
      throw new Error('listArticles: not yet wired to KvClient (Day 2)');
    },
  };
}
