# AXL integration

> Track: **Gensyn — Best Application of AXL** ($5,000)

## Bounty rules we're explicitly satisfying

> *"Must use AXL for inter-agent or inter-node communication (no centralised message broker replacing what AXL provides)."*

> *"Must demonstrate communication across separate AXL nodes, not just in-process."*

How we satisfy it:

| Rule | Implementation |
|---|---|
| Inter-node, not in-process | Each Brain is its own OS process running its own `axl` daemon with its own Ed25519 key on its own port. The orchestrator is also its own daemon. There is no shared queue, no internal channel, no Redis. |
| AXL as the comms primitive | All cross-Brain messages go through `POST /mcp/{peer_id}/{service}` (`packages/axl/src/client.ts`). |
| Working examples | `scripts/demo/axl_demo.py` spins up 4 separate daemons + per-Brain `brain_service.py` (3 Brains + 1 orchestrator), bootstraps the mesh, runs a single query through fan-out, prints the synthesized answer. |
| Public repo with README | This file + `scripts/demo/README.md`. |

## Daemon layout for the demo

| Process | AXL port (default) | Ed25519 key | Service registered |
|---|---|---|---|
| Orchestrator | 9002 | per-process | `brainpedia.orchestrator` |
| DeFi Brain | 9012 | per-process | `brainpedia.brain` |
| Malaysia Brain | 9013 | per-process | `brainpedia.brain` |
| Mushroom Brain | 9014 | per-process | `brainpedia.brain` |

The orchestrator is the bootstrap peer — Brains register it in their `node-config.json` `bootstrap_peers` so they can find each other through it.

## Routing primitives used

| Endpoint | Use |
|---|---|
| `GET /topology` | Orchestrator inventories connected Brains |
| `POST /mcp/{peer}/brainpedia.brain` | Orchestrator → Brain query |
| `POST /a2a/{peer}` | Brain → Brain coordination (e.g., asking another Brain for a citation it already cached) |

## Mapping to AXL's "Decentralised Agent Messaging" suggested build

> *"Build a messaging or discovery platform where AI agents find each other, form groups, and communicate peer-to-peer."*

- **Discovery layer** → ENS subnames + text records (`brain.axl_peer_id`).
- **Messaging layer** → AXL `/mcp` and `/a2a` endpoints.
- **Groups** → Mixture-of-Brains queries form an ad-hoc group per question, weighted by topic relevance.

## Submission checklist

- [x] Uses AXL for inter-node communication (orchestrator ↔ Brains)
- [x] Communication across separate AXL nodes (each Brain is its own process)
- [x] Project built during the hackathon
- [x] Public GitHub repo with README
- [x] Working examples — `scripts/demo/axl_demo.py`
- [x] Architecture diagram → [architecture.md](architecture.md)
- [x] Code quality + clean docs
