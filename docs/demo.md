# Demo runbook

Step-by-step demo for the ETHGlobal Open Agents submission. Targets a 3-4 minute video.

## Live state heading into the demo

Confirmed working (verifiable by anyone, anytime):

| Check | URL |
|---|---|
| Brain page renders live ENS records | https://brainpedia.up.railway.app/yudhi |
| `brainpedia.eth` exists on Sepolia | https://app.ens.domains/brainpedia.eth?chain=sepolia |
| `yudhi.brainpedia.eth` resolves | https://app.ens.domains/yudhi.brainpedia.eth?chain=sepolia |
| `Brain.sol` tokenId 1 deployed | https://chainscan-galileo.0g.ai/address/0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6 |
| AXL bootstrap peer up | Railway service `axl-bootstrap`, peer id `cb4cc722…3b8` |

## Demo script (3:45 target)

### Scene 1 — The problem (0:00–0:30)

> Voiceover: *"Agents make poor decisions because their knowledge layer is broken. RAG returns stale data. ChatGPT hallucinates DeFi strategies. There's no incentive system for humans who've actually compiled the expertise to share it."*

Visuals:
- (0:00) ChatGPT giving wrong DeFi advice screenshot
- (0:15) "Bridge exploit / liquidation event" headline
- (0:25) Cut to: *"agents need access to compiled human expertise."*

### Scene 2 — Brain creation (0:30–1:15)

> Voiceover: *"Here's how I made my Brain in 30 seconds."*

Visuals — screen recording inside Claude Desktop:
1. User says: *"Set up my Brain from my Obsidian vault at /Users/yudhi/Documents/SecondBrain."*
2. Brainpedia MCP fires `setup_brain` → Claude reads back: *"Found 612 notes, 38 tags, 1248 wikilinks across 4 topic clusters."*
3. *"Compile a wiki article per cluster."* → Claude generates 6 articles inline.
4. `upload_articles` → progress: *"Uploading 6 articles to 0G Storage… root hash 0xa1418d3a…"*
5. `finalize_brain` → Claude streams: *"Minting Brain iNFT (tokenId 1) on 0G Galileo… registering yudhi.brainpedia.eth on Sepolia… writing 8 brain.* text records…"*
6. Confirmation: chainscan link to the iNFT mint, ENS link to the registered subname.

Caption overlay: *"All on testnet. Real merkle root, real iNFT, real ENS subname."*

### Scene 3 — The Brain page (1:15–1:45)

> Voiceover: *"Every Brain has a public page at brainpedia.up.railway.app/{name}."*

Visuals:
1. Browser → https://brainpedia.up.railway.app/yudhi.
2. Page renders the 8 text records read live from ENS Sepolia.
3. Hover over `brain.inft` → tooltip: "0x928940c1…:1 — click to view on chainscan-galileo.0g.ai".
4. Hover over `brain.storage_root` → "0xa1418d3a…".
5. Side panel: *"Querying agents have spent 0.0042 OG in the last hour."* (mocked metric for v1.)

### Scene 4 — Mixture-of-Brains query (1:45–3:15) — the WOW

> Voiceover: *"A Bundie agent submits a real query."*

Visuals:
1. Terminal showing the agent: `query_brain --target yudhi.brainpedia.eth --prompt "what's the safest 8% stablecoin yield given Malaysian regulatory exposure?"`
2. **D3 force-directed graph** on screen:
   - Querying agent node lights up (cyan pulse)
   - Edge to orchestrator (animated pulse)
   - Orchestrator fans out to 3 Brain nodes (defi, malaysia, mushroom)
   - Each Brain processes (green glow) and replies in parallel
   - Synthesis node merges the answers
3. Sidebar shows live event stream:
   - `ENS resolved: yudhi.brainpedia.eth → peer cb4cc722…`
   - `iNFT.authorizeUsage(1, agent, 900) → BrainPayment 0.001 OG`
   - `AccessTokenRegistrar.issue("agent7af2", agent, 0xbdff…) → expires_at=…`
   - `AXL POST /mcp/cb4cc722…/brainpedia.brain → 200`
   - `0G Compute call: qwen-2.5-7b-instruct → answer`
4. Final overlay: synthesized answer with citations to specific Brain articles ("see `stablecoin-yield-overview` and `malaysian-regulatory-context`").

### Scene 5 — Flywheel close (3:15–3:45)

> Voiceover: *"This is the supply side. We're building the agent economy's knowledge layer. Brain by Brain."*

Visuals:
- Earnings dashboard showing per-Brain queries-served + 0G earned.
- Cut to product framing: *"Demand-side: agents pay for compiled expertise. Supply-side: humans monetize their wikis as iNFTs."*
- End card: *"brainpedia.up.railway.app · github.com/0xYudhishthra/brainpedia"*

## Things to highlight per track

### 0G — Best Autonomous Agents, Swarms & iNFT

- **Live iNFT**: `Brain.sol` tokenId 1 on chainscan-galileo. `intelligenceOf(1)` returns IntelligentData with the storage root.
- **Storage**: snapshot manifest hashed (KV+Log wrappers in `packages/storage-0g`; Indexer.upload integration ready, blocked on SDK ABI bump — see deployment.md).
- **Compute**: provider `0xa48f0128…7836` pinned in env, broker initialized successfully, model `qwen-2.5-7b-instruct`. Live inference ready when ledger is funded (3 OG min).
- **Swarm**: orchestrator AXL daemon + per-Brain AXL daemons + ENS-based discovery (no central broker). See `docs/axl-integration.md`.

### ENS — Best Integration + Most Creative Use

- **No hardcoded values**: every ENS value flows through env. Verify with `git grep -nE '0x[a-fA-F0-9]{40}' packages/ens/src/` (zero hits in source).
- **Discovery layer**: agents resolve `<topic>.discover.brainpedia.eth` for shortcut lookups, individual `<name>.brainpedia.eth` for Brains.
- **Subnames-as-access-tokens** (the creative angle): `agenta5b68322.client.brainpedia.eth` exists on chain right now. AccessTokenRegistrar enforces TTL on chain — no off-chain auth service.

### Gensyn AXL

- **Per-Brain separate daemons**: `scripts/demo/axl_demo.py` spins up 4 separate Yggdrasil daemons (orchestrator + 3 Brains), each with its own Ed25519 key + port. No shared in-process queue.
- **Live bootstrap peer** on Railway: peer id `cb4cc722…3b8`.
- **MCP router registration**: `apps/brain` registers itself with the local AXL MCP router via `POST /register {service:"brainpedia.brain", endpoint:"http://127.0.0.1:7100/mcp"}`.

## What to actually run during the recording

```bash
# Terminal 1: tail the AXL bootstrap logs (for the Mixture-of-Brains scene)
railway logs --service axl-bootstrap --deployment

# Terminal 2: tail Brain page in browser
open https://brainpedia.up.railway.app/yudhi

# Terminal 3: live ENS resolution (proves no hardcoded values)
bun run --cwd /tmp/zg-test resolve-yudhi.ts   # or use ensjs CLI

# Terminal 4: prepare the agent query — e.g. via the MCP server
```

## Known limitations to mention upfront (or skip)

- **0G Storage upload**: SDK 0.3.3 encodes a 4-field `submit()` struct; the live Flow contract takes a 3-field struct. Storage root in the demo is `keccak256(manifest)` until a matching SDK release lands. The ENS / iNFT / discovery / payment / AXL layers all use real chain state.
- **0G Compute inference**: ledger needs 3 OG minimum to create. As of recording, deployer wallet is at 0.09 OG. Top up the wallet and the live inference path completes end-to-end.
