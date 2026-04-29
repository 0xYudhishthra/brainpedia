# Handoff — pick up where the last session left off

> Quick onboard for another Claude session continuing the Brainpedia hackathon push.
> If you're a human reading this, the same notes apply — start here, then `verify-live`.

## First 60 seconds

```bash
cd /mnt/storage/brainpedia
bun install
bun run --cwd scripts verify-live   # 11 read-only on-chain checks; should be 11/11 green
git log --oneline -20               # what was shipped
cat docs/status.md                  # full state snapshot
cat ~/.claude/projects/-mnt-storage/memory/project_brainpedia.md
```

If `verify-live` is green you can trust everything below. If it isn't, something regressed — fix that first.

## What's already built

- **14 workspace packages**, all typecheck (`bun run typecheck`)
- **Live web** at https://brainpedia.up.railway.app (homepage with D3 viz, `/yudhi` Brain page with article list + animated query demo, `/status` server-rendered health checks)
- **Live AXL bootstrap** on Railway service `axl-bootstrap`, peer id `cb4cc72222a27f577ac28d6a963ec95ce4b02e924ba05f17e700bd8a2e6b33b8`
- **Real iNFT minted** on 0G Galileo: `Brain.sol` at `0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6`, tokenId 1 owned by deployer, 0.001 OG/query, storage root `0xa1418d3a…`
- **ENS infra on Sepolia**: `brainpedia.eth` registered (deployer-owned), `SubnameRegistrar` at `0x928940c1…3Ef6`, `AccessTokenRegistrar` at `0x36ce746e…4fd9`. Both approved on Registry + Public Resolver.
- **Sample subnames**: `yudhi.brainpedia.eth` (8 brain.* records resolving), `defi.discover.brainpedia.eth` (topic shortcut), `agenta5b68322.client.brainpedia.eth` (TTL access token)
- **5 MCP tools** wired (`setup_brain`, `upload_articles`, `finalize_brain`, `query_brain`, `sync_vault`)
- **8 helper scripts**: `prep-deploy`, `register-parent`, `seed-brain`, `issue-token`, `issue-discovery`, `verify-live`, plus the AXL Python demo (`scripts/demo/axl_demo.py`)

## What's pending — ordered by demo impact

### 1. Faucet 0G wallet to ≥ 3 OG  (**user task**, blocks live 0G Compute)

Deployer is `0x0a9a3BB8E921c7983ea2C75f13B8F502d349dE64`. Currently ~0.09 OG. The 0G Compute broker requires a 3 OG minimum to call `addLedger` — without it `acknowledgeProviderSigner` reverts with `AccountNotExists`. Faucet at https://faucet.0g.ai (cap per request, hit it 3-4 times).

Once funded, run an inference smoke test:

```bash
PK=<testnet-key-from-user-chat>
PK=$PK bun run /tmp/zg-test/infer.ts   # see prior session's history; pattern is in apps/brain/src/handler.ts
```

### 2. 0G Storage upload SDK gap

`@0glabs/0g-ts-sdk@0.3.3` (npm latest) encodes `Flow.submit(...)` with a 4-field struct; the deployed Flow at `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` takes 3 fields. Every upload reverts with no data. Verified the dRPC endpoint isn't the cause.

Workaround in place: `seed-brain.ts` falls back to `keccak256(JSON.stringify(manifest))` as the storage root. Other layers all use the same hash so the chain is internally consistent — only `Indexer.upload` is bypassed.

To unblock for real: either bump the SDK when 0.4+ ships, or hand-roll the 3-field struct with viem and call `submit()` directly. Either way, after fixing, re-seed yudhi: `bun run --cwd scripts seed-brain --label yudhi --specialty defi-yield-strategies`.

### 3. MCP server install on user's machine  (**user task**)

```bash
bun run --filter=@brainpedia/mcp-server build
# Then add to claude_desktop_config.json or claude code mcp config
# Snippet on https://brainpedia.up.railway.app homepage shows the exact env vars
```

User decided **Claude Desktop > Claude Code** for the demo (better visual chat UI for judges). Same MCP server binary either way.

### 4. AXL Brain runtime stack  (**only needed for live e2e query**)

