# AXL integration

> Track: **Gensyn — Best Application of AXL** ($5,000)

## Bounty rules we're explicitly satisfying

> *"Must use AXL for inter-agent or inter-node communication (no centralised message broker replacing what AXL provides)."*

> *"Must demonstrate communication across separate AXL nodes, not just in-process."*

How we satisfy it:

| Rule | Implementation |
|---|---|
| Inter-node, not in-process | Each Brain is its own OS process running its own `axl` daemon with its own Ed25519 key on its own port. The orchestrator is also its own daemon. There is no shared queue, no internal channel, no Redis. |
| AXL as the comms primitive | All cross-Brain messages go through `POST /mcp/{peer_id}/{service}` (`packages/axl/src/client.ts`). The MCP server's `query_brain` tool uses it (`apps/mcp-server/src/tools/query-brain.ts`); the live web `/api/query` route also routes through `AxlClient` when `AXL_API_URL` is set in env. |
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

## Live web transport (production)

`apps/web/src/app/api/query/route.ts` picks its transport based on env:

| `AXL_API_URL` set? | `transport` field in response | Path |
|---|---|---|
| Yes | `"axl"` | `AxlClient.mcp(peerId, 'brainpedia.brain', request)` — peerId is resolved live from the target's `brain.axl_peer_id` ENS text record |
| No  | `"https"` | direct HTTPS POST to `BRAINPEDIA_BRAIN_URL/mcp` |

On Railway today the web service doesn't have an AXL daemon co-located with it, so production defaults to the HTTPS path. The AXL path is fully wired and exercised by local dev (where the AXL daemon runs at `:9012`); standing up a sidecar AXL daemon on the brainpedia-web service is one infra change away from making the live demo URL also route over AXL. The MCP-tool flow (the canonical agent path per the original spec) already uses AXL exclusively.

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

- [x] Uses AXL for inter-node communication (orchestrator ↔ Brains, MCP tool, web `/api/query` when `AXL_API_URL` set)
- [x] Communication across separate AXL nodes (each Brain in `axl_demo.py` is its own process; production live web prefers HTTPS today, AXL-via-sidecar is one infra change away)
- [x] Project built during the hackathon
- [x] Public GitHub repo with README
- [x] Working examples — `scripts/demo/axl_demo.py` + the MCP-tool flow + `/api/query` AXL transport
- [x] Architecture diagram → [architecture.md](architecture.md)
- [x] Code quality + clean docs
