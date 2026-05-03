# Brainpedia

> Turn your Obsidian vault into an AI brain that other agents pay you to query.

**Hackathon:** ETHGlobal Open Agents
**Tracks:** 0G · ENS (×2) · Gensyn AXL

- **Live web**: https://brainpedia.up.railway.app
- **Sample Brain**: https://brainpedia.up.railway.app/yudhi (resolves live from ENS Sepolia)
- **Karpathy LLM-Wiki Brain**: https://brainpedia.up.railway.app/karpathy
- **Install MCP server**: `npx -y brainpedia-mcp` (published on npm)

---

## What it is

Brainpedia is the supply side of the agent economy: a network where humans turn their personal notes into specialty AI Brains that other AI agents pay to query.

Each Brain is a 0G iNFT (ERC-7857) you mint from your Obsidian vault. Notes get compiled into wiki articles by Claude (in-context, following the [LLM-Wiki schema we ship](docs/brain-compile-schema.md)), uploaded to 0G Storage as a merkle-rooted snapshot, and the iNFT carries the root. You set a per-query price; the Brain runs inference on 0G Compute (TEE-attested Qwen 2.5 7B) and returns cited answers.

Other agents discover you via ENS subnames (`yourname.bpedia.eth`), authenticate via TTL ENS-subname access tokens (`agent7af.client.bpedia.eth`), route over Gensyn AXL P2P, and a Mixture-of-Brains query fans out across N Brains in parallel. The synthesised answer is **pay-to-read**: the orchestrator returns a redacted plan + per-brain payment plan, the agent settles each Brain's sticker `brain.price_query` in a single `RoyaltyDistributor.distribute` tx, and only then does the server release the cached synthesis.

Every layer is on chain. No central API. No off-chain auth service. The Brain outlives Brainpedia.

## What's live right now

