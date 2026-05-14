# Brainpedia

> Brainpedia is a network where any human turns any folder of knowledge (markdown, PDF, Word, plain text) into ERC-7857 AI Brains on 0G that other agents pay to query.

- **Live web**: https://brainpedia.up.railway.app
- **Mint a Brain (no CLI)**: https://brainpedia.up.railway.app/create
- **Sample Brain**: https://brainpedia.up.railway.app/yudhi
- **Install MCP server**: `npx -y brainpedia-mcp`
- **0G integration deep-dive**: [docs/0g-integration.md](docs/0g-integration.md)
- **Architecture**: [docs/architecture.md](docs/architecture.md)
- **Security**: [contracts/SECURITY.md](contracts/SECURITY.md) · [contracts/KNOWN_ISSUES.md](contracts/KNOWN_ISSUES.md)

### Prior validation

Brainpedia previously won the **0G Best Autonomous Agents, Swarms & iNFT Innovations** prize and **ENS Best ENS Integration for AI Agents (2nd place)** at ETHGlobal Open Agents. 0G itself [announced the win on X](https://x.com/0G_labs/status/2052362392026108335). The [ethglobal.com showcase entry](https://ethglobal.com/showcase/brainpedia-ctx9g) reflects that earlier build. This submission rebuilds the project on **0G mainnet** with multi-format ingest, a web-native mint flow, a Karpathy-style knowledge framework, and the canonical ERC-7857 contract surface.

---

## The problem

Agents have no legitimate way to buy specialty knowledge. APIs are centralized, OpenAI-priced, and the human expert whose notes feed the answer sees nothing. As autonomous agents do more research, trading, and operations, this gap widens: every agent burns tokens on the same handful of general-purpose models while domain experts capture none of the value their knowledge creates.

## The solution

Brainpedia is the supply side of the agent economy. Any human publishes a folder of knowledge as a specialty AI Brain. Markdown notes, research papers (PDF), case files (Word), plain text, anything. The `@brainpedia/knowledge-compiler` pipeline extracts text per format, segments into article candidates, and compiles a Karpathy-style LLM wiki. Each Brain is an ERC-7857 iNFT minted on 0G with encrypted private metadata sealed for the owner. Other agents discover Brains, pay a per-query sticker price, and run inference against the Brain's snapshot using 0G's TEE-attested compute. A `Mixture-of-Brains` query fans out across multiple Brains and settles royalties in a single on-chain transaction. No central API, no off-chain auth service. The Brain outlives Brainpedia.

Two ways to mint:

1. **Web** at [brainpedia.up.railway.app/create](https://brainpedia.up.railway.app/create). Drag a folder, connect a wallet, sign the mint. No CLI.
2. **Claude Code** via `npx -y brainpedia-mcp`. The MCP server reads your live Obsidian vault and updates the Brain's wiki on every save. Power-user path.

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
| **`Brain.sol`** (ERC-7857 canonical) | iNFT contract holding intelligence lineage + sealed key events | mainnet [`0x4E5c…b08F`](https://chainscan.0g.ai/address/0x4e5c6dc869f9b3220f01de9047031ced1577b08f) · [verified source ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x4e5c6dc869f9b3220f01de9047031ced1577b08f/verified-contracts) |
| **`BrainOracle`** | EIP-712 attestor for ERC-7857 secure transfers (context-bound proofs) | mainnet [`0x923A…C5C0`](https://chainscan.0g.ai/address/0x923a0b7f21c57d92bfa8aa6721b574f47fe5c5c0) · [verified source ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x923a0b7f21c57d92bfa8aa6721b574f47fe5c5c0/verified-contracts) |
| **`BrainMinter`** | Permissionless self-mint wrapper, anyone can mint a Brain to themselves | mainnet [`0x3e7D…456b`](https://chainscan.0g.ai/address/0x3e7d22150d6b883a89703d760d66743d2223456b) · [verified source ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x3e7d22150d6b883a89703d760d66743d2223456b/verified-contracts) |
| **`RoyaltyDistributor`** | Multi-Brain royalty settlement with pull-payment pattern | mainnet [`0x7F26…3C49`](https://chainscan.0g.ai/address/0x7f26dede0c5e1db844c9a8138c21ca3439b63c49) · [verified source ↗](https://explorer.0g.ai/mainnet/blockchain/accounts/0x7f26dede0c5e1db844c9a8138c21ca3439b63c49/verified-contracts) |
| **`SubnameRegistrar`** + **`AccessTokenRegistrar`** (Sepolia) | ENS-based discovery and TTL-bounded capability tokens (supporting infrastructure) | [sepolia.app.ens.domains/bpedia.eth](https://sepolia.app.ens.domains/bpedia.eth) |
| **Hero mint #1** | Brain tokenId 1 minted on 0G mainnet | [chainscan tx `0xb60080c6…`](https://chainscan.0g.ai/tx/0xb60080c60aeed1d134870971b5f14cb8fe2693e22c8fcadab7b6b122cad7427f) |
| **Hero mint #2** | Brain tokenId 2 minted on 0G mainnet | [chainscan tx `0xa54b53b9…`](https://chainscan.0g.ai/tx/0xa54b53b9c4ec94796d0ec3ace20515efebd203c4dcb48386bc08429815fefd5e) |
| **Mixture royalty settlement proof** | Single tx settled 2 brains via `RoyaltyDistributor.distribute([1,2], [0.005, 0.003], reason)` — 2 `Distributed` events emitted in one block | [chainscan tx `0x50bbb323…`](https://chainscan.0g.ai/tx/0x50bbb323eacb42e59b4bd617f6e2486d4cc402cd6f9aaf11fc71b16af8e506ba) |

> All four Solidity contracts have verified source on `chainscan.0g.ai`. See [contracts/SECURITY.md](contracts/SECURITY.md) for the audit summary and [contracts/KNOWN_ISSUES.md](contracts/KNOWN_ISSUES.md) for accepted risks.

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

Two surfaces split by intent: the **MCP server is the write path** (read your vault, sign txs, mint brains, locally hold your key) and the **web app is the read+write path** (browse the network, query brains, settle royalties; plus `/create` for wallet-only mints with no CLI). Full diagram + Mixture-of-Brains flow in [docs/architecture.md](docs/architecture.md).

## Knowledge framework

`@brainpedia/knowledge-compiler` is a format-agnostic pipeline that turns any folder of mixed knowledge into a Karpathy-style LLM wiki ready to be snapshotted onto 0G Storage and minted as an ERC-7857 Brain. Each stage has a stable interface so new file formats and new compile backends slot in without touching downstream code.

```
File (md, txt, pdf, docx, ... )
   ↓ Extractor (one per format, pluggable)
RawDocument { text, structureHints, sourceMeta, format }
   ↓ Segmenter (heading-aware, page-aware, size-bounded)
ArticleCandidate[]
   ↓ Compiler (v1 deterministic; v2 swappable for 0G Compute TEE inference)
CompiledArticle[]
   ↓ buildGraph
ArticleGraph (articles + adjacency + backlinks)
   ↓ @brainpedia/storage-0g uploadSnapshot
0G Storage merkle rootHash
   ↓ BrainMinter.mintToSender(rootHash, ...)
ERC-7857 iNFT
```

Today's extractors: `markdown` (.md), `text` (.txt), `pdf` (.pdf via `pdf-parse`), `docx` (.docx via `mammoth`). Adding a new format means adding one Extractor implementation; the segmenter, compiler, graph, snapshot, and mint stages stay untouched. The v1 compiler is deterministic (kebab-slug + substring cross-references). v2 swaps in a 0G Compute backend that uses the same TEE-attested Qwen 2.5 model as the query path, so 0G Compute appears at both ends: creation and inference.

## How a query works

1. **Create a Brain**. Two paths.
   - **Web (no CLI)**: open [brainpedia.up.railway.app/create](https://brainpedia.up.railway.app/create), connect a wallet on 0G mainnet, drop a folder of mixed-format knowledge. The server runs `@brainpedia/knowledge-compiler`, uploads the compiled snapshot to 0G Storage, and returns the merkle rootHash. Your wallet signs `BrainMinter.mintToSender(rootHash, ...)`. The iNFT is owned by you, not the server.
   - **MCP (live vault sync)**: `npx -y brainpedia-mcp` inside Claude Code. Say *"set up my Brain from my Obsidian vault."* The MCP server reads your vault, lets Claude compile pages following the same schema, pushes the snapshot to 0G Storage via `upload_articles`, mints via `finalize_brain`, and writes all `brain.*` ENS text records. Subsequent saves to your vault push new snapshots via `sync_vault`.
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
│   ├── knowledge-compiler/     Format-agnostic pipeline: md/pdf/docx/txt → Karpathy LLM wiki
│   ├── obsidian-parser/        Vault → article graph (FS + Local REST API plugin)
│   ├── storage-0g/             0G Storage KV + Log wrappers
│   ├── compute-0g/             0G Compute broker + OpenAI-compat client
│   ├── ens/                    ENS subname / text-record / access-token helpers
│   └── axl/                    AXL HTTP client + Mixture-of-Brains orchestrator types
├── contracts/                  Foundry: Brain, BrainOracle, BrainMinter, RoyaltyDistributor,
│                               SubnameRegistrar, AccessTokenRegistrar + lib/Errors
├── scripts/setup/              prep-deploy, register-parent, wire-ens, setup-compute,
│                               seed-from-vault, settle-royalties, push-segments
└── docs/                       0g-integration.md + architecture.md + submission-kit.md
```

## For reviewers (60-second onboarding)

The fastest path to verify Brainpedia works end-to-end on 0G mainnet.

1. **Verify the contracts**. Open any of the four mainnet addresses in the table above and click "verified source ↗" to see the Solidity source on `explorer.0g.ai`. All four pass.
2. **See the hero settlement on chain**. [chainscan.0g.ai tx `0x50bbb323…`](https://chainscan.0g.ai/tx/0x50bbb323eacb42e59b4bd617f6e2486d4cc402cd6f9aaf11fc71b16af8e506ba) settled 2 brains in one transaction. Two `Distributed` events emitted in one block.
3. **Try the web mint flow**. Open [brainpedia.up.railway.app/create](https://brainpedia.up.railway.app/create), connect a wallet with 0G mainnet (Aristotle, chainId 16661), drop a folder containing any `.md`, `.pdf`, `.docx`, or `.txt` files, and sign the mint. The Brain is yours.
4. **Query a Brain**. Visit any Brain page via `brainpedia.up.railway.app/<name>` (start at [yudhi](https://brainpedia.up.railway.app/yudhi)) and run a mixture query through the demo widget.
5. **Read the code**. Start with [`contracts/src/Brain.sol`](contracts/src/Brain.sol), [`packages/knowledge-compiler/src/pipeline.ts`](packages/knowledge-compiler/src/pipeline.ts), and [`apps/web/src/app/api/create/route.ts`](apps/web/src/app/api/create/route.ts) to see the three layers connect.

If a test wallet was provided in HackQuest reviewer notes, import that key and skip step 3's wallet creation.

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
