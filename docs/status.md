# Live state

> Last updated: 2026-05-02. Full Brainpedia stack live. 7 Brain iNFTs minted across two cohorts (post-redeploy + the original orphaned set). Mixture-of-Brains queries return TEE-attested cited answers. Royalty splits already settled on chain. MCP server published to npm.

## TL;DR

```bash
bun install && bun run --cwd scripts verify-live
```

11 read-only on-chain checks should all pass. The same checks render at https://brainpedia.up.railway.app/status on every page load. To test mixture-of-brains:

```bash
curl -X POST 'https://brainpedia.up.railway.app/api/query?mode=mixture' \
  -H 'content-type: application/json' \
  -d '{"prompt":"safest stablecoin yield"}'
```

Returns per-brain answers, citation-weighted royalty splits, and the `RoyaltyDistributor` address ready to settle.

## Deployed contracts (Galileo + Sepolia)

| Contract | Network | Address |
|---|---|---|
| `Brain.sol` (ERC-7857 iNFT) | 0G Galileo (16602) | [`0x4E5c…b08F`](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F) |
| `BrainMinter` (permissionless mint wrapper) | 0G Galileo | [`0xcca5…a2e7`](https://chainscan-galileo.0g.ai/address/0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7) |
| `RoyaltyDistributor` (single-tx multi-Brain settle) | 0G Galileo | [`0x44ea…0649`](https://chainscan-galileo.0g.ai/address/0x44eaad4fdb7d509cd3fe7624ce512cc97b910649) |
| `SubnameRegistrar` | Sepolia (11155111) | [`0xBb92…28F0`](https://sepolia.etherscan.io/address/0xBb921bFFBbbE2219D1EC365213a74097348F28F0) |
| `AccessTokenRegistrar` | Sepolia | [`0x3e7D…456b`](https://sepolia.etherscan.io/address/0x3e7D22150d6b883a89703d760d66743D2223456b) |

Deployer wallet for all five: `0xD24e06f0DBadA268314DbcB97F48f87b85b6Dd30`. (The original `0x0a9a3BB8…` was lost mid-build; everything was redeployed under the new key. The orphaned `brainpedia.eth` parent + Brain.sol at `0x928940c1…3Ef6` and old registrars remain on chain as historical artefacts.)

## ENS — Sepolia

| Name | What |
|---|---|
| [`bpedia.eth`](https://sepolia.app.ens.domains/bpedia.eth) | Parent name, deployer-owned (unwrapped on Registry), both registrars approved on Registry + Public Resolver |
| [`client.bpedia.eth`](https://sepolia.app.ens.domains/client.bpedia.eth) | Subnode owned by `AccessTokenRegistrar` |
| [`discover.bpedia.eth`](https://sepolia.app.ens.domains/discover.bpedia.eth) | Subnode owned by deployer for topic shortcuts |

### Brains (current cohort under `bpedia.eth`)

| Subname | tokenId | Specialty | Source |
|---|---|---|---|
| [`yudhi.bpedia.eth`](https://sepolia.app.ens.domains/yudhi.bpedia.eth) | 7 | `defi-yield-strategies` | Vault-derived (`scripts/demo/yudhi-vault/` via Railway Obsidian) |
| [`karpathy.bpedia.eth`](https://sepolia.app.ens.domains/karpathy.bpedia.eth) | 6 | `llm-wiki-pattern` | Vault-derived (`scripts/demo/karpathy-vault/` via Railway Obsidian) |
| (deprecated) `vaultdemo.bpedia.eth`, `vaultdemo2.bpedia.eth`, `malaysia.bpedia.eth`, `rwa.bpedia.eth` | 2-5 | various | Test fixtures, dropped from active discovery shortcuts |
| (deprecated) original `yudhi` | 1 | `defi-yield-strategies` | Mock-seeded; retained on chain as the historical "before" snapshot |

### Discovery shortcuts (by practice)

| Shortcut | Resolves to |
|---|---|
| [`research.discover.bpedia.eth`](https://sepolia.app.ens.domains/research.discover.bpedia.eth) | `yudhi.bpedia.eth` |
| [`frameworks.discover.bpedia.eth`](https://sepolia.app.ens.domains/frameworks.discover.bpedia.eth) | `karpathy.bpedia.eth` |
| [`all.discover.bpedia.eth`](https://sepolia.app.ens.domains/all.discover.bpedia.eth) | `yudhi.bpedia.eth`, `karpathy.bpedia.eth` (homepage graph reads this) |

### Sample access token

[`agentf14abfb4.client.bpedia.eth`](https://sepolia.app.ens.domains/agentf14abfb4.client.bpedia.eth) — issued via `AccessTokenRegistrar.issue(label, agent, brainNameHash, ttl)`. Verified: `isValid(label, agent)` returns `true` for the granted agent and `false` for any other.

## iNFT — proof intelligence is embedded

```bash
cast call 0x4E5c6DC869F9B3220F01de9047031cEd1577b08F \
  "currentStorageRoot(uint256)(bytes32)" 7 \
  --rpc-url https://evmrpc-testnet.0g.ai
# returns the merkle root that resolves to yudhi's article snapshot on the
# 0G Storage indexer; every article's contentHash matches.
```

For karpathy (tokenId 6), `currentStorageRoot(6)` returns the root of the 16-page LLM-Wiki vault.

## 0G Compute

| | |
|---|---|
| Provider | [`0xa48f0128…7836`](https://chainscan-galileo.0g.ai/address/0xa48f01287233509FD694a22Bf840225062E67836) |
| URL | `https://compute-network-6.integratenetwork.work` |
| Model | `qwen/qwen-2.5-7b-instruct` (TEE-attested) |
| Ledger | Acknowledged for the new deployer wallet; live inference verified end-to-end on every `/api/query` call |

## AXL

| | |
|---|---|
| Bootstrap node | Railway service `axl-bootstrap`, persistent peer id `cb4cc722…3b8`, mesh listener on `[::]:7000` |
| Per-Brain demo | `scripts/demo/axl_demo.py` spins up 4 separate Yggdrasil daemons + brain stubs (orchestrator + 3 brains) |
| Brain runtime | `apps/brain` registers with the local AXL MCP router via `POST /register {service:"brainpedia.brain", endpoint:"http://127.0.0.1:7100/mcp"}` |
| Web `/api/query` | Routes through `AxlClient.mcp(peerId, 'brainpedia.brain', request)` when `AXL_API_URL` is set; falls back to direct HTTPS otherwise |

## Royalty splits — verified on chain

`RoyaltyDistributor.distribute(tokenIds, amounts, reason)` settles N Brain payments in one tx with citation-weighted shares. Settlement script: `scripts/setup/settle-royalties.ts`. Live proof: tx [`0x9637800e…`](https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e) settled 2 brains in one call with two `Distributed` events.

## Hosted Obsidian (demo)

| | |
|---|---|
| VNC (setup) | https://brainpedia-obsidian-production.up.railway.app — KasmVNC running Obsidian + Local REST API plugin |
| Public REST API | `tramway.proxy.rlwy.net:12789` (Railway TCP proxy → container `27123`) |
| Per-user namespacing | `OBSIDIAN_VAULT_PATH=users/<handle>` scopes reads to a folder; `users/karpathy/`, `users/yudhi/` already populated |
| Used by | `setup_brain` MCP tool when `OBSIDIAN_REST_API_KEY` is set; also by `seed-from-vault.ts` |

## Web

- https://brainpedia.up.railway.app — homepage with D3 force-directed network viz, server-renders from `all.discover.bpedia.eth`'s `brainpedia.brains` text record
- https://brainpedia.up.railway.app/yudhi — per-Brain page (live ENS resolution + article list + in-page query demo)
- https://brainpedia.up.railway.app/karpathy — same shape, LLM-Wiki content
- https://brainpedia.up.railway.app/api/query — single-brain proxy
- https://brainpedia.up.railway.app/api/query?mode=mixture — fan-out + payment plan
- https://brainpedia.up.railway.app/status — 11 read-only health checks against on-chain state

## MCP server distribution

[`brainpedia-mcp@0.1.1` on npm](https://www.npmjs.com/package/brainpedia-mcp) — single bundled binary (1.5 MB), all 5 workspace deps inlined. Install: `npx -y brainpedia-mcp`. Same tool surface in Claude Code and Claude Desktop.

## Code health

- 14 workspace packages, all typecheck under `bun run typecheck`
- CI green on the latest `main` (build + contracts jobs both pass)
- 5 MCP tools (`setup_brain`, `upload_articles`, `finalize_brain`, `query_brain`, `sync_vault`) wired end-to-end and shipped on npm
- ~12 helper scripts under `scripts/setup/` covering deploy, seed, settle, verify

## What's left

| Task | Owner |
|---|---|
| Demo video (under 3 min) | User |
| Run the published MCP server end-to-end inside Claude Code on the user's MacBook | User |
| Mixture-of-Brains UI on the homepage (currently API-only) | Dev — pending |
| Hyperlink pass on per-Brain page (addresses → explorers) | Dev — in progress |
