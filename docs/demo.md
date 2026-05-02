# Demo runbook

Step-by-step demo for the ETHGlobal Open Agents submission. 3 minute video target.

## Live state heading into the demo

Verifiable by anyone, anytime:

| Check | URL |
|---|---|
| Brain page renders live ENS records | https://brainpedia.up.railway.app/yudhi |
| `bpedia.eth` parent on Sepolia | https://sepolia.app.ens.domains/bpedia.eth |
| `yudhi.bpedia.eth` resolves | https://sepolia.app.ens.domains/yudhi.bpedia.eth |
| `karpathy.bpedia.eth` resolves | https://sepolia.app.ens.domains/karpathy.bpedia.eth |
| `Brain.sol` on Galileo | https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F |
| `BrainMinter` on Galileo | https://chainscan-galileo.0g.ai/address/0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7 |
| `RoyaltyDistributor` on Galileo | https://chainscan-galileo.0g.ai/address/0x44eaad4fdb7d509cd3fe7624ce512cc97b910649 |
| Royalty settlement proof tx | https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e |
| AXL bootstrap peer | Railway service `axl-bootstrap`, peer id `cb4cc722…3b8` |
| MCP server on npm | https://www.npmjs.com/package/brainpedia-mcp |
| Hosted Obsidian (KasmVNC) | https://brainpedia-obsidian-production.up.railway.app |

## Demo script (3:00 target)

### Scene 1 — The supply gap (0:00–0:20)

> Voiceover: *"Every AI agent today buys its knowledge from one of three big APIs. There's no marketplace where humans can sell the specialty knowledge they've already organised in their notes. Brainpedia is that marketplace."*

Visuals: split screen showing OpenAI / Anthropic / Google logos on the left, an Obsidian vault on the right with a `?` between them.

### Scene 2 — Mint a Brain in two minutes (0:20–1:20)

> Voiceover: *"This is Karpathy's actual LLM-Wiki gist, compiled into a paid AI brain in Claude Code. One npm install, one MCP config, one prompt."*

Visuals — split: terminal + Claude Code:

1. (0:20) `claude mcp add-json brainpedia '{...}' --scope user` — show the env block being pasted (private key + ENS + 0G + Obsidian REST plugin URL).
2. (0:30) Open Claude Code session: *"Set up my Brain from my Obsidian vault as `karpathy` with specialty `llm-wiki-pattern`."*
3. (0:40) Claude calls `setup_brain` → reads back: *"Found 16 notes, 4 cross-link clusters. Loaded the Brainpedia compile schema (Karpathy LLM-Wiki pattern)."* — the key thing here is the LLM is being constrained by a schema we ship.
4. (0:50) Claude compiles wiki articles inline (visible in chat).
5. (1:00) `upload_articles` — progress: *"Pushing snapshot to 0G Storage… root `0x43121ee8…`"*
6. (1:10) `finalize_brain` — *"Minting via BrainMinter (permissionless self-mint)… registering `karpathy.bpedia.eth`… writing 8 brain.* text records."*
7. (1:18) Confirmation: chainscan link to the iNFT mint, ENS link to the registered subname.

Caption overlay: *"Real iNFT, real merkle root, real ENS. The schema makes every Brain on the network composable."*

### Scene 3 — The Brain page (1:20–1:40)

> Voiceover: *"Every Brain has a public page. No wallet, no signup."*

Visuals:

1. Browser → https://brainpedia.up.railway.app/karpathy.
2. The page renders the 8 `brain.*` text records read live from ENS Sepolia. Click `brain.inft` → opens chainscan.
3. Scroll to "Compiled articles" — show the wiki structure (entity/concept/source pages with citations).

### Scene 4 — Mixture-of-Brains query (1:40–2:30) — the WOW

> Voiceover: *"Now I'll ask the network a question. The orchestrator fans out to every Brain registered under the topic, in parallel, on a real P2P mesh. Each one returns a TEE-attested cited answer. The royalty splits settle in one tx."*

Visuals:

1. (1:40) Terminal: `curl -X POST 'https://brainpedia.up.railway.app/api/query?mode=mixture' -d '{"prompt":"safest stablecoin yield given Malaysian regulatory exposure"}'`
2. (1:45) Loading state — D3 graph on screen pulses: querying agent → orchestrator → fan-out to `yudhi.bpedia.eth` and `karpathy.bpedia.eth` in parallel.
3. (2:00) Each Brain returns `verified: true` with citations. Sidebar shows event stream:
   - `ENS resolved yudhi.bpedia.eth → tokenId 7, peer cb4cc722…`
   - `0G Compute call → answer (TEE attestation OK)`
   - `Citation-weighted split: yudhi 0.001 OG, karpathy 0.001 OG`
4. (2:15) Switch terminals: `bun run scripts/setup/settle-royalties.ts` → one tx settles both Brains. Show the `Distributed` events on chainscan.
5. (2:25) Final overlay: synthesised answer with linked citations.

### Scene 5 — Composition close (2:30–3:00)

> Voiceover: *"Karpathy's vault is now an iNFT that earns him money every time another agent queries it. Anyone can mint their own. Anyone can compose them. The supply side of the agent economy."*

