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
cat ~/.claude/projects/-mnt-storage-brainpedia/memory/project_brainpedia.md
curl -s -X POST https://brainpedia.up.railway.app/api/query \
  -H 'content-type: application/json' \
  -d '{"prompt":"safest stablecoin yield"}'  # live e2e — should return cited TEE-verified answer
```

If verify-live + the live `/api/query` are green, the stack is healthy.

## What's live RIGHT NOW (post-redeploy 2026-05-02)

The original `brainpedia.eth` deployer key was lost mid-hackathon. Everything was redeployed under a fresh deployer to a new parent ENS name. The web URL stayed the same; only the on-chain identifiers changed.

| Layer | Address / value |
|---|---|
| Deployer | `0xD24e06f0DBadA268314DbcB97F48f87b85b6Dd30` |
| Parent ENS (Sepolia) | `bpedia.eth` |
| `Brain.sol` (Galileo, ERC-7857 iNFT) | `0x4E5c6DC869F9B3220F01de9047031cEd1577b08F` |
| `SubnameRegistrar` (Sepolia) | `0xBb921bFFBbbE2219D1EC365213a74097348F28F0` |
| `AccessTokenRegistrar` (Sepolia) | `0x3e7D22150d6b883a89703d760d66743D2223456b` |
| `RoyaltyDistributor` (Galileo) | `0x44eaad4fdb7d509cd3fe7624ce512cc97b910649` (citation-weighted multi-Brain payment in one tx) |
| Brains live (4) | `yudhi.bpedia.eth` (token 1), `malaysia.bpedia.eth` (token 2), `rwa.bpedia.eth` (token 3), `vaultdemo.bpedia.eth` (token 4 — seeded from a real Obsidian vault) |
| Storage root (yudhi/malaysia, segments live) | `0xde0ebac78dd…ca37f` |
| Storage root (rwa, segments live) | `0x09616944759e09d…3bc7` |
| Storage root (vaultdemo, segments live) | `0x6ae520246cf343fe…71c60` |
| Discovery shortcut | `defi.discover.bpedia.eth` → `[yudhi, malaysia, rwa]` |
| Web | https://brainpedia.up.railway.app (unchanged) |
| Brain runtime | Railway service `brainpedia-brain` (single multi-tenant instance — resolves target's storage_root + specialty from ENS at query time) |
| 0G Compute provider | `0xa48f01287233509FD694a22Bf840225062E67836` (Qwen 2.5 7B, TEE-attested) |
| Sample access token | `agentf14abfb4.client.bpedia.eth` (issued for deployer, TTL 900s) |

`.env` in the repo root has every value above + `PRIVATE_KEY` for the new deployer. Never commit it (`.gitignore` covers it).

## What's pending — ordered by demo impact

### 1. Install MCP server in Claude Desktop  (**user**)

```bash
bun run --filter=@brainpedia/mcp-server build
# Add to claude_desktop_config.json — snippet on https://brainpedia.up.railway.app
```

### 2. Demo video  (**user**)

Runbook: `docs/demo.md`. Update screen-cap'd ENS name from `*.brainpedia.eth` → `*.bpedia.eth`.

## Critical context / gotchas

- **Lost deployer (`0x0a9a3BB8…`)** — owns `brainpedia.eth` parent + the previous Brain.sol + the `client.brainpedia.eth` registrar subnode + 3 orphan iNFTs (tokenIds 1-3 on the old contract). All permanently inaccessible. Local brain process pid 726835 still has its key in memory but cannot be restarted.
- **`bpedia.eth` is unwrapped on the Registry** (deployer owns the node directly). The `setApprovalForAll` flow on the Registry + Public Resolver works as-is — no NameWrapper unwrap step needed because we registered straight (the controller wrapped it but ensjs's `commitName/registerName` call left it unwrapped on this run).
- **The Public Resolver maintains a separate operator allowlist** from the Registry. Approvals must be set on **both** for the registrars to work. `wire-ens.ts` does both.
- **0G Storage SDK gap**: `@0glabs/0g-ts-sdk@0.3.3` encodes a wrong ABI selector (`0xef3e12dc`, missing `submitter` field). We hand-roll `Flow.submit` with the 2-field tuple (selector `0xbc8c11f8`). Then segments are pushed via `uploadSegments` (fork of `StorageNode.uploadSegmentsByTxSeq()`). Without the segment push, `Indexer.download(rootHash)` returns 404 and the brain handler errors with `"file not found"`.
- **Forge predicted CREATE addresses**: a re-run of `forge script ... DeployRegistrars.s.sol` *without* `--broadcast` prints addresses based on the current nonce, which drifts. Always read deployed addresses from `contracts/broadcast/.../run-latest.json`, never from a re-simulated stdout.
- **Custom domain**: dropped on user's call. Canonical URL is `brainpedia.up.railway.app`.
- **Railway brain has `BRAIN_ENFORCE_ACCESS_TOKENS=false`** — that's why public `/api/query` works without an access token. Toggle to `true` if/when the demo wants to show the access-token gating live.

## Where to look for details

| File | What |
|---|---|
| `docs/status.md` | Full snapshot of live state + commit log |
| `docs/demo.md` | Demo video runbook (needs label updates `*.brainpedia.eth` → `*.bpedia.eth`) |
| `docs/architecture.md` | Four-layer system + Mixture-of-Brains query flow |
| `docs/0g-integration.md` | 0G features used, swarm coordination, SDK gap |
| `docs/ens-integration.md` | Subnames-as-access-tokens design |
| `docs/axl-integration.md` | Per-Brain daemons, MCP router registration |
| `~/.claude/projects/-mnt-storage-brainpedia/memory/project_brainpedia.md` | Cross-session memory |
| `scripts/setup/wire-ens.ts` | Approvals + subnode setup (run once per parent ENS deploy) |
| `scripts/setup/setup-compute.ts` | 0G Compute ledger + provider ack (run once per deployer) |
| `scripts/setup/seed-from-vault.ts` | Seed a Brain from a real Obsidian vault (parser → 0G storage → mint → ENS) |
| `scripts/setup/settle-royalties.ts` | Reference: fetch /api/query mixture plan + settle splits via RoyaltyDistributor |
| `contracts/src/RoyaltyDistributor.sol` | Single-tx multi-Brain settlement contract (citation-weighted) |
| `scripts/setup/finish-yudhi.ts` | Reference: register subname + write text records (workaround for seed-brain bug) |
| `scripts/setup/push-segments.ts` | Reference: correct txSeq extraction from Submit event |
| `scripts/setup/update-storage-root.ts` | Reference: `appendStorageRoot` + ENS update flow |
| `scripts/setup/verify-live.ts` | The 11 read-only checks |

## Railway

Project: `brainpedia` (id `941699b4-511f-4e87-a65e-48d67a9f37dc`) on workspace `Bundie`.

Services (3, all SUCCESS):
- `brainpedia-web` (id `1d499176-…`) — Next.js, env points at all new contract addresses + `bpedia.eth`
- `brainpedia-brain` (id `72507906-…`) — apps/brain, `BRAIN_ENS_NAME=yudhi.bpedia.eth`, new key, `BRAIN_ENFORCE_ACCESS_TOKENS=false`
- `axl-bootstrap` (id `11e504a7-…`) — Yggdrasil daemon (unaffected by the redeploy)

The dRPC endpoint with the user's API key lives on Railway's `ZG_RPC_URL` — never commit it.

## Tasks open in the prior session's tracker

```
none — full e2e is live. Optional: mint malaysia/rwa brains for graph richness.
```

Start by running `verify-live` to confirm nothing regressed overnight, then act on whichever pending item the user prioritizes.
