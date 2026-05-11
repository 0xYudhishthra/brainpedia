# Brainpedia

> Brainpedia is a network where humans turn their personal notes into ERC-7857 AI Brains on 0G that other agents pay to query.

- **Live web**: https://brainpedia.up.railway.app
- **Sample Brain**: https://brainpedia.up.railway.app/yudhi
- **Install MCP server**: `npx -y brainpedia-mcp`
- **0G integration deep-dive**: [docs/0g-integration.md](docs/0g-integration.md)
- **Architecture**: [docs/architecture.md](docs/architecture.md)
- **Security**: [contracts/SECURITY.md](contracts/SECURITY.md) · [contracts/KNOWN_ISSUES.md](contracts/KNOWN_ISSUES.md)

---

## The problem

Agents have no legitimate way to buy specialty knowledge. APIs are centralized, OpenAI-priced, and the human expert whose notes feed the answer sees nothing. As autonomous agents do more research, trading, and operations, this gap widens: every agent burns tokens on the same handful of general-purpose models while domain experts capture none of the value their knowledge creates.

## The solution

Brainpedia is the supply side of the agent economy. Any human publishes their personal notes (Obsidian vault, research archive, case files) as a specialty AI Brain. Each Brain is an ERC-7857 iNFT minted on 0G with encrypted private metadata sealed for the owner. Other agents discover Brains, pay a per-query sticker price, and run inference against the Brain's snapshot using 0G's TEE-attested compute. A `Mixture-of-Brains` query fans out across multiple Brains and settles royalties in a single on-chain transaction. No central API, no off-chain auth service. The Brain outlives Brainpedia.

## 0G integration depth — 5 of 5 components

| 0G component | How Brainpedia uses it | Where |
|---|---|---|
| **0G Storage** | KV layer for live wiki edits; Log layer for immutable merkle-rooted snapshots that the iNFT carries | `packages/storage-0g` |
| **0G Compute** | Per-query inference + Mixture-of-Brains synthesis on TEE-attested Qwen 2.5 7B via `broker.ledger` metering | `packages/compute-0g` |
| **0G Chain** | All Brain iNFT custody, royalty distribution, and minter wrappers deployed on Aristotle (chainId 16661) | `contracts/` |
| **Agent ID (ERC-7857)** | Each Brain is a canonical ERC-7857 iNFT: encrypted manifest sealed for owner, oracle-attested transfers via `BrainOracle`, append-only IntelligentData lineage | `contracts/src/Brain.sol` + `contracts/src/BrainOracle.sol` |
| **Privacy & Security (TEE)** | Every inference response carries a TEE attestation flag (`verified: true`). The TEE attestor is also the upgrade path for the BrainOracle, binding ownership transfer to verifiable key re-sealing | `packages/compute-0g` + `contracts/src/BrainOracle.sol` |

## Roadmap — how the supply side scales

| Stage | Who | What they publish | Why now |
|---|---|---|---|
| **v0.2 today** | Individual experts using Claude Code | Personal Obsidian vault, research notes | The MCP server runs locally; one person, one vault, one wallet. Demo state. |
| **v1 next** | Small specialist firms | Boutique law firms publishing case-law research, clinical research groups publishing trial protocols | Same MCP tooling at firm scale. The existing Obsidian or Notion vault becomes a paid API for other agents inside and outside the firm. |
| **v2 later** | Enterprise knowledge marketplaces | Any company carves out a specialty department's notes (compliance, IP, risk, ops) as a revenue-generating Brain | Internal teams query their own Brains; external partners query at sticker price. Royalty splits become a new revenue line. |
| **v3 vision** | Cross-firm agentic economy | Hundreds of expert Brains compose into agent workflows the way Stripe composes payments | Mixture-of-Brains settlement is already cross-firm settlement. Scaling is plumbing. |

## What's live right now

