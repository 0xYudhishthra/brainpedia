# Deployment

Targets:

| What | Where | Why |
|---|---|---|
| `apps/web` (Next.js) | **Railway** service `brainpedia-web` | Public site at brainpedia.xyz |
| AXL bootstrap node | **Railway** service `axl-bootstrap` (Dockerfile build) | Demo Brains need a stable bootstrap peer |
| `apps/mcp-server` | **Not deployed** — runs locally on user machines via Claude Desktop | stdio MCP, no remote process needed |
| Contracts | 0G Galileo testnet (chain id 16602) via `forge script` | One-time deploy from local CLI |
| ENS contracts | Sepolia (or mainnet) via `forge script` | One-time deploy from local CLI |

## Railway — first deploy

```bash
# from the repo root, with the user logged into the Bundie workspace
railway init --name brainpedia
railway add --service brainpedia-web
railway up --service brainpedia-web
```

Set required env vars on `brainpedia-web`:

```bash
railway variable set --service brainpedia-web \
  NEXT_PUBLIC_APP_URL=https://brainpedia.xyz \
  NEXT_PUBLIC_ZG_RPC_URL=https://evmrpc-testnet.0g.ai \
  NEXT_PUBLIC_ZG_CHAIN_ID=16602 \
  NEXT_PUBLIC_ZG_EXPLORER_URL=https://chainscan-galileo.0g.ai \
  ENS_PARENT_NAME=brainpedia.eth \
  ENS_NETWORK=sepolia \
  ENS_RPC_URL=<sepolia_rpc> \
  ENS_SUBNAME_REGISTRAR_ADDRESS=<deployed_addr> \
  ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS=<deployed_addr>
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

## Custom domain

```bash
railway domain --service brainpedia-web brainpedia.xyz
```

DNS — `brainpedia.xyz` is GoDaddy-managed; add a CNAME pointing the
`@` (root) record at the Railway-provided target. Use forwarding for
the apex if Railway issues a non-apex CNAME.
