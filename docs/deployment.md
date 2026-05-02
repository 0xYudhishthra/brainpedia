# Deployment

Targets:

| What | Where | Why |
|---|---|---|
| `apps/web` (Next.js) | **Railway** service `brainpedia-web` | Public site at brainpedia.up.railway.app |
| AXL bootstrap node | **Railway** service `axl-bootstrap` (Dockerfile build) | Demo Brains need a stable bootstrap peer |
| `apps/mcp-server` | **Not deployed** — runs locally on user machines via Claude Desktop | stdio MCP, no remote process needed |
| Contracts | 0G Galileo testnet (chain id 16602) via `forge script` | One-time deploy from local CLI |
| ENS contracts | Sepolia (or mainnet) via `forge script` | One-time deploy from local CLI |

## Deployed contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| `Brain.sol` (ERC-7857) | 0G Galileo (16602) | `0x4E5c6DC869F9B3220F01de9047031cEd1577b08F` | [chainscan-galileo](https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F) |
| `SubnameRegistrar.sol` | Sepolia (11155111) | `0xBb921bFFBbbE2219D1EC365213a74097348F28F0` | [sepolia.etherscan](https://sepolia.etherscan.io/address/0xBb921bFFBbbE2219D1EC365213a74097348F28F0) |
| `AccessTokenRegistrar.sol` | Sepolia (11155111) | `0x3e7D22150d6b883a89703d760d66743D2223456b` | [sepolia.etherscan](https://sepolia.etherscan.io/address/0x3e7D22150d6b883a89703d760d66743D2223456b) |

Deployer for all three: `0xD24e06f0DBadA268314DbcB97F48f87b85b6Dd30`. (The original `0x0a9a3BB8…` was lost mid-build; everything was redeployed under the new key. Old contracts at `0x928940c1…3Ef6` and `0x36ce746e…4fd9` remain on chain as historical artifacts.)

## Railway project

Already created under the Bundie workspace:

- **Project**: `brainpedia` — id `941699b4-511f-4e87-a65e-48d67a9f37dc`
- **Dashboard**: https://railway.com/project/941699b4-511f-4e87-a65e-48d67a9f37dc
- **Services** (both empty, env-vars-set, sources not yet linked):
  - `brainpedia-web` — id `1d499176-abc5-4bb7-afb5-f88fb044a2fc`
  - `axl-bootstrap` — id `11e504a7-68a7-4bc6-a2ad-958deada4d4b`

## Linking the GitHub repo (one-time)

The repo is private, so the [Railway GitHub app](https://github.com/apps/railway-app) needs permission for `0xYudhishthra/brainpedia` first. Then in the dashboard for each service:

1. **brainpedia-web** → Settings → Source → connect repo → set:
   - Repo: `0xYudhishthra/brainpedia`
   - Branch: `main`
   - Root Directory: `apps/web`
2. **axl-bootstrap** → Settings → Source → connect repo → set:
   - Repo: `0xYudhishthra/brainpedia`
   - Branch: `main`
   - Dockerfile Path: `scripts/setup/Dockerfile.axl-bootstrap`

(Once linked, every push to `main` auto-deploys.)

## Required env vars (already set)

`brainpedia-web`:

```
NEXT_PUBLIC_APP_URL          = https://brainpedia.up.railway.app
NEXT_PUBLIC_ZG_RPC_URL       = https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_ZG_CHAIN_ID      = 16602
NEXT_PUBLIC_ZG_EXPLORER_URL  = https://chainscan-galileo.0g.ai
ENS_NETWORK                  = sepolia
ENS_PARENT_NAME              = bpedia.eth
ENS_ACCESS_TOKEN_TTL_SECONDS = 900
```

Still pending (set after Day 3 deploys):

```
ENS_RPC_URL                       = <sepolia rpc>
ENS_SUBNAME_REGISTRAR_ADDRESS     = <deployed addr>
ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS = <deployed addr>
ZG_INFT_CONTRACT_ADDRESS          = <deployed addr>
```

`axl-bootstrap`:

```
AXL_API_LISTEN       = 0.0.0.0:9002
AXL_NODE_CONFIG_PATH = /etc/axl/node-config.json
```

To set additional vars later:

```bash
railway variable set --service brainpedia-web KEY=VALUE
```

## AXL bootstrap node

The bootstrap node needs a persistent Ed25519 key. Generate it locally first
(do not bake it into the image):

```bash
python -c "from nacl.signing import SigningKey; \
           k = SigningKey.generate(); \
           print('PRIVATE_HEX=' + k.encode().hex()); \
           print('PUBLIC_HEX (peer id)=' + k.verify_key.encode().hex())"
```

Then create the service:

```bash
railway add --service axl-bootstrap
railway variable set --service axl-bootstrap \
  AXL_PRIVATE_KEY_HEX=<from_above>
```

Mount a node-config.json that reads `AXL_PRIVATE_KEY_HEX` at startup,
or build it from a small entrypoint script that templates the config.

The resulting public peer id is what gets put into every demo Brain's
`bootstrap_peers` list (`AXL_BOOTSTRAP_PEERS=tls://<host>:9002#<public_hex>`).

## Domain

The canonical URL is the Railway-provided `brainpedia.up.railway.app`. No custom domain is in use.
