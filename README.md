# Brainpedia

> Compiled human expertise as iNFTs — a knowledge layer agents pay to query.

**Hackathon:** ETHGlobal Open Agents · **Deadline:** May 3rd, 2026
**Tracks:** 0G (Autonomous Agents/Swarms/iNFT) · ENS (AI Agents + Most Creative) · Gensyn AXL

---

## What it is

Agents make poor decisions because their knowledge layer is broken.

Brainpedia turns a personal note vault (Obsidian, ChatGPT export, Notion, …) into a compiled wiki, mints it as an ERC-7857 iNFT on 0G, and exposes it as an MCP service that other agents can discover via ENS and pay to query over Gensyn's AXL P2P mesh.

When a query needs multiple specialties, an orchestrator fans out to multiple Brains in parallel and synthesizes the answer — Mixture-of-Brains.

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

See [docs/architecture.md](docs/architecture.md) for the full system diagram and per-layer details.

## Repository layout

```
brainpedia/
├── apps/
│   ├── web/                  Next.js 15 — brainpedia.xyz public site
│   └── mcp-server/           stdio MCP server (Claude Desktop integration)
├── packages/
│   ├── obsidian-parser/      Vault → article graph
│   ├── storage-0g/           0G Storage (KV + Log) wrappers
│   ├── compute-0g/           0G Compute broker + OpenAI-compat client
│   ├── ens/                  ENS subname registrar, text records, access tokens
│   └── axl/                  AXL HTTP client + Mixture-of-Brains orchestrator
├── contracts/                Foundry — ERC-7857 Brain.sol, registrars
├── scripts/
│   ├── demo/                 Python: spin up 4 AXL nodes for the demo
│   └── setup/                One-shot deploy/seed scripts
└── docs/                     Architecture + per-track integration notes
```

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | bun workspaces + Turborepo |
| Web | Next.js 15 (App Router), Tailwind, wagmi v2 + viem v2, D3.js |
| MCP server | `@modelcontextprotocol/sdk` over stdio |
| Storage | `@0gfoundation/0g-ts-sdk` (Indexer + Batcher + KvClient) |
| Compute | `@0glabs/0g-serving-broker` + `openai` |
| ENS | `@ensdomains/ensjs` + `viem` (no hardcoded addresses — all config-driven) |
| AXL | Local `axl` daemon HTTP API + Python MCP services |
| Contracts | Foundry, Solidity 0.8.26 |

## Configuration

All cross-system values are environment-driven — see [`.env.example`](.env.example). In particular: ENS parent name, registrar addresses, contract addresses, RPC URLs, AXL bootstrap peers, and 0G provider details are **never hardcoded** in source (per ENS bounty requirement).

## Quick start

```bash
# Install
bun install

# Configure
cp .env.example .env
# fill in ZG_WALLET_PRIVATE_KEY, ENS_RPC_URL, etc.

# Deploy contracts to 0G testnet (Galileo, chain id 16602)
cd contracts && forge script script/Deploy.s.sol --broadcast

# Run web + MCP locally
bun run dev
```

## Status

Day 1 — scaffolding. See [docs/build-plan.md](docs/build-plan.md) for the 5-day plan.

## Track-specific notes

- [docs/0g-integration.md](docs/0g-integration.md) — Storage, Compute, iNFT
- [docs/ens-integration.md](docs/ens-integration.md) — Subnames-as-access-tokens, discovery shortcuts, fully dynamic (no hardcoded values)
- [docs/axl-integration.md](docs/axl-integration.md) — Per-Brain AXL daemons, MCP routing, Python demo

## License

MIT
