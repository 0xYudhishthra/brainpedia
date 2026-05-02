# Final status — what's live, what's next

> Last updated: 2026-05-02. **Full redeploy under a new parent ENS name** (`bpedia.eth`) after the original `brainpedia.eth` deployer key was lost. Web URL unchanged. Live e2e query through Railway brain returns cited TEE-verified answer from `yudhi.bpedia.eth`. The "Live state" section below reflects post-redeploy addresses; the "What's left" table is unchanged at the bottom (most items still done — what was already shipped is shipped, just under new contracts). The orphaned `brainpedia.eth` parent + 3 old iNFTs (tokenIds 1-3 on the old Brain.sol) remain visible on chain as historical artifacts.

## TL;DR

The full Brainpedia stack is **live**. Anyone can run:

```bash
bun install && bun run --cwd scripts verify-live
```

…and see all 11 read-only checks pass. The same checks render at https://brainpedia.up.railway.app/status on every page load.

## Live state

### Deployed contracts (post-redeploy)

| Contract | Network | Address | Verify |
|---|---|---|---|
| `Brain.sol` (ERC-7857) | 0G Galileo (16602) | `0x4E5c6DC869F9B3220F01de9047031cEd1577b08F` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F) |
| `SubnameRegistrar` | Sepolia | `0xBb921bFFBbbE2219D1EC365213a74097348F28F0` | [sepolia.etherscan](https://sepolia.etherscan.io/address/0xBb921bFFBbbE2219D1EC365213a74097348F28F0) |
| `AccessTokenRegistrar` | Sepolia | `0x3e7D22150d6b883a89703d760d66743D2223456b` | [sepolia.etherscan](https://sepolia.etherscan.io/address/0x3e7D22150d6b883a89703d760d66743D2223456b) |

Deployer for all three: `0xD24e06f0DBadA268314DbcB97F48f87b85b6Dd30`.

### ENS (Sepolia)

| Name | What |
|---|---|
| `bpedia.eth` | Parent name, deployer-owned (unwrapped on Registry), both registrars approved on Registry + Public Resolver |
| `client.bpedia.eth` | Subnode owned by AccessTokenRegistrar (one-time setup) |
| `discover.bpedia.eth` | Subnode owned by deployer for topic shortcuts |
| `yudhi.bpedia.eth` | DeFi-yield-strategies Brain (tokenId 1, root `0xde0ebac7…ca37f`, 7/9 brain.* records resolving) |
| `defi.discover.bpedia.eth` | Topic discovery shortcut → 1 brain (yudhi) |

> Orphaned (lost-key state, on-chain forever): `brainpedia.eth`, `client.brainpedia.eth`, `discover.brainpedia.eth`, `yudhi.brainpedia.eth`, `malaysia.brainpedia.eth`, `rwa.brainpedia.eth`, `defi.discover.brainpedia.eth`, `agenta5b68322.client.brainpedia.eth`. Plus the old Brain.sol at `0x928940c1…3Ef6` and old registrars.

### iNFT — sample Brain (new)

* `Brain.currentStorageRoot(1)` = `0xde0ebac78dd387969c8aba6c9ce5ef149a9e726685207c0026ae1c0c155ca37f` (segments live on the indexer at txSeq=70884)
* `Brain.ownerOf(1)` = deployer (`0xD24e06f0…`)
* Min payment: 0.001 OG/query (set during seed)

### Compute

* 0G Compute provider pinned: `0xa48f01287233509FD694a22Bf840225062E67836`
* Provider URL: `https://compute-network-6.integratenetwork.work`
* Model: `qwen/qwen-2.5-7b-instruct`
* Broker initializes successfully against the provider.
* Deployer wallet (testnet): 4.08 OG remaining on Galileo, 0.99 ETH on Sepolia.
* **Live inference works end-to-end.** Ledger account created (tx `0x936473…`), provider acknowledged. Two confirmed real queries returned cited answers from the real on-chain manifest, both `verified: true`.
* Provider: `0xa48f01287233509FD694a22Bf840225062E67836`, model `qwen/qwen-2.5-7b-instruct`, 0.5 OG transferred to provider sub-account.

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
| Faucet 0G wallet | User | **Done** |
| Storage SDK fix — hand-rolled `Flow.submit` via viem | — | **Done** (`a373364`) |
| Storage segment upload via `uploadSegmentsByTxSeq` | — | **Done** (`f959b33`) |
| Homepage graph reads live ENS | — | **Done** (`04dd976`) |
| `apps/brain` audit fixes (access-token guard, verify swallow, broker reconnect) | — | **Done** (`c70eb98`) |
| Re-seed yudhi: real merkle root + segments uploaded + `appendStorageRoot(1, …)` | — | **Done** (Galileo tx `0xc0e5c925…`, ENS tx `0x998399d8…`) |
| 0G Compute ledger + provider acknowledgment | — | **Done** (Galileo txs `0x936473…`, `0xe98f69…`, `0x12e4f1…`) |
| Live e2e Brain query (ENS → storage → top-K → 0G Compute) | — | **Done** |
| Brain on Railway + `/api/query` proxy + `QueryDemo` wires to live | — | **Done** (`338c462`) |
| Mint 2 additional brains (malaysia, rwa) and add to discovery | — | Pending post-redeploy (only yudhi re-minted under bpedia.eth) |
| Local axl daemon up, configured at `:9012` API forwarding to MCP router on `:9003` | — | **Done** |
| MCP server validated; Claude Desktop config snippet on homepage | — | **Done** (`5e31ecd`) |
| Access-token enforcement re-enabled locally and confirmed (reject without, accept with) | — | **Done** |
| Run MCP tools end-to-end inside Claude Desktop on user's machine | User | Pending |
| Demo video | User | Pending |

## How to re-run a live query
The router + brain are still running locally. Fire another query:
```
curl -s -X POST http://127.0.0.1:9003/route -H 'Content-Type: application/json' -d '{
  "service":"brainpedia.brain",
  "request":{"jsonrpc":"2.0","id":1,"method":"query","params":{"prompt":"<your prompt>"}},
  "from_peer_id":"smoke"
}'
```

If the processes are gone, restart them:
```
# router
/home/yudhishthra/.venvs/axl-mcp-router/bin/python \
  /home/yudhishthra/src/axl/integrations/mcp_routing/mcp_router.py --port 9003 &

# brain (PRIVATE_KEY in env, never on disk)
ZG_WALLET_PRIVATE_KEY=… ZG_RPC_URL=https://evmrpc-testnet.0g.ai \
  ZG_COMPUTE_PROVIDER_ADDRESS=0xa48f01287233509FD694a22Bf840225062E67836 \
  ZG_COMPUTE_PROVIDER_URL=https://compute-network-6.integratenetwork.work \
  ZG_COMPUTE_MODEL=qwen/qwen-2.5-7b-instruct \
  ZG_INFT_CONTRACT_ADDRESS=0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6 \
  ENS_RPC_URL=https://ethereum-sepolia.publicnode.com ENS_NETWORK=sepolia \
  ENS_PARENT_NAME=brainpedia.eth \
  ENS_SUBNAME_REGISTRAR_ADDRESS=0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6 \
  ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS=0x36ce746e88b9098899fc8d0ab274c45748d04fd9 \
  BRAIN_ENS_NAME=yudhi.brainpedia.eth \
  BRAIN_STORAGE_ROOT=0x4e50c0447d3d837d0a6930ceb3345346aa17100d6cfee46785ad3b782c9c799b \
  BRAIN_SPECIALTY=defi-yield-strategies BRAIN_ENFORCE_ACCESS_TOKENS=false \
  bun run --cwd apps/brain start &
```

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