Visuals:

- Show the 2-Brain network graph on https://brainpedia.up.railway.app/.
- Cut to the full submission stack: `npx -y brainpedia-mcp`, `bpedia.eth`, `RoyaltyDistributor` on chainscan, the github repo URL.
- End card: *"brainpedia.up.railway.app · npm/brainpedia-mcp · github.com/0xYudhishthra/brainpedia"*

## Things to highlight per bounty track

### 0G — Best Autonomous Agents, Swarms & iNFT Innovations ($7,500)

- **Live iNFTs**: 7 minted on `Brain.sol` ([`0x4E5c…b08F`](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F)). `currentStorageRoot(7)` for yudhi or `currentStorageRoot(6)` for karpathy returns roots that resolve to article snapshots on the 0G Storage indexer.
- **Permissionless mint**: `BrainMinter` ([`0xcca5…a2e7`](https://chainscan-galileo.0g.ai/address/0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7)) owns Brain.sol; any wallet can self-mint with `mintToSender`.
- **Royalty splits on usage**: `RoyaltyDistributor` ([`0x44ea…0649`](https://chainscan-galileo.0g.ai/address/0x44eaad4fdb7d509cd3fe7624ce512cc97b910649)) settles citation-weighted splits in one tx — proven live on tx [`0x9637800e…`](https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e) (2 brains paid, 2 `Distributed` events).
- **Storage**: KV layer for live edits, Log layer for snapshots. `Flow.submit` ABI workaround documented in `docs/0g-integration.md`.
- **Compute**: TEE-attested Qwen 2.5 7B; every `verified: true` in API responses is real attestation.
- **Swarm coordination**: ENS discovery + AXL transport + on-chain settlement, no central broker. See `docs/architecture.md`.

### ENS — Best Integration for AI Agents ($2,500)

- ENS subnames ARE the agent identity — `yourname.bpedia.eth`. 8 `brain.*` text records drive every brain interaction (iNFT ref, peer id, price, specialty, etc.).
- Discovery shortcuts route agents by practice: [`research.discover.bpedia.eth`](https://sepolia.app.ens.domains/research.discover.bpedia.eth), [`frameworks.discover.bpedia.eth`](https://sepolia.app.ens.domains/frameworks.discover.bpedia.eth), [`all.discover.bpedia.eth`](https://sepolia.app.ens.domains/all.discover.bpedia.eth).
- No hardcoded values: `git grep -nE '0x[a-fA-F0-9]{40}' packages/ens/src/` returns zero hits.

### ENS — Most Creative Use ($2,500)

- **Subnames as access tokens** — the angle. `AccessTokenRegistrar.issue(label, agent, brainNameHash, ttl)` mints `agent<hash>.client.bpedia.eth` with on-chain TTL. The Brain calls `isValid(label, agent)` at query time. No JWTs, no off-chain auth, no API keys. A capability token IS a first-class on-chain identity.
- Live token to inspect: `agentf14abfb4.client.bpedia.eth` — verified `isValid` returns `true` for the granted agent and `false` for any other.

### Gensyn AXL ($5,000)

- **Multi-node demo**: `scripts/demo/axl_demo.py` spins up 4 separate Yggdrasil daemons (orchestrator + 3 brain stubs), each with its own Ed25519 key + port. No shared in-process queue.
- **MCP-tool path uses AXL**: `apps/mcp-server/src/tools/query-brain.ts` uses `AxlClient` to `POST /mcp/{peer_id}/brainpedia.brain` over the encrypted mesh.
- **Web `/api/query` opt-in AXL**: `transport: "axl" | "https"` in mixture-mode response surfaces which transport handled each call.
- **Persistent bootstrap peer** on Railway: `cb4cc72222a27f577ac28d6a963ec95ce4b02e924ba05f17e700bd8a2e6b33b8`.

## What to actually run during recording

```bash
# 1. Open Obsidian (in browser via VNC for demo continuity)
open https://brainpedia-obsidian-production.up.railway.app

# 2. Open Claude Code in another window with brainpedia-mcp configured

# 3. Tail the brain logs (watch the inference happen)
railway logs --service brainpedia-brain --lines 50

# 4. Browser tab open to the Brain network graph
open https://brainpedia.up.railway.app

# 5. Terminal ready for the curl mixture call
```

## Notes on what's real vs prop

- **Real**: every contract address, every tx hash on chain, every TEE attestation, every ENS resolution, every Obsidian REST API call.
- **Prop for demo continuity**: the hosted Obsidian on Railway runs the same Local REST API plugin a real user would run on their laptop. Real users run Obsidian + the plugin locally; the hosted version exists so the demo doesn't need to expose your personal vault on screen.
- **Not yet wired in production**: the orchestrator role described in scene 4 is the web's `/api/query?mode=mixture` route running server-side fan-out, not a separate AXL orchestrator daemon. The 4-node Python variant in `scripts/demo/axl_demo.py` shows the daemon-per-Brain shape required by the AXL bounty's "separate AXL nodes" rule.