| Layer | What | Where |
|---|---|---|
| **Web app** | Public site + D3 force-directed network viz + dynamic per-Brain pages + mixture-mode `/api/query` proxy | https://brainpedia.up.railway.app |
| **MCP server** | 7 tools (`setup_brain`, `upload_articles`, `finalize_brain`, `sync_vault`, `query_brain`, `query_mixture`, `settle_mixture`) on npm | [`brainpedia-mcp` on npm](https://www.npmjs.com/package/brainpedia-mcp) |
| **`Brain.sol`** (ERC-7857 canonical) | Multiple brains minted across cohorts | mainnet deploy in progress (testnet `0x4E5c…b08F` on [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F)) |
| **`BrainOracle`** | EIP-712 attestor for ERC-7857 secure transfers (context-bound proofs) | mainnet deploy in progress |
| **`BrainMinter`** | Permissionless mint wrapper, anyone can self-mint | mainnet deploy in progress (testnet `0xcca5…a2e7`) |
| **`RoyaltyDistributor`** | Multi-Brain royalty settlement with pull-payment pattern | mainnet deploy in progress (testnet `0x44ea…0649`) |
| **`SubnameRegistrar`** + **`AccessTokenRegistrar`** (Sepolia) | ENS-based discovery and TTL-bounded capability tokens (supporting infrastructure) | [sepolia.app.ens.domains/bpedia.eth](https://sepolia.app.ens.domains/bpedia.eth) |
| **Royalty settlement proof** | Single tx settled 2 brains in mixture mode | [chainscan-galileo tx `0x9637800e…`](https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e) |

> All Solidity is verified on the explorer. Mainnet addresses + hero settlement tx appear here after deploy. See [contracts/SECURITY.md](contracts/SECURITY.md) for the audit summary and [contracts/KNOWN_ISSUES.md](contracts/KNOWN_ISSUES.md) for accepted risks.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Discovery & Identity (ENS, Sepolia, supporting)                │
│  *.bpedia.eth subnames + text records + TTL access tokens       │
├─────────────────────────────────────────────────────────────────┤
│  Communication (AXL P2P, supporting)                            │
│  Encrypted Yggdrasil mesh, MCP / A2A envelopes                  │
├─────────────────────────────────────────────────────────────────┤
│  Intelligence (0G Compute, core)                                │
│  TEE-attested Qwen 2.5 7B inference + Mixture-of-Brains synth   │
├─────────────────────────────────────────────────────────────────┤
│  Persistence & Ownership (0G Storage + 0G Chain, core)          │
│  Storage KV (live wiki) + Log (snapshots) + ERC-7857 iNFT       │
│  RoyaltyDistributor for multi-Brain settlement                  │
└─────────────────────────────────────────────────────────────────┘
```

Two surfaces split by intent: the **MCP server is the write path** (read your vault, sign txs, mint brains, locally hold your key) and the **web app is the read path** (browse the network, query brains, settle royalties; holds zero user state). Full diagram + Mixture-of-Brains flow in [docs/architecture.md](docs/architecture.md).

## How a query works

1. **Create a Brain**. Run `npx -y brainpedia-mcp` inside Claude Code. Say *"set up my Brain from my Obsidian vault."* The MCP server reads your vault, returns the parse + compile schema, then Claude compiles wiki pages following that schema. `upload_articles` pushes the snapshot to 0G Storage; `finalize_brain` mints the iNFT via `BrainMinter` and writes all `brain.*` text records. Your wallet owns the iNFT.
2. **Discover**. Agents resolve `<topic>.discover.bpedia.eth`, get a list of Brain ENS names, resolve each, get peer ID, iNFT ref, and per-query sticker price.
3. **Mixture-of-Brains query**. The orchestrator fans out a question to N Brains in parallel. Each runs inference on 0G Compute (TEE-attested), returns citations + per-Brain answer.
4. **Pay-to-read settlement**. Phase 1 returns redacted citations + the on-chain payment plan (each Brain receives its sticker `brain.price_query`). The synthesised answer is gated until the agent settles via `RoyaltyDistributor.distribute(tokenIds[], amounts[], reason)` in a single transaction. The server verifies on-chain `Distributed` events match the cached plan, then releases the synthesis.
5. **Verifiable**. Every response carries `verified: true` from the TEE attestor. Settlement tx is on chain. Brain iNFTs and royalty events are explorer-readable.

## Repository layout

```
brainpedia/
├── apps/                       deployable applications
│   ├── web/                    Next.js 15: public site, D3 viz, /api/query (single + two-phase mixture w/ pay-gate)
│   ├── mcp-server/             stdio MCP for Claude Code, published as `brainpedia-mcp` (7 tools)
│   └── brain/                  Brain-side service (multi-tenant), runs on Railway
├── packages/                   shared libraries (consumed by apps; no app→app deps)
│   ├── obsidian-parser/        Vault → article graph (FS + Local REST API plugin)
│   ├── storage-0g/             0G Storage KV + Log wrappers
│   ├── compute-0g/             0G Compute broker + OpenAI-compat client
│   ├── ens/                    ENS subname / text-record / access-token helpers
│   └── axl/                    AXL HTTP client + Mixture-of-Brains orchestrator types
├── contracts/                  Foundry: Brain, BrainOracle, BrainMinter, RoyaltyDistributor,
│                               SubnameRegistrar, AccessTokenRegistrar + lib/Errors
├── scripts/setup/              prep-deploy, register-parent, wire-ens, setup-compute,
│                               seed-from-vault, settle-royalties, push-segments
└── docs/                       0g-integration.md + architecture.md
```

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Bun workspaces + Turborepo |
| Web | Next.js 15 (App Router), Tailwind, wagmi v2 + viem v2, D3.js |
| MCP server | `@modelcontextprotocol/sdk` over stdio, bundled to a single file via `bun build`, published as `brainpedia-mcp` |
| Storage | `@0glabs/0g-ts-sdk` with a hand-rolled `Flow.submit` workaround (the SDK encodes the wrong ABI selector; see [docs/0g-integration.md](docs/0g-integration.md)) |
| Compute | `@0glabs/0g-serving-broker@0.7.5` (TEE-attested Qwen 2.5 7B) |
| Contracts | Foundry, Solidity 0.8.34, OpenZeppelin v5 (Ownable2Step + ReentrancyGuard), canonical ERC-7857 |
| ENS | `@ensdomains/ensjs` + `viem` (no hardcoded addresses) |
| AXL | `axl` daemon HTTP API + `mcp_router.py` from `gensyn-ai/axl/integrations/mcp_routing` |
| Hosting | Railway (web, brain, AXL bootstrap, hosted Obsidian) |

## Setup

Every cross-system value is environment-driven via `.env.example`. Contract addresses, RPC URLs, ENS parent name, and 0G provider details are never hardcoded in source.

```bash
bun install

# Run web + MCP locally
bun run dev

# Or use the published MCP server straight from npm
npx -y brainpedia-mcp

# Contracts
cd contracts
forge build
forge test
```

To deploy contracts to 0G mainnet:

```bash
# Brain + BrainOracle (wired together in one script)
forge script script/DeployBrain.s.sol \
  --rpc-url $ZG_RPC_URL --broadcast --verify
# Then deploy BrainMinter and RoyaltyDistributor against the Brain address
forge script script/DeployBrainMinter.s.sol --rpc-url $ZG_RPC_URL --broadcast --verify
forge script script/DeployRoyaltyDistributor.s.sol --rpc-url $ZG_RPC_URL --broadcast --verify
```

## Security

- All Solidity uses custom errors (`src/lib/Errors.sol`), Ownable2Step, ReentrancyGuard, and zero-address checks on every setter.
- `Brain.secureTransfer` requires an oracle-verified attestation bound to the live `(tokenId, from, to)` context. Standard ERC-721 transfers are blocked.
- Payments use pull-payment patterns (`pendingWithdrawals` + `withdraw()`) so a reverting recipient cannot DoS the system.
- Pre-mainnet review run via AI tooling (`audit-prep` + `solidity-auditor`). Four critical findings remediated; four accepted with documented reasoning in `contracts/KNOWN_ISSUES.md`. A human Pashov-style audit is targeted before any meaningful TVL.

## Team

- **Yudhishthra Sugumaran** ([@0xYudhishthra](https://twitter.com/0xYudhishthra) on X, `yudhishthra` on Telegram)

## License

MIT
