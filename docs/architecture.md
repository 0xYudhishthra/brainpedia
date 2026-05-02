# Architecture

> The four-layer system that turns a personal note vault into a paid-query iNFT, discoverable by other agents.

## The four layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4 — Discovery & Identity (ENS)                       │
│  *.bpedia.eth subnames + text records + access tokens   │
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

## Mixture-of-Brains query flow

```
                   ┌──────────────────────┐
                   │  Querying Agent      │
                   │  (runs AXL node)     │
                   └──────────┬───────────┘
                              │ POST /mcp/{orch_peer}/route
                              ▼
                   ┌──────────────────────┐
                   │  Orchestrator        │
                   │  (runs AXL node)     │
                   │  Mixture-of-Brains   │
                   │  router + synthesis  │
                   └──┬────────┬────────┬─┘
        /mcp/{defi}/query  /mcp/{food}/query  /mcp/{mush}/query
                 │          │          │
                 ▼          ▼          ▼
          ┌────────┐ ┌────────┐ ┌────────┐
          │ DeFi   │ │ Malay  │ │ Mush   │
          │ Brain  │ │ Brain  │ │ Brain  │
          │ (AXL)  │ │ (AXL)  │ │ (AXL)  │
          └────────┘ └────────┘ └────────┘
```

Every node in the picture is its own AXL daemon process (separate
Ed25519 keypair, separate port). The orchestrator's "fan out" is three
concurrent `POST /mcp/{brain_peer_id}/brainpedia.brain` calls.

## Onboarding: vault → Brain

1. User pastes one-line MCP config into Claude Desktop.
2. User says: *"Set up my Brain from `/Users/yudhi/Documents/SecondBrain`"*.
3. The MCP server (`apps/mcp-server`):
   - Walks the vault via `@brainpedia/obsidian-parser`
   - Asks the host LLM (Claude) to compile clusters of notes into wiki articles
   - Streams compiled articles to 0G Storage **KV layer** (mutable working copy)
   - On finalize, takes a **Log layer** snapshot → merkle root
   - Mints `Brain.sol` with `initialStorageRoot = merkleRoot`
   - Calls `SubnameRegistrar.register(label, owner)` → `<name>.bpedia.eth`
   - Writes ENS text records: `brain.inft`, `brain.storage_root`, `brain.axl_peer_id`, `brain.specialty`, `brain.price_query`, `brain.compute_url`, plus standard `description`/`avatar`/`url`.

## Discovery: agent → Brain

1. Agent resolves a topic shortcut, e.g. `defi.discover.bpedia.eth`, to a list of Brain ENS names (text record `brainpedia.brains`).
2. For each Brain, agent reads text records → gets peer ID, price, iNFT address.
3. Agent calls `Brain.authorizeUsage{value: pricePerQuery}(tokenId, agent, ttl)` — payment forwards to Brain owner, `UsageAuthorized` event fires.
4. (Optional) `AccessTokenRegistrar.issue("agent7af2", agent, brainNameHash, ttl)` mints a one-time-use subname `agent7af2.client.bpedia.eth` for the session.
5. Agent calls `POST /mcp/{brain_peer_id}/brainpedia.brain` with `{prompt, accessToken: "agent7af2.client.bpedia.eth"}`.
6. Brain validates the access token (ENS resolution + `AccessTokenRegistrar.isValid`), retrieves articles from 0G Storage, runs inference on 0G Compute, returns `{answer, citations, confidence}`.

## Royalty splits

When the orchestrator synthesizes a multi-Brain answer, it computes
per-Brain contribution weights (citation count + confidence-weighted
share) and emits one `BrainPayment` event per contributing Brain. v1
demo logs splits; v2 wires actual on-chain forwards through
`Brain.authorizeUsage` with weighted amounts.

## Track-specific docs

- [0g-integration.md](0g-integration.md) — Storage, Compute, iNFT
- [ens-integration.md](ens-integration.md) — Subnames, text records, access tokens, dynamic discovery
- [axl-integration.md](axl-integration.md) — Per-Brain daemons, MCP routing, mesh bootstrap
