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

## Live state

| What | Address / link |
|---|---|
| `Brain.sol` (ERC-7857) | [`0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6`](https://chainscan-galileo.0g.ai/address/0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6) |
| Sample Brain mint tx | [`0x5ab3363a…1d4e509`](https://chainscan-galileo.0g.ai/tx/0x5ab3363ac12352b2c74e5da318c0cf4e2a1dcb463e4e97bc5cb6445ad1d4e509) |
| `tokenId 1` storage root | `0xa1418d3a60e882b4a5cf4a08d28f333ef3d22c21168bea2d927f14e4499a3c54` |
| `tokenId 1` minPayment | `0.001 OG / query` |
| 0G Compute provider | `0xa48f01287233509FD694a22Bf840225062E67836` (qwen-2.5-7b-instruct) |

Verify intelligence is embedded:

```bash
cast call 0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6 "currentStorageRoot(uint256)(bytes32)" 1 \
  --rpc-url https://evmrpc-testnet.0g.ai
# returns: 0xa1418d3a60e882b4a5cf4a08d28f333ef3d22c21168bea2d927f14e4499a3c54
```

## Submission checklist

- [x] Project name: Brainpedia
- [x] iNFT contract address on 0G testnet 16602 — `0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6`
- [x] GitHub repo with README
- [ ] Demo video < 3 mins
- [x] Live demo: https://brainpedia-web-production.up.railway.app
- [x] Architecture diagram → [architecture.md](architecture.md)
- [x] Swarm coordination explanation → above
- [x] Link to minted iNFT — [tokenId 1 mint tx](https://chainscan-galileo.0g.ai/tx/0x5ab3363ac12352b2c74e5da318c0cf4e2a1dcb463e4e97bc5cb6445ad1d4e509)

## Note on 0G Storage upload

The `@0glabs/0g-ts-sdk@0.3.3` (current latest on npm) encodes `submit()` with a 4-field struct, but the Flow contract on Galileo at `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` takes a 3-field struct on chain — the SDK is one ABI version behind. Until a matching SDK release lands, the storage root we put in the iNFT is `keccak256(JSON.stringify(snapshotManifest))` instead of the indexer-returned merkle root. Every other layer (KV reads, Brain.appendStorageRoot, ENS resolution) uses the same hash, so the contract chain is internally consistent — only the `Indexer.upload` step is bypassed.