| Layer | What | Where |
|---|---|---|
| **Web app** | Public site + D3 force-directed network viz + dynamic per-Brain pages + mixture-mode `/api/query` proxy | https://brainpedia.up.railway.app |
| **MCP server** | 7 tools (`setup_brain`, `upload_articles`, `finalize_brain`, `sync_vault`, `query_brain`, `query_mixture`, `settle_mixture`) shipped to npm | [`brainpedia-mcp` on npm](https://www.npmjs.com/package/brainpedia-mcp) |
| **Hosted Obsidian** | KasmVNC + Local REST API plugin, demo vault namespaces under `users/<name>/` | https://brainpedia-obsidian-production.up.railway.app (REST: `tramway.proxy.rlwy.net:12789`) |
| **AXL bootstrap node** | Yggdrasil daemon, persistent peer ID `cb4cc722…3b8` | Railway `axl-bootstrap` service |
| **`Brain.sol`** (ERC-7857 iNFT) | 7 brains minted across two cohorts | [chainscan-galileo `0x4E5c…b08F`](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F) |
| **`BrainMinter`** | Permissionless wrapper that owns Brain.sol — anyone can self-mint | [chainscan-galileo `0xcca5…a2e7`](https://chainscan-galileo.0g.ai/address/0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7) |
| **`RoyaltyDistributor`** | Single-tx multi-Brain payment, sticker-priced (each brain gets its `brain.price_query`) | [chainscan-galileo `0x44ea…0649`](https://chainscan-galileo.0g.ai/address/0x44eaad4fdb7d509cd3fe7624ce512cc97b910649) |
| **`SubnameRegistrar`** | Issues `<name>.bpedia.eth` for Brain owners | [sepolia.etherscan `0xBb92…28F0`](https://sepolia.etherscan.io/address/0xBb921bFFBbbE2219D1EC365213a74097348F28F0) |
| **`AccessTokenRegistrar`** | Issues TTL-bounded `agent<hash>.client.bpedia.eth` capability tokens | [sepolia.etherscan `0x3e7D…456b`](https://sepolia.etherscan.io/address/0x3e7D22150d6b883a89703d760d66743D2223456b) |
| **`bpedia.eth`** parent name | Registered, both registrars approved on ENS Registry + Public Resolver | [sepolia.app.ens.domains/bpedia.eth](https://sepolia.app.ens.domains/bpedia.eth) |
| **`yudhi.bpedia.eth`** Brain | DeFi yield strategies, vault-derived, tokenId 7 | [sepolia.app.ens.domains/yudhi.bpedia.eth](https://sepolia.app.ens.domains/yudhi.bpedia.eth) |
| **`karpathy.bpedia.eth`** Brain | LLM-Wiki framework, vault-derived, tokenId 6 | [sepolia.app.ens.domains/karpathy.bpedia.eth](https://sepolia.app.ens.domains/karpathy.bpedia.eth) |
| **Discovery shortcuts** (by practice) | `research.discover.bpedia.eth` → yudhi · `frameworks.discover.bpedia.eth` → karpathy · `all.discover.bpedia.eth` → both | [research.discover](https://sepolia.app.ens.domains/research.discover.bpedia.eth) · [frameworks.discover](https://sepolia.app.ens.domains/frameworks.discover.bpedia.eth) · [all.discover](https://sepolia.app.ens.domains/all.discover.bpedia.eth) |
| **Sample access token** `agentf14abfb4.client.bpedia.eth` | Issued by AccessTokenRegistrar, on-chain TTL | TTL-expiring |
| **Royalty settlement proof** | Single tx settled 2 brains in mixture mode | [chainscan-galileo tx `0x9637800e…`](https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4 — Discovery & Identity (ENS)                       │
│  *.bpedia.eth subnames + text records + access tokens       │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 — Communication (AXL)                              │
│  Encrypted P2P mesh, MCP/A2A envelopes, Ed25519 peer IDs    │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 — Intelligence (0G Compute)                        │
│  TEE-attested Qwen 2.5 7B, broker.ledger metering           │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 — Persistence & Ownership (0G Storage + Chain)     │
│  KV (live wiki) + Log (snapshots) + ERC-7857 iNFT           │
└─────────────────────────────────────────────────────────────┘
```

Surfaces split by intent: the **MCP server is the write path** (read your vault, sign txs, mint brains) and the **web app is the read path** (browse the network, query brains, settle royalties). The MCP server holds your private key locally; the web holds none. See [docs/architecture.md](docs/architecture.md) for the full diagram and the Mixture-of-Brains query flow.

## Documentation map

| Read this if you want to… | Doc |
|---|---|
| **Set up your own Brain end to end** (5 min, `npx -y brainpedia-mcp` + Claude Code) | [docs/teammate-onboarding.md](docs/teammate-onboarding.md) |
| **Understand the four-layer architecture and the MCP-write / web-read split** | [docs/architecture.md](docs/architecture.md) |
| **Understand how Brainpedia compiles every Brain** (Karpathy LLM-Wiki schema) | [docs/brain-compile-schema.md](docs/brain-compile-schema.md) |
| **Audit our 0G integration** (iNFT, Storage KV+Log, Compute, swarm coordination, royalty splits) — bounty doc | [docs/0g-integration.md](docs/0g-integration.md) |
| **Audit our ENS integration** (subnames as identity + capability tokens, no hardcoded values) — bounty doc | [docs/ens-integration.md](docs/ens-integration.md) |
| **Audit our AXL integration** (per-Brain daemons, MCP router, multi-node demo) — bounty doc | [docs/axl-integration.md](docs/axl-integration.md) |
| **Re-deploy from scratch** (Railway, contracts, env wiring) | [docs/deployment.md](docs/deployment.md) |
| **Watch the demo** | [docs/demo.md](docs/demo.md) |
| **Snapshot of current live state** | [docs/status.md](docs/status.md) |

## Repository layout

```
brainpedia/
├── apps/                       deployable applications
│   ├── web/                    Next.js 15 — public site, D3 viz, /api/query (single + two-phase mixture w/ pay-gate)
│   ├── mcp-server/             stdio MCP for Claude Code, published as `brainpedia-mcp` (7 tools)
│   └── brain/                  Brain-side service (multi-tenant), runs on Railway
├── packages/                   shared libraries (consumed by apps; no app→app deps)
│   ├── obsidian-parser/        Vault → article graph (FS + Local REST API plugin)
│   ├── storage-0g/             0G Storage KV + Log wrappers (incl. Flow.submit workaround)
│   ├── compute-0g/             0G Compute broker + OpenAI-compat client
│   ├── ens/                    ENS subname / text-record / access-token helpers
│   └── axl/                    AXL HTTP client + Mixture-of-Brains orchestrator types
├── contracts/                  Foundry — Brain.sol, BrainMinter, RoyaltyDistributor,
│                               SubnameRegistrar, AccessTokenRegistrar
├── scripts/
│   ├── setup/                  prep-deploy, register-parent, wire-ens, setup-compute,
│   │                           seed-from-vault, settle-royalties, push-segments, verify-live
│   └── demo/                   axl_demo.py (4-node Yggdrasil mesh — AXL bounty's "working
│                               example") + sample/karpathy/yudhi vaults
└── docs/                       architecture + per-bounty integration notes
```

Why apps and packages are separate: standard Bun workspace / Turborepo convention. `apps/` are deployable with their own entry points; `packages/` are libraries that apps consume. Apps don't depend on other apps.

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Bun workspaces + Turborepo (14 packages, all typecheck, CI green) |
| Web | Next.js 15 (App Router), Tailwind, wagmi v2 + viem v2, D3.js |
| MCP server | `@modelcontextprotocol/sdk` over stdio, bundled to a single 1.5 MB file via `bun build`, published on npm as `brainpedia-mcp` |
| Storage | `@0glabs/0g-ts-sdk` — but with a hand-rolled `Flow.submit` workaround because the SDK's ABI selector is wrong (see [docs/0g-integration.md](docs/0g-integration.md)) |
| Compute | `@0glabs/0g-serving-broker@0.7.5` (TEE-attested Qwen 2.5 7B) |
| ENS | `@ensdomains/ensjs` + `viem` (zero hardcoded addresses — bounty rule, [grep recipe in docs](docs/ens-integration.md#verifying-no-hardcoded-values)) |
| AXL | `axl` daemon HTTP API + `mcp_router.py` from `gensyn-ai/axl/integrations/mcp_routing` |
| Contracts | Foundry, Solidity 0.8.26, OpenZeppelin v5 |
| Hosting | Railway (web, brain, AXL bootstrap, hosted Obsidian) |

## End-to-end demo

See [docs/demo.md](docs/demo.md) for the full walkthrough. The TL;DR:

1. **Create a Brain** — `npx -y brainpedia-mcp` in Claude Code. Say *"set up my Brain from my Obsidian vault."* Claude calls `setup_brain` (reads vault, returns parsed graph + the [compile schema](docs/brain-compile-schema.md)) → compiles wiki pages following the schema → `upload_articles` (push to 0G Storage) → `finalize_brain` (mint via `BrainMinter` + register `<yourname>.bpedia.eth` + write all `brain.*` text records). The minted iNFT is owned by your wallet.
2. **Discover** — agents resolve `<topic>.discover.bpedia.eth` (e.g. `research.discover.bpedia.eth`) → list of Brain ENS names → resolve each → get peer ID, iNFT ref, price.
3. **Pay-per-query** — `Brain.authorizeUsage(tokenId, agent, ttl)` with payment forwards to the Brain owner; emits `BrainPayment`. Optionally an access-token subname (`agent<hash>.client.bpedia.eth`) is issued as a one-time capability with on-chain TTL.
4. **Query** — agent's local AXL daemon forwards a JSON-RPC `query` to the Brain peer via the encrypted Yggdrasil mesh. The Brain validates the access token, fetches the article snapshot from 0G Storage, runs inference on 0G Compute, returns answer + citations + `verified: true` (TEE attestation).
5. **Mixture-of-Brains, pay-to-read with confirmation** — `POST /api/query?mode=mixture` resolves a discovery shortcut (LLM-routed when `topic=auto`), fans out to N Brains in parallel, and returns a redacted phase-1 response: per-brain metadata + citations + the per-brain payment plan (each brain gets its sticker `brain.price_query`). The synthesised answer is **gated** until the agent settles on chain via `RoyaltyDistributor.distribute(...)` and re-calls with `sessionId + txHash`. In Claude Code this is a two-tool flow: `query_mixture` returns the plan and the host LLM surfaces the cost to the user; once the user confirms, `settle_mixture` runs the on-chain tx + phase-2 unlock and returns the synthesis + tx hash. The synthesis itself is a separate TEE-attested 0G Compute call that fuses the per-brain answers into one coherent response. Verified live: settlement tx [`0x9637800e…`](https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e).

## Configuration

Every cross-system value is environment-driven (see `.env.example`). ENS parent name, registrar addresses, contract addresses, RPC URLs, AXL bootstrap peers, and 0G provider details are **never hardcoded** in source — required by the ENS bounty.

```bash
bun install

# Run web + MCP locally
bun run dev

# Or use the published MCP server straight from npm:
npx -y brainpedia-mcp
```

## Team

Built solo for ETHGlobal Open Agents.

- **Yudhishthra Sugumaran** ([@0xYudhishthra](https://twitter.com/0xYudhishthra) on X · `yudhishthra` on Telegram)

## License

MIT
