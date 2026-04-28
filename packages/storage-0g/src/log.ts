import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile, unlink } from 'node:fs/promises';
import { JsonRpcProvider, Wallet, keccak256 } from 'ethers';
import { Indexer, MemData } from '@0glabs/0g-ts-sdk';
import type { ZgConfig } from './config.js';
import type { ArticleRecord } from './kv.js';

/**
 * 0G Storage Log layer — immutable snapshots of a Brain's compiled wiki.
 * The merkle root from each upload is what gets embedded in the
 * ERC-7857 iNFT IntelligentData and written to the ENS text record
 * `brain.storage_root` on the Brain's subname.
 */
export interface SnapshotManifest {
  brainOwner: string;
  createdAt: string;
  articleCount: number;
  articles: Array<{
    slug: string;
    contentHash: string; // keccak256 of the article body
    bytes: number;
  }>;
  /** Optional pointer back to the previous snapshot's root. */
  previousRoot: string | null;
  /** Articles inlined for snapshot self-containment. */
  payload: ArticleRecord[];
}

export interface SnapshotResult {
  /** Merkle root hash from the upload tree — what we put on chain. */
  rootHash: string;
  txHash: string;
  manifest: SnapshotManifest;
}

export interface BrainLogClient {
  uploadSnapshot(
    brainOwner: string,
    articles: ArticleRecord[],
    previousRoot?: string | null,
  ): Promise<SnapshotResult>;
  fetchSnapshot(rootHash: string): Promise<SnapshotManifest>;
}

const enc = new TextEncoder();

function hashBody(body: string): string {
  return keccak256(enc.encode(body));
}

export function createBrainLogClient(cfg: ZgConfig, signerPrivateKey: string): BrainLogClient {
  const provider = new JsonRpcProvider(cfg.rpcUrl);
  const signer = new Wallet(signerPrivateKey, provider);
  const indexer = new Indexer(cfg.storageIndexerUrl);

  return {
    async uploadSnapshot(brainOwner, articles, previousRoot = null) {
      const manifest: SnapshotManifest = {
        brainOwner: brainOwner.toLowerCase(),
        createdAt: new Date().toISOString(),
        articleCount: articles.length,
        articles: articles.map((a) => ({
          slug: a.slug,
          contentHash: hashBody(a.body),
          bytes: enc.encode(a.body).length,
        })),
        previousRoot,
        payload: articles,
      };

      const bytes = enc.encode(JSON.stringify(manifest));
      const file = new MemData(Array.from(bytes));

      const [res, err] = await indexer.upload(file, cfg.rpcUrl, signer as never);
      if (err) throw err;

      // Indexer.upload returns either single-file ({rootHash}) or fragments
      // ({rootHashes[]}). For our small JSON manifests it's always single-file.
      const r = res as {
        rootHash?: string;
        txHash?: string;
        rootHashes?: string[];
        txHashes?: string[];
      };
      const rootHash = r.rootHash ?? r.rootHashes?.[0];
      const txHash = r.txHash ?? r.txHashes?.[0];
      if (!rootHash || !txHash) throw new Error('indexer.upload returned empty result');

      return { rootHash, txHash, manifest };
    },

    async fetchSnapshot(rootHash) {
      // Indexer.download writes to disk (Node-only); round-trip through tmp.
      const tmp = join(tmpdir(), `brainpedia-${rootHash.replace(/^0x/, '')}.json`);
      const err = await indexer.download(rootHash, tmp, false);
      if (err) throw err;
      try {
        return JSON.parse(await readFile(tmp, 'utf8')) as SnapshotManifest;
      } finally {
        await unlink(tmp).catch(() => {});
      }
    },
  };
}