`apps/brain` is the production-shape TS implementation. To actually serve queries it needs:
1. `axl` daemon (built from gensyn-ai/axl) running locally on the same host
2. The AXL Python MCP router (`gensyn-ai/axl/integrations/mcp_routing/mcp_router.py`) on `:9003`
3. `bun run --cwd apps/brain start` with `BRAIN_*` env vars set — registers itself via `POST /register {service:"brainpedia.brain", endpoint:"http://127.0.0.1:7100/mcp"}`

For the demo we have `scripts/demo/axl_demo.py` which spins up 4 separate Yggdrasil daemons + brain stubs (not full inference) — that's the on-camera Mixture-of-Brains scene.

### 5. Demo video  (**user task**)

Runbook: `docs/demo.md`. 3:45 plan, 5 scenes, what to show per track. The Brain page's animated `QueryDemo` component is the centerpiece for Scene 4 if live AXL routing isn't ready.

## Critical context / gotchas

- **Deployer private key**: testnet-only wallet, user shared it in the prior chat. Funded on 0G Galileo + Sepolia ETH. Never commit it to the repo — local env only.
- **Forge predicted CREATE addresses**: a re-run of `forge script ... DeployRegistrars.s.sol` *without* `--broadcast` prints addresses based on the *current* nonce, which drifts from the original broadcast nonce. **Always read deployed addresses from `contracts/broadcast/.../run-latest.json`**, never from a re-simulated stdout. Burned ~15 min on this.
- **ENS Public Resolver maintains a separate operator allowlist** from the ENS Registry. To call `setText` through SubnameRegistrar, the deployer must `setApprovalForAll(registrar, true)` on **both** the Registry (for `setSubnodeRecord`) and the Public Resolver (for `setText`). Both are set; if you redeploy the registrar, redo both approvals.
- **Yggdrasil/AXL config is PascalCase**: `PrivateKey`, `Listen`, `Peers`. Snake_case (`private_key_hex`, `listen_addr`, `bootstrap_peers`) is silently ignored — Yggdrasil falls back to a fresh random keypair, which is why the daemon's logged public key won't match `AXL_PUBLIC_KEY_HEX` if the entrypoint script uses the wrong schema. `PrivateKey` is **128 hex chars** (32-byte seed concat with 32-byte public key).
- **Bun workspace + Next.js Docker build**: workspace deps (`@brainpedia/ens` etc.) export from `dist/`, so the web build must `bun run build --filter=@brainpedia/web` (turbo walks `dependsOn:["^build"]`) — not just `next build`. Single-stage Dockerfile preserves bun's symlinks.
- **Custom domain `brainpedia.xyz`**: dropped on user's call. The canonical URL is `brainpedia.up.railway.app`. Don't re-add custom domains.

## Where to look for details

| File | What |
|---|---|
| `docs/status.md` | Full snapshot of live state + commit log |
| `docs/demo.md` | 3:45 video runbook, scene by scene |
| `docs/architecture.md` | Four-layer system + Mixture-of-Brains query flow |
| `docs/0g-integration.md` | 0G features used, swarm coordination, SDK gap |
| `docs/ens-integration.md` | Why no hardcoded values, subnames-as-access-tokens, live state |
| `docs/axl-integration.md` | Per-Brain daemons, MCP router registration |
| `docs/deployment.md` | Railway services, env vars, contract deploys |
| `~/.claude/projects/-mnt-storage/memory/project_brainpedia.md` | Cross-session memory for the project |
| `scripts/setup/*.ts` | Every chain operation we ran (deploy, register, seed, issue, verify) |
| `scripts/setup/verify-live.ts` | The 11 read-only checks — run anytime |

## Railway

Project: `brainpedia` (id `941699b4-511f-4e87-a65e-48d67a9f37dc`) on workspace `Bundie`.

Services:
- `brainpedia-web` (id `1d499176-…`) — Next.js, env wired with all contract addresses + 0G Compute provider
- `axl-bootstrap` (id `11e504a7-…`) — Yggdrasil daemon

The dRPC endpoint with the user's API key lives on `brainpedia-web`'s `ZG_RPC_URL` — never commit it; it's only in Railway env.

## Tasks open in the prior session's tracker

```
#31 Test Brain query end-to-end                       (blocked on 0G Compute funding)
#36 User faucets 0G wallet to 3+ OG                   (user action)
```

Everything else is completed. If you pick this up, start by running `verify-live` to confirm nothing regressed overnight, then act on whichever pending item the user prioritizes.
