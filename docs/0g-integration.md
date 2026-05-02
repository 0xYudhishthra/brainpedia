# 0G integration

> Track: **Best Autonomous Agents, Swarms & iNFT Innovations** ($7,500, up to 5 winners × $1,500)
>
> **Team**: Yudhishthra Sugumaran (solo) — X [@0xYudhishthra](https://twitter.com/0xYudhishthra), Telegram `yudhishthra`

## Features used

| 0G primitive | Where | Package |
|---|---|---|
| Storage **KV** | Live wiki state for in-progress edits | `@brainpedia/storage-0g` |
| Storage **Log** | Immutable snapshots → merkle root → iNFT | `@brainpedia/storage-0g` |
| **Compute** broker.ledger | Pay-per-query inference funding | `@brainpedia/compute-0g` |
| **Compute** OpenAI-compat client | Brain inference + synthesis | `@brainpedia/compute-0g` |
| **Chain** (Galileo, 16602) | Brain.sol deployment | `contracts/` |
| **iNFT** (ERC-7857) | One token per Brain, append-only `IntelligentData[]` | `contracts/src/Brain.sol` |
| **Royalty splits on usage** | Multi-Brain query → sticker-priced per-owner payment in one tx (each brain paid its `brain.price_query`) | `contracts/src/RoyaltyDistributor.sol` |

## How memory is "embedded" in the iNFT

Each Brain tokenId stores a list of `IntelligentData{ storageRoot, createdAt, description }`. The storage root is the merkle root returned by an `Indexer.upload()` of the snapshot manifest + article files. To verify intelligence is embedded, anyone can:

1. Read `Brain.intelligenceOf(tokenId)` from chain.
2. Take the latest `storageRoot`.
3. Fetch the file tree from the 0G Storage indexer using that root.
4. Parse the snapshot manifest and verify each article's contentHash matches.

This is cryptographic, not by-convention.

## Swarm coordination

Brains coordinate via three shared substrates:

1. **Communication** — AXL (see [axl-integration.md](axl-integration.md)).
2. **Identity & discovery** — ENS (see [ens-integration.md](ens-integration.md)).
3. **Shared context** — 0G Storage. The orchestrator can read any Brain's current snapshot (from the snapshot's storage root, looked up via the Brain's `brain.storage_root` ENS text record) for cross-Brain retrieval grounding.

No private state lives in the orchestrator — it's transparent and can be replaced by another orchestrator that reads the same on-chain + on-storage state.

## Live state

| What | Address / link |
|---|---|
| `Brain.sol` (ERC-7857) | [`0x4E5c6DC869F9B3220F01de9047031cEd1577b08F`](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F) |
| `tokenId 1` storage root (yudhi, segments live) | `0xde0ebac78dd387969c8aba6c9ce5ef149a9e726685207c0026ae1c0c155ca37f` |
| `tokenId 2` storage root (malaysia, segments live) | `0xde0ebac78dd387969c8aba6c9ce5ef149a9e726685207c0026ae1c0c155ca37f` (shared with yudhi — same article bytes) |
| `tokenId 3` storage root (rwa, segments live) | `0x09616944759e09d98d84de4f63ba1c47d8f49b902a3177181b5d570bf7a23bc7` |
| `tokenId 4` storage root (vaultdemo, segments live) | `0x6ae520246cf343fe6d59f2f35fdc5cb4908d20f1b4d6a47b099ac414c3371c60` (real Obsidian vault: 11 cross-linked notes) |
| `tokenId 1-4` minPayment | `0.001 OG / query` each |
| 0G Compute provider | `0xa48f01287233509FD694a22Bf840225062E67836` (qwen-2.5-7b-instruct, TEE-attested) |
| `RoyaltyDistributor` | [`0x44eaad4fdb7d509cd3fe7624ce512cc97b910649`](https://chainscan-galileo.0g.ai/address/0x44eaad4fdb7d509cd3fe7624ce512cc97b910649) — single-tx multi-Brain settlement |

Verify intelligence is embedded:

```bash
cast call 0x4E5c6DC869F9B3220F01de9047031cEd1577b08F "currentStorageRoot(uint256)(bytes32)" 1 \
  --rpc-url https://evmrpc-testnet.0g.ai
# returns: 0xde0ebac78dd387969c8aba6c9ce5ef149a9e726685207c0026ae1c0c155ca37f
```

## Submission checklist

- [x] Project name: Brainpedia
- [x] iNFT contract address on 0G testnet 16602 — `0x4E5c6DC869F9B3220F01de9047031cEd1577b08F` (3 brains minted: yudhi/malaysia/rwa)
- [x] GitHub repo with README
- [ ] Demo video < 3 mins
- [x] Live demo: https://brainpedia.up.railway.app
- [x] Architecture diagram → [architecture.md](architecture.md)
- [x] Swarm coordination explanation → above
- [x] Link to minted iNFT — Brain.sol [`0x4E5c6DC8…b08F`](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F) holds tokenIds 1-4 (yudhi, malaysia, rwa, vaultdemo)
- [x] Automatic royalty splits on usage — sticker-priced per-Brain payments (each responder gets its own `brain.price_query`) computed per query in `/api/query?mode=mixture`, settled via `RoyaltyDistributor.distribute(tokenIds[], amounts[], reason)`. Synthesis is gated server-side until the on-chain `Distributed` events are verified to match the cached payment plan. Verified live: tx [`0x9637800e…`](https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e) settled 0.001 OG to tokenId 1 + 0.001 OG to tokenId 2 in one call, two `Distributed` events emitted on chain.

## Royalty splits on multi-Brain queries

When `/api/query?mode=mixture` fans out to N brains, each responding brain is paid exactly its advertised `brain.price_query` (canonical record format: `"0.001 OG"`):

```
amount_i = parsePriceQuery(brain_i.brain.price_query)   // sticker, in wei
totalAmountWei = Σ amount_i across responders
```

A brain that errored is excluded entirely; a brain whose `brain.price_query` record is missing is served free. Citations are surfaced in the response for transparency but do not affect amounts.

`RoyaltyDistributor.distribute(tokenIds[], amounts[], reason)` (`0x44eaad…0649` on Galileo) settles all shares in a single tx — looks up each `Brain.ownerOf(tokenId)` and forwards via raw `.call`. Surplus `msg.value` refunded to the orchestrator. `reason = keccak256("mixture:<prompt>")` so off-chain analytics can group settlements by query.

The web service then verifies the `Distributed` events against the cached payment plan before unlocking the synthesised answer (the agent posts back `sessionId + txHash` to claim it). End-to-end:

- `bun run scripts/setup/settle-royalties.ts --prompt "..."` — CLI version (no synthesis unlock; just settles)
- The MCP `query_mixture` tool (`brainpedia-mcp@0.1.5`) — runs phase-1 → settle → phase-2 unlock in one shot using the agent's wallet, returns the synthesised answer plus settlement proof.

## Note on 0G Storage upload

`@0glabs/0g-ts-sdk@0.3.3` encodes the wrong ABI selector (`0xef3e12dc`, missing the `submitter` field). The deployed Flow at `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` takes the 2-field outer `Submission { SubmissionData data; address submitter; }` (selector `0xbc8c11f8`).

Workaround landed in `scripts/setup/seed-brain.ts` and `packages/storage-0g/src/submission.ts`: we reuse the SDK's `MemData` to compute the merkle tree, then hand-roll `Flow.submit` via viem with the correct tuple. Raw segments are then pushed via `StorageNode.uploadSegmentsByTxSeq()` (`uploadSegments` helper) so the indexer can serve `Indexer.download(rootHash)` round-trips. Storage root in the live iNFT is the real Flow merkle root.

Important txSeq gotcha: the deployed Flow's `Submit` event has only 3 indexed topics — `submissionIndex` lives in `data[0:32]`, not `topics[3]`. The first version of the seed script read `topics[3]` and silently produced `txSeq=undefined`, skipping the segment push. Fixed in commit history.
