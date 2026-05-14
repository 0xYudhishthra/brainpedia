# 0G integration

> **Team**: Yudhishthra Sugumaran (solo). X [@0xYudhishthra](https://twitter.com/0xYudhishthra), Telegram `yudhishthra`.

## Features used

| 0G primitive | Where | Package |
|---|---|---|
| Storage **KV** | Live wiki state for in-progress edits | `@brainpedia/storage-0g` |
| Storage **Log** | Immutable snapshots, merkle root, embedded in iNFT | `@brainpedia/storage-0g` |
| **Compute** broker.ledger | Pay-per-query inference funding | `@brainpedia/compute-0g` |
| **Compute** OpenAI-compat client | Brain inference + synthesis | `@brainpedia/compute-0g` |
| **Compute** TEE attestation | Both brain creation (compile) AND query (inference). Same attestor signs both. | `@brainpedia/knowledge-compiler` + `@brainpedia/compute-0g` |
| **Chain** Aristotle mainnet (16661) | All contracts deployed and verified | `contracts/` |
| **iNFT** (ERC-7857 canonical) | One token per Brain, encrypted manifest sealed for owner, append-only `IntelligentData[]` | `contracts/src/Brain.sol` |
| **Oracle-attested transfers** | secureTransfer requires context-bound EIP-712 attestation that the new owner's pubkey re-sealed the manifest | `contracts/src/BrainOracle.sol` |
| **Royalty splits on usage** | Multi-Brain query, sticker-priced per-owner payment in one tx | `contracts/src/RoyaltyDistributor.sol` |

## How memory is embedded in the iNFT

Each Brain tokenId stores a list of `IntelligentData{ storageRoot, encryptedURI, metadataHash, createdAt, description }`. The storage root is the merkle root returned by an `Indexer.upload()` of the snapshot manifest + article files. To verify intelligence is embedded, anyone can:

1. Read `Brain.currentStorageRoot(tokenId)` from chain.
2. Fetch the file tree from the 0G Storage indexer using that root.
3. Parse the snapshot manifest and verify each article's contentHash matches.

This is cryptographic, not by-convention.

## Multi-format ingest

`@brainpedia/knowledge-compiler` is a format-agnostic pipeline turning any folder of mixed knowledge files into a Karpathy-style LLM wiki. Today's extractors: markdown (`.md`), plain text (`.txt`), PDF (`pdf-parse`), DOCX (`mammoth`). Adding a new file format means adding one Extractor implementation; the downstream segmenter, compiler, graph, snapshot, and mint stages stay untouched. The default compiler is deterministic (kebab-slug + substring cross-references). The opt-in `createComputeCompiler()` uses 0G Compute's TEE-attested Qwen 2.5 7B to rewrite each candidate as a focused wiki article with LLM-generated wikilinks, so 0G Compute appears at BOTH ends of a Brain lifecycle.

## Swarm coordination

Brains coordinate via three shared substrates:

1. **Communication**: AXL P2P transport between agents and Brain daemons. Encrypted Yggdrasil mesh, MCP / A2A envelopes, Ed25519 peer IDs.
2. **Identity & discovery**: ENS subnames (`*.bpedia.eth`) for Brain handles and TTL-bounded capability tokens (`agent<hash>.client.bpedia.eth`) for query authorization. Runs on Sepolia.
3. **Shared context**: 0G Storage. The orchestrator can read any Brain's current snapshot (looked up via the Brain's `brain.storage_root` ENS text record or directly via `Brain.currentStorageRoot(tokenId)`) for cross-Brain retrieval grounding.

No private state lives in the orchestrator; it's transparent and can be replaced by another orchestrator that reads the same on-chain + on-storage state.

## Live state (0G Aristotle mainnet, chainId 16661)

