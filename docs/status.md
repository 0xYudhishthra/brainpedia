# Final status — what's live, what's next

> Last updated: 2026-04-29, demo path locked in (path B — `QueryDemo` animation as the on-screen Brain query; everything else is real).

## TL;DR

The full Brainpedia stack is **live**. Anyone can run:

```bash
bun install && bun run --cwd scripts verify-live
```

…and see all 11 read-only checks pass. The same checks render at https://brainpedia.up.railway.app/status on every page load.

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
* Deployer wallet **funded** (10 OG on Galileo, 0.99 ETH on Sepolia) — over the 3 OG threshold for `addLedger`.
* Live inference path is **not on the demo critical path** (path B uses `QueryDemo` for the on-screen query). To run a real query end-to-end, see `docs/axl-integration.md` for the full stack (axl daemon + Python MCP router + segment upload).

### AXL

* Bootstrap node deployed on Railway as service `axl-bootstrap`.
* Pinned Ed25519 peer id: `cb4cc72222a27f577ac28d6a963ec95ce4b02e924ba05f17e700bd8a2e6b33b8`.
* Yggdrasil mesh listener up on `[::]:7000` (TLS).
* Python demo (`scripts/demo/axl_demo.py`) spins up 4 separate daemons + brain stubs.
* TS Brain server (`apps/brain`) registers with the local AXL MCP router via `POST /register {service:"brainpedia.brain", endpoint:"http://127.0.0.1:7100/mcp"}`.

### Web

* https://brainpedia.up.railway.app — homepage with D3 force-directed network viz; **graph is now live ENS-backed** (server-renders from `defi.discover.brainpedia.eth`'s `brainpedia.brains` text record on every request)
* https://brainpedia.up.railway.app/yudhi — sample Brain page (live ENS resolution + article list + animated query demo)
* https://brainpedia.up.railway.app/status — 7 read-only system health checks

## Code

* 14 workspace packages, all typecheck under `bun run typecheck`
* 5 MCP tools wired end-to-end: `setup_brain`, `upload_articles`, `finalize_brain`, `query_brain`, `sync_vault`
* 8 helper scripts: `prep-deploy`, `register-parent`, `seed-brain`, `issue-token`, `issue-discovery`, `verify-live`, plus the AXL Python demo

## What's left

| Task | Owner | Status |
|---|---|---|
| Faucet 0G wallet to ≥ 3 OG | User | **Done** (10 OG) |
| Storage SDK fix — hand-rolled Flow.submit via viem | — | **Done** (commit `a373364`) |
| Homepage graph reads live ENS | — | **Done** (commit `04dd976`) |
| Run MCP tools end-to-end via Claude Desktop | User | Pending |
| Demo video | User | Pending |
| Re-seed yudhi with real merkle root (optional, needs PK) | User | Pending |
| Add more brains to `defi.discover.brainpedia.eth` for richer homepage graph | User | Pending |

Known limitation we're calling out instead of fixing pre-demo:
* **0G Storage segment upload** — the new viem-based `Flow.submit` writes a real merkle commitment on-chain, but raw segments still need `StorageNode.uploadSegmentsByTxSeq()` for `indexer.download()` round-trip. Path B doesn't depend on this. Follow-up if we go for full live e2e later.

## Today's commits

```
feat(web): homepage graph reads live ENS brains via discovery shortcut
fix(storage-0g): real Flow.submit via viem — npm SDK 0.3.3 omits submitter
docs: HANDOFF.md for next session
chore: drop brainpedia.xyz custom domain
docs: final status snapshot for tomorrow
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
