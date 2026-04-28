# 0G integration

> Track: **Best Autonomous Agents, Swarms & iNFT Innovations** ($7,500)

## Features used

| 0G primitive | Where | Package |
|---|---|---|
| Storage **KV** | Live wiki state for in-progress edits | `@brainpedia/storage-0g` |
| Storage **Log** | Immutable snapshots → merkle root → iNFT | `@brainpedia/storage-0g` |
| **Compute** broker.ledger | Pay-per-query inference funding | `@brainpedia/compute-0g` |
| **Compute** OpenAI-compat client | Brain inference + synthesis | `@brainpedia/compute-0g` |
| **Chain** (Galileo, 16602) | Brain.sol deployment | `contracts/` |
| **iNFT** (ERC-7857) | One token per Brain, append-only `IntelligentData[]` | `contracts/src/Brain.sol` |

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

## Submission checklist

- [x] Project name: Brainpedia
- [ ] iNFT contract address on 0G testnet 16602 (set after deploy)
- [x] GitHub repo with README
- [ ] Demo video < 3 mins
- [ ] Live demo at brainpedia.xyz
- [x] Architecture diagram → [architecture.md](architecture.md)
- [x] Swarm coordination explanation → above
- [ ] Link to minted iNFT on `chainscan-galileo.0g.ai`