| What | Address / link |
|---|---|
| `Brain.sol` (ERC-7857) | [`0x4E5c6DC869F9B3220F01de9047031cEd1577b08F`](https://chainscan.0g.ai/address/0x4e5c6dc869f9b3220f01de9047031ced1577b08f) ([verified source ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x4e5c6dc869f9b3220f01de9047031ced1577b08f/verified-contracts)) |
| `BrainOracle` | [`0x923A0b7f21c57d92BFa8AA6721b574f47Fe5C5C0`](https://chainscan.0g.ai/address/0x923a0b7f21c57d92bfa8aa6721b574f47fe5c5c0) ([verified ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x923a0b7f21c57d92bfa8aa6721b574f47fe5c5c0/verified-contracts)) |
| `BrainMinter` | [`0x3e7D22150d6b883a89703d760d66743D2223456b`](https://chainscan.0g.ai/address/0x3e7d22150d6b883a89703d760d66743d2223456b) ([verified ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x3e7d22150d6b883a89703d760d66743d2223456b/verified-contracts)) |
| `RoyaltyDistributor` | [`0x7F26DeDe0c5E1Db844c9A8138C21cA3439B63C49`](https://chainscan.0g.ai/address/0x7f26dede0c5e1db844c9a8138c21ca3439b63c49) ([verified ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x7f26dede0c5e1db844c9a8138c21ca3439b63c49/verified-contracts)) |
| Flow contract (0G Storage Log) | `0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526` |
| Storage indexer | `https://indexer-storage-turbo.0g.ai` |
| `tokenId 1` (Yudhi's Brain) | mint [tx `0xb60080c6…`](https://chainscan.0g.ai/tx/0xb60080c60aeed1d134870971b5f14cb8fe2693e22c8fcadab7b6b122cad7427f) |
| `tokenId 2` (Brainpedia protocol Brain) | mint [tx `0xa54b53b9…`](https://chainscan.0g.ai/tx/0xa54b53b9c4ec94796d0ec3ace20515efebd203c4dcb48386bc08429815fefd5e) |
| `tokenId 3` (0G Expert Brain) | mint [tx `0x70618c4a…`](https://chainscan.0g.ai/tx/0x70618c4a4620bfb7397bd7cd6b177a69ae7586ddbb4ea0e00bde7d164c7e56d7) — 428 articles compiled from docs.0g.ai/llms-full.txt |
| Hero 3-brain mixture settlement | [tx `0x77202942…`](https://chainscan.0g.ai/tx/0x77202942ca382179c8a825eb48c0434a60dff3a273172ca11a25d8d6cbdb1341) — `RoyaltyDistributor.distribute([1, 2, 3], [0.002, 0.0015, 0.0035], reason)`, 3 `Distributed` events |
| 0G Compute provider | `0xa48f01287233509FD694a22Bf840225062E67836` (Qwen 2.5 7B, TEE-attested) |

Verify intelligence is embedded:

```bash
cast call 0x4E5c6DC869F9B3220F01de9047031cEd1577b08F \
  "currentStorageRoot(uint256)(bytes32)" 3 \
  --rpc-url https://evmrpc.0g.ai
# returns the 0G Expert Brain's merkle root from 0G Storage
```

## Submission checklist (0G APAC Hackathon, May 2026)

- [x] Project name: Brainpedia
- [x] 0G mainnet contract addresses (4, all verified on chainscan.0g.ai + explorer.0g.ai)
- [x] Verifiable on-chain activity (3 mints, 1 hero mixture settlement, ENS records)
- [x] At least one 0G core component integrated (5 of 5 used: Storage + Compute + Chain + Agent ID + Privacy/TEE)
- [x] GitHub repo with README
- [x] Live demo URL: https://brainpedia.up.railway.app (web mint flow at /create)
- [x] MCP server published: [`brainpedia-mcp` on npm](https://www.npmjs.com/package/brainpedia-mcp)
- [ ] 3-minute demo video (script in [submission-kit.md](submission-kit.md))
- [ ] Public X post with `#0GHackathon #BuildOn0G` and tags `@0G_labs @0g_CN @0g_Eco @HackQuest_` (draft in [submission-kit.md](submission-kit.md))
- [x] Architecture diagram, see [architecture.md](architecture.md)
- [x] Automatic royalty splits on usage, see "Royalty splits" section below

## Royalty splits on multi-Brain queries

When `/api/query?mode=mixture` fans out to N brains, each responding brain is paid exactly its advertised `brain.price_query` (canonical record format: `"0.001 OG"`):

```
amount_i = parsePriceQuery(brain_i.brain.price_query)   // sticker, in wei
totalAmountWei = Σ amount_i across responders
```

A brain that errored is excluded entirely; a brain whose `brain.price_query` record is missing is served free. Citations are surfaced in the response for transparency but do not affect amounts.

`RoyaltyDistributor.distribute(tokenIds[], amounts[], reason)` settles all shares in a single tx, looks up each `Brain.ownerOf(tokenId)` and forwards via raw `.call`. Surplus `msg.value` refunded to the orchestrator. `reason = keccak256("mixture:<prompt>")` so off-chain analytics can group settlements by query.

The web service then verifies the `Distributed` events against the cached payment plan before unlocking the synthesised answer (the agent posts back `sessionId + txHash` to claim it).

## Note on 0G Storage upload

`@0glabs/0g-ts-sdk@0.3.3` encodes the wrong ABI selector (`0xef3e12dc`, missing the `submitter` field). The deployed Flow takes the 2-field outer `Submission { SubmissionData data; address submitter; }` (selector `0xbc8c11f8`).

Workaround landed in `packages/storage-0g/src/submission.ts`: we reuse the SDK's `MemData` to compute the merkle tree, then hand-roll `Flow.submit` via viem with the correct tuple. Raw segments are then pushed via `StorageNode.uploadSegmentsByTxSeq()` (`uploadSegments` helper) so the indexer can serve `Indexer.download(rootHash)` round-trips. Storage root in every iNFT is the real Flow merkle root.

Important txSeq gotcha: the deployed Flow's `Submit` event has only 3 indexed topics, so `submissionIndex` lives in `data[0:32]`, not `topics[3]`. The first version of the seed script read `topics[3]` and silently produced `txSeq=undefined`, skipping the segment push. Fixed in commit history.
