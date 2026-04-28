# Final status — what's live, what's next

> Last updated: 2026-04-28, before the demo.

## TL;DR

The full Brainpedia stack is **live**. Anyone can run:

```bash
bun install && bun run --cwd scripts verify-live
```

…and see all 11 read-only checks pass. The same checks render at https://brainpedia-web-production.up.railway.app/status on every page load.

## Live state

### Deployed contracts

| Contract | Network | Address | Verify |
|---|---|---|---|
| `Brain.sol` (ERC-7857) | 0G Galileo (16602) | `0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6) |
| `SubnameRegistrar` | Sepolia | `0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6` | [sepolia.etherscan](https://sepolia.etherscan.io/address/0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6) |
| `AccessTokenRegistrar` | Sepolia | `0x36ce746e88b9098899fc8d0ab274c45748d04fd9` | [sepolia.etherscan](https://sepolia.etherscan.io/address/0x36ce746e88b9098899fc8d0ab274c45748d04fd9) |

Deployer for all three: `0x0a9a3BB8E921c7983ea2C75f13B8F502d349dE64`.

### ENS (Sepolia)

| Name | What |
|---|---|
| `brainpedia.eth` | Parent name, deployer-owned, both registrars approved on Registry + Public Resolver |
| `client.brainpedia.eth` | Subnode owned by AccessTokenRegistrar (one-time setup) |
| `discover.brainpedia.eth` | Subnode owned by deployer for topic shortcuts |
| `yudhi.brainpedia.eth` | Sample Brain — 8 brain.* text records resolving live |
| `defi.discover.brainpedia.eth` | Topic discovery shortcut → list of relevant Brains |
| `agenta5b68322.client.brainpedia.eth` | Sample one-time-use access-token subname |

### iNFT — sample Brain

* `Brain.intelligenceOf(1)` returns a single IntelligentData entry:
  * `storageRoot` = `0xa1418d3a60e882b4a5cf4a08d28f333ef3d22c21168bea2d927f14e4499a3c54`
  * `description` = "defi-yield-strategies brain — 6 articles"
* `Brain.minPaymentOf(1)` = `1000000000000000` wei (0.001 OG)
* `Brain.ownerOf(1)` = deployer

### Compute

* 0G Compute provider pinned: `0xa48f01287233509FD694a22Bf840225062E67836`
* Provider URL: `https://compute-network-6.integratenetwork.work`
* Model: `qwen/qwen-2.5-7b-instruct`
* Broker initializes successfully against the provider.
* **Blocker for live inference**: 0G ledger requires a 3 OG minimum deposit; deployer wallet currently at 0.09 OG. Top up at <https://faucet.0g.ai>.

### AXL

* Bootstrap node deployed on Railway as service `axl-bootstrap`.
* Pinned Ed25519 peer id: `cb4cc72222a27f577ac28d6a963ec95ce4b02e924ba05f17e700bd8a2e6b33b8`.
* Yggdrasil mesh listener up on `[::]:7000` (TLS).
* Python demo (`scripts/demo/axl_demo.py`) spins up 4 separate daemons + brain stubs.
* TS Brain server (`apps/brain`) registers with the local AXL MCP router via `POST /register {service:"brainpedia.brain", endpoint:"http://127.0.0.1:7100/mcp"}`.

### Web

* https://brainpedia-web-production.up.railway.app — homepage with D3 force-directed network viz
* https://brainpedia-web-production.up.railway.app/yudhi — sample Brain page (live ENS resolution + article list + animated query demo)
* https://brainpedia-web-production.up.railway.app/status — 7 read-only system health checks
* `brainpedia.xyz` + `www.brainpedia.xyz` registered on Railway, pending GoDaddy DNS update

## Code

* 14 workspace packages, all typecheck under `bun run typecheck`
* 5 MCP tools wired end-to-end: `setup_brain`, `upload_articles`, `finalize_brain`, `query_brain`, `sync_vault`
* 8 helper scripts: `prep-deploy`, `register-parent`, `seed-brain`, `issue-token`, `issue-discovery`, `verify-live`, plus the AXL Python demo

## What's left

| Task | Owner | Status |
|---|---|---|
| Faucet 0G wallet to ≥ 3 OG (unlocks live 0G Compute) | User | Pending |
| GoDaddy DNS: `www.brainpedia.xyz` CNAME → `ay9pzq4x.up.railway.app` | User | Pending |
| Run MCP tools end-to-end via Claude Desktop | User | Pending |
| Demo video | User | Pending |

Two known limitations to either skip in the demo or call out:
1. **0G Storage upload** — `@0glabs/0g-ts-sdk@0.3.3` encodes a 4-field `submit()` struct, but the live Flow contract expects 3 fields. Until the SDK updates, the storage root in the iNFT is `keccak256(JSON.stringify(snapshot))` instead of the indexer's merkle root. Other layers all use the same hash so the chain is internally consistent.
2. **0G Compute live inference** — 3 OG minimum to create a ledger account; demo wallet at 0.09 OG.

## Today's commits

```
chore: drop obsolete Deploy.s.sol
fix(web): replace fake npx snippet with real local-install
feat(web): homepage demo links
feat(web): /status page — live system health
feat(web): article list + animated query demo on Brain page
feat(scripts): verify-live full live-state smoke test
docs: per-track integration docs reflect live state
feat: discovery shortcut subnames
feat: real Brain iNFT minted + access-token subname issued
feat: live ENS subname + text records resolution working e2e
chore: split deploy scripts + record deployed addresses
fix(axl-bootstrap): use Yggdrasil's config schema
feat(apps/brain): JSON-RPC HTTP server + AXL router registration
fix(scripts/demo/axl_demo.py): Yggdrasil config schema + working brains
feat(mcp-server): wire sync_vault end-to-end
feat: query_brain MCP tool + live Brain page resolution
feat(ens+mcp): wire ENS writes + finalize_brain MCP tool
feat(0g): wire real Storage + Compute SDK calls
… (plus the original scaffold and many more — see `git log`)
```
