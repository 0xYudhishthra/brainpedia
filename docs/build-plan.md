# Build plan

5 days, solo, Claude Code. Hard cutoff May 3rd, 2026.

| Day | Output |
|---|---|
| **Day 1** | Scaffold (this commit). Monorepo, all package surfaces, Foundry contracts compiling, Python demo skeleton. |
| **Day 2** | 0G integration: real Storage upload (Log + KV), Compute setup (broker.ledger + OpenAI client), iNFT mint flow. End-of-day target: a full vault → 0G Storage → iNFT mint → fetch back → query via 0G Compute. |
| **Day 3** | ENS integration: register `bpedia.eth` (Sepolia first), wrap, deploy registrars, write text records helper. End-of-day target: `yudhi.bpedia.eth` resolves with all Brain text records. |
| **Day 4** | AXL integration: real `axl` daemons, wire each Brain's MCP service via `brain_service.py`, finish the orchestrator router/synthesizer. End-of-day target: a query through the orchestrator returns a synthesized answer from 3 Brains. |
| **Day 5** | Public Brain page UI with D3.js network visualization, demo recording, submission. |

Slack: 2 days for buffer + recording.

## Risk register

| # | Risk | Mitigation |
|---|---|---|
| 1 | ENS Sepolia subname registrar quirks | Validate Day 3 morning. Fallback: deploy `bpedia.eth` on mainnet. |
| 2 | AXL daemon misbehaves on macOS/Linux | Test Day 4 morning. Fallback: run all 4 daemons on a remote VM and tunnel. |
| 3 | 0G Compute provider availability | Verify Day 2. Fallback: pin a specific provider via `ZG_COMPUTE_PROVIDER_*` env vars. |
| 4 | iNFT update flow (re-mint vs append) | `Brain.appendStorageRoot` already implemented — append-only IntelligentData[]. ✅ |
| 5 | Payment story for the demo | Real `authorizeUsage` calls, pre-funded wallet so finality doesn't break the demo. |
