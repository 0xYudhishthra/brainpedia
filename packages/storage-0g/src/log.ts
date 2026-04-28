import type { ZgConfig } from './config.js';
import type { ArticleRecord } from './kv.js';

/**
 * 0G Storage Log layer — immutable snapshots of a Brain's compiled wiki.
 * Each snapshot returns a merkle root via `tree.rootHash()`. That root is
 * embedded into the ERC-7857 iNFT as IntelligentData, and written to the
 * ENS text record `brain.storage_root` on the Brain's subname.
 *
 * Day 2 wires the real Indexer.upload() call.
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
}

export interface SnapshotResult {
  /** Merkle root hash from the upload tree — what we put on chain. */
  rootHash: string;
  /** Indexer URL where the snapshot can be downloaded. */
  downloadUrl: string;
  manifest: SnapshotManifest;
}

export interface BrainLogClient {
  uploadSnapshot(brainOwner: string, articles: ArticleRecord[]): Promise<SnapshotResult>;
  fetchSnapshot(rootHash: string): Promise<SnapshotManifest>;
}

export function createBrainLogClient(_cfg: ZgConfig, _signerPrivateKey: string): BrainLogClient {
  return {
    async uploadSnapshot() {
      throw new Error('uploadSnapshot: not yet wired to Indexer.upload (Day 2)');
    },
    async fetchSnapshot() {
      throw new Error('fetchSnapshot: not yet wired to indexer (Day 2)');
    },
  };
}
