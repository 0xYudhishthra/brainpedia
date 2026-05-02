# ENS integration

> Tracks: **Best ENS Integration for AI Agents** ($2,500) + **Most Creative Use of ENS** ($2,500)

## Bounty rule we're explicitly satisfying

> *"It should be obvious how ENS improves your agent's identity or discoverability — not just a cosmetic add-on. **Demo must be functional (no hard-coded values)**."*

How we satisfy it:

| Rule | Implementation |
|---|---|
| No hardcoded ENS contract addresses | `@ensdomains/ensjs`'s `addEnsContracts(chain)` resolves Registry / Resolver / NameWrapper from the chain id. We pick the chain via `ENS_NETWORK` (`mainnet` or `sepolia`) — never inline a `0x…`. See `packages/ens/src/client.ts`. |
| No hardcoded parent name | `ENS_PARENT_NAME` env var (loader fails fast if missing). See `packages/ens/src/config.ts`. |
| No hardcoded registrar | `ENS_SUBNAME_REGISTRAR_ADDRESS`, `ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS` env vars (validated as 0x-addresses at boot). |
| No hardcoded RPC | `ENS_RPC_URL` env var (required). |
| Live resolution at runtime | The web app's `/[name]` page reads text records over RPC every render — no build-time bake-in. The MCP server resolves the agent's target Brain at query time. |

## ENS roles in Brainpedia

| Function | Mechanism |
|---|---|
| **Brain identity** | `<name>.<parent>` subname per Brain owner (we own the parent and run a permissionless `SubnameRegistrar.sol`). |
| **Brain metadata** | ENS text records: `brain.inft`, `brain.storage_root`, `brain.axl_peer_id`, `brain.specialty`, `brain.price_query`, `brain.compute_url`, plus standard `description`/`avatar`/`url`. Keys defined once in `packages/ens/src/types.ts`. |
| **Agent discovery** | `<topic>.discover.<parent>` resolves to a list of Brain ENS names via a `brainpedia.brains` text record on the shortcut. |
| **Access tokens** *(creative angle)* | `agent<hash>.client.<parent>` — one-time-use subnames issued per pay-to-query session, TTL-enforced on chain (`AccessTokenRegistrar.sol`). Brain validates by resolving the name and calling `isValid(label, agent)`. |
| **Reverse resolution** | Brain-running addresses set primary names so query logs surface human-readable names. |

## Subnames-as-access-tokens — why creative

A traditional API key system requires a separate auth service, secret distribution, and revocation. Subnames already do all three:

- **Distribution** — minting a subname is one tx; the agent's wallet auto-resolves it.
- **Verification** — anyone can resolve and check `isValid` on chain.
- **Revocation** — owner calls `revoke(label)` or the TTL elapses.

The Brain treats `agent7af2.client.bpedia.eth` as a session capability — it can read the brain it's authorized for via the on-chain Token struct, no off-chain database required.

## Verifying "no hardcoded values"

```bash
# Source-level grep — addresses must NOT appear inline
git grep -nE '0x[0-9a-fA-F]{40}' -- packages/ens/src/
# (expect: only test fixtures, no contract addresses)

git grep -nE '\.eth' -- packages/ens/src/
# (expect: zero results — parent name comes from env)
```

## Live state

| Name | Resolves to |
|---|---|
| [`bpedia.eth`](https://sepolia.app.ens.domains/bpedia.eth) | Deployer-owned parent name |
| [`yudhi.bpedia.eth`](https://sepolia.app.ens.domains/yudhi.bpedia.eth) | Sample Brain — 8 brain.* text records, all live |
| [`defi.discover.bpedia.eth`](https://sepolia.app.ens.domains/defi.discover.bpedia.eth) | Topic discovery shortcut → list of relevant Brains |
| `agenta5b68322.client.bpedia.eth` | Sample one-time-use access-token subname (TTL-bounded) |

Contracts:

| Contract | Sepolia address |
|---|---|
| `SubnameRegistrar` | [`0xBb921bFFBbbE2219D1EC365213a74097348F28F0`](https://sepolia.etherscan.io/address/0xBb921bFFBbbE2219D1EC365213a74097348F28F0) |
| `AccessTokenRegistrar` | [`0x3e7D22150d6b883a89703d760d66743D2223456b`](https://sepolia.etherscan.io/address/0x3e7D22150d6b883a89703d760d66743D2223456b) |

## Submission checklist

- [x] Functional demo, no hard-coded values — every ENS value flows through env + the grep recipe above proves no addresses inline
- [x] Obvious how ENS improves agent identity/discoverability — `<topic>.discover.bpedia.eth` shortcuts + per-Brain `brain.*` text records make Brains queryable by capability, not 0x address
- [x] Creative angle: subnames-as-access-tokens — `agent<hash>.client.bpedia.eth` issued by AccessTokenRegistrar with on-chain TTL, no off-chain auth service
- [x] Live demo: https://brainpedia.up.railway.app/yudhi reads all 8 brain.* records on every render
- [ ] Video
