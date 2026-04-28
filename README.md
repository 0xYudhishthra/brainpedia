# Brainpedia

> Compiled human expertise as iNFTs — a knowledge layer agents pay to query.

**Hackathon:** ETHGlobal Open Agents · **Tracks:** 0G · ENS · Gensyn AXL

- **Live web**: https://brainpedia.up.railway.app
- **Sample Brain**: https://brainpedia.up.railway.app/yudhi (resolves live from ENS Sepolia)

---

## What it is

Agents make poor decisions because their knowledge layer is broken — they hallucinate, RAG with stale data, and have no way to pay humans for compiled expertise.

Brainpedia turns a personal note vault (Obsidian, ChatGPT export, Notion, …) into a **compiled wiki**, mints it as an **ERC-7857 iNFT on 0G**, and exposes it as an **MCP service** that other agents discover via **ENS** and pay to query over **Gensyn's AXL** P2P mesh.

When a query needs multiple specialties, an orchestrator fans out to multiple Brains in parallel and synthesizes the answer — **Mixture-of-Brains**.

## What's live right now

| Layer | What | Where |
|---|---|---|
| **Web app** | Public site + D3 force-directed network viz + dynamic Brain pages | https://brainpedia.up.railway.app |
| **AXL bootstrap node** | Yggdrasil daemon, pinned peer ID `cb4cc722…3b8` | Railway — mesh `:7000` |
| **0G iNFT** `Brain.sol` (ERC-7857) | tokenId 1 minted, 0.001 OG/query | [0G Galileo `0x928940c1…3Ef6`](https://chainscan-galileo.0g.ai/address/0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6) |
| **ENS subname registrar** | Issues `<name>.brainpedia.eth` for Brain owners | [Sepolia `0x928940c1…3Ef6`](https://sepolia.etherscan.io/address/0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6) |
| **ENS access-token registrar** | Issues TTL-bounded `agent<hash>.client.brainpedia.eth` capability tokens | [Sepolia `0x36ce746e…4fd9`](https://sepolia.etherscan.io/address/0x36ce746e88b9098899fc8d0ab274c45748d04fd9) |
| **`brainpedia.eth`** parent name | Registered, both registrars approved on ENS Registry + Public Resolver | [app.ens.domains/brainpedia.eth?chain=sepolia](https://app.ens.domains/brainpedia.eth?chain=sepolia) |
| **Sample Brain** `yudhi.brainpedia.eth` | All 8 brain.* text records resolve live | [app.ens.domains/yudhi.brainpedia.eth?chain=sepolia](https://app.ens.domains/yudhi.brainpedia.eth?chain=sepolia) |
| **Sample access token** `agenta5b68322.client.brainpedia.eth` | Issued by AccessTokenRegistrar, on-chain TTL | TTL-expiring |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4 — Discovery & Identity (ENS)                       │
│  *.brainpedia.eth subnames + text records + access tokens   │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 — Communication (AXL)                              │
│  Encrypted P2P mesh, MCP/A2A envelopes, Ed25519 peer IDs    │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 — Intelligence (0G Compute)                        │
│  OpenAI-compatible inference, broker.ledger metering        │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 — Persistence & Ownership (0G Storage + Chain)     │
│  KV (live wiki) + Log (snapshots) + ERC-7857 iNFT           │
└─────────────────────────────────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for layer-by-layer details and the Mixture-of-Brains query flow.

## Repository layout

```
brainpedia/
├── apps/
│   ├── web/              Next.js 15 — public site, D3 viz, Brain pages
│   ├── mcp-server/       stdio MCP for Claude Desktop (5 tools)
│   └── brain/            Brain-side service — registers with the AXL MCP router
├── packages/
│   ├── obsidian-parser/  Vault → article graph
│   ├── storage-0g/       0G Storage KV + Log wrappers
│   ├── compute-0g/       0G Compute broker + OpenAI-compat client
│   ├── ens/              ENS subname / text-records / access-token helpers
│   └── axl/              AXL HTTP client + Mixture-of-Brains orchestrator
├── contracts/            Foundry — Brain.sol, SubnameRegistrar, AccessTokenRegistrar
├── scripts/
│   └── setup/            prep-deploy, register-parent, seed-brain, issue-token
└── docs/                 architecture + per-track integration notes
```

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | bun workspaces + Turborepo (14 packages, all typecheck) |
| Web | Next.js 15 (App Router), Tailwind, wagmi v2 + viem v2, D3.js |
| MCP server | `@modelcontextprotocol/sdk` over stdio (5 tools wired) |
| Storage | `@0glabs/0g-ts-sdk` |
| Compute | `@0glabs/0g-serving-broker@0.7.5` + `openai` |
| ENS | `@ensdomains/ensjs` + `viem` (zero hardcoded addresses — bounty rule) |
| AXL | Local `axl` daemon HTTP API + AXL Python MCP router |
| Contracts | Foundry, Solidity 0.8.26 |
| Deploy | Railway (web, AXL bootstrap), Foundry (contracts) |

## End-to-end demo

See [docs/demo.md](docs/demo.md) for the full walkthrough.

The TL;DR:

1. **Setup a Brain** — Claude Desktop runs `setup_brain` on your Obsidian vault → `upload_articles` (compile + push to 0G Storage) → `finalize_brain` (mint iNFT + register ENS subname + write all `brain.*` text records).
2. **Discovery** — agents resolve `<topic>.discover.brainpedia.eth` → list of Brain ENS names → resolve each → get peer ID + iNFT pair + price.
3. **Pay-per-query** — `Brain.authorizeUsage(tokenId, agent, ttl)` with payment forwards to the Brain owner; emits `BrainPayment`. Optionally an access-token subname is issued as a one-time capability.
4. **Query routing** — agent's local AXL daemon forwards a JSON-RPC `query` to the Brain's peer via the encrypted Yggdrasil mesh; the Brain validates the access token, fetches articles from 0G Storage, runs inference on 0G Compute, returns answer + citations + verified flag.
5. **Mixture-of-Brains** — for multi-specialty queries, an orchestrator AXL node fans out to 3+ Brains in parallel and synthesizes via 0G Compute.

## Track-specific notes

- [docs/0g-integration.md](docs/0g-integration.md) — Storage, Compute, iNFT, swarm coordination
- [docs/ens-integration.md](docs/ens-integration.md) — Why every ENS value flows through env, subnames-as-access-tokens, dynamic discovery
- [docs/axl-integration.md](docs/axl-integration.md) — Per-Brain AXL daemons, MCP router registration, Python demo
- [docs/deployment.md](docs/deployment.md) — Railway + 0G + Sepolia deploys, real addresses, env wiring

## Configuration

Every cross-system value is environment-driven — see [`.env.example`](.env.example). In particular: ENS parent name, registrar addresses, contract addresses, RPC URLs, AXL bootstrap peers, and 0G provider details are **never hardcoded** in source (per ENS bounty requirement).

```bash
bun install

# Deploy contracts (one-time, requires funded wallet on 0G + Sepolia)
ENS_NETWORK=sepolia ENS_PARENT_NAME=brainpedia.eth bun run --cwd scripts prep-deploy
PRIVATE_KEY=0x... forge script script/DeployBrain.s.sol      --rpc-url https://evmrpc-testnet.0g.ai           --broadcast
PRIVATE_KEY=0x... forge script script/DeployRegistrars.s.sol --rpc-url https://ethereum-sepolia.publicnode.com --broadcast

# Register the parent ENS name and seed a sample Brain
PRIVATE_KEY=0x... bun run --cwd scripts register-parent
PRIVATE_KEY=0x... bun run --cwd scripts seed-brain --label yudhi --specialty defi-yield-strategies

# Run web + MCP locally
bun run dev
```

## License

MIT
