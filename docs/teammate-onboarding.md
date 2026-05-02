# Teammate onboarding — turn your Obsidian vault into a paid Brain

A 5-step setup. Anyone with their own wallet can self-onboard end-to-end — no permission from the Brainpedia deployer needed since `Brain.mint` runs through the permissionless `BrainMinter` wrapper.

## What you need

1. A testnet wallet (MetaMask, Rabby — anything that exposes a private key)
2. ~3 OG on **0G Galileo** — faucet at https://faucet.0g.ai (single request gives 1 OG, hit a few times to clear the 0G Compute ledger minimum)
3. ~0.05 Sepolia ETH — any [Sepolia faucet](https://www.alchemy.com/faucets/ethereum-sepolia) works
4. **Either** Claude Desktop **or** Claude Code installed locally (Brainpedia's MCP server runs identically under both)
5. Your Obsidian vault, reachable one of two ways:
   - **(a) Filesystem**: any folder of Markdown files (works for vaults, plain notes folders, anything the parser can read).
   - **(b) Obsidian Local REST API plugin** (recommended for the demo): install the [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api), grab the API key from its settings tab, paste it into the MCP config as `OBSIDIAN_REST_API_KEY`. No filesystem path needed; Brainpedia auto-discovers the active vault from your running Obsidian instance.
   - **(c) Hosted Obsidian on Railway** (for demo continuity): point at `tramway.proxy.rlwy.net:12789` (the Brainpedia-hosted Obsidian) and set `OBSIDIAN_VAULT_PATH=users/<your-handle>` to scope reads to your subfolder of the shared vault. One container, N independent per-user "vaults" as folders.

## Step 1 — install the MCP server

One command, no clone needed:

```bash
npx -y brainpedia-mcp --version   # downloads + caches the published bundle
```

(Behind the scenes this fetches the bundled single-file artifact from npm; nothing is built locally.)

## Step 2 — wire your wallet into the MCP server

There's no "connect wallet" browser flow — Brainpedia's MCP server runs as a local CLI process and reads your private key from its own env. "Connecting your wallet" means putting `ZG_WALLET_PRIVATE_KEY` (and the other env vars) into the host's MCP config so the process inherits them at startup. The PK never leaves your machine.

Pick whichever host you use:

### Option A — Claude Code (the CLI)

One command (user-scope, so the config applies in every project you work in but stays out of any repo):

```bash
claude mcp add-json brainpedia '{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "brainpedia-mcp"],
  "env": {
    "ZG_WALLET_PRIVATE_KEY": "0x<your-testnet-pk>",
    "ZG_INFT_CONTRACT_ADDRESS": "0x4E5c6DC869F9B3220F01de9047031cEd1577b08F",
    "BRAIN_MINTER_ADDRESS": "0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7",
    "ZG_RPC_URL": "https://evmrpc-testnet.0g.ai",
    "ZG_COMPUTE_PROVIDER_ADDRESS": "0xa48f01287233509FD694a22Bf840225062E67836",
    "ZG_COMPUTE_PROVIDER_URL": "https://compute-network-6.integratenetwork.work",
    "ZG_COMPUTE_MODEL": "qwen/qwen-2.5-7b-instruct",
    "ENS_NETWORK": "sepolia",
    "ENS_PARENT_NAME": "bpedia.eth",
    "ENS_RPC_URL": "https://ethereum-sepolia.publicnode.com",
    "ENS_SUBNAME_REGISTRAR_ADDRESS": "0xBb921bFFBbbE2219D1EC365213a74097348F28F0",
    "ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS": "0x3e7D22150d6b883a89703d760d66743D2223456b",
    "AXL_API_URL": "http://127.0.0.1:9012",
    "OBSIDIAN_REST_API_KEY": "<paste-from-Local-REST-API-plugin-settings>",
    "OBSIDIAN_VAULT_PATH": "users/<your-handle>"
  }
}' --scope user
```

**Note**: the env block above uses the **Local REST API plugin path** (recommended). If you'd rather point at a filesystem folder instead, drop `OBSIDIAN_REST_API_KEY` and add `"BRAINPEDIA_DEFAULT_VAULT_PATH": "<absolute-path>/your-obsidian-vault"`. If both are set, the REST API path wins (auto-syncs with whatever vault Obsidian has open).

**`OBSIDIAN_VAULT_PATH`** is optional. Use it when you're sharing one Obsidian instance across multiple users (e.g. Brainpedia's hosted demo Obsidian on Railway). Set it to a folder prefix like `users/yudhi` and only notes under that path are read; slugs are computed relative to the prefix so wikilinks stay portable. Leave it unset for a personal vault.

Verify with `claude mcp list` — `brainpedia` should appear with `✓ Connected`.

Scopes:
- `--scope user` (above) — config lives in `~/.claude.json`, available across every project under your user. Right choice for a personal wallet.
- `--scope local` — only this directory + your user. Lives in `.claude/settings.local.json`.
- `--scope project` — committed to `.mcp.json` in the repo root, shared with the team. **Don't use for the wallet** — your PK would end up in git.

If you'd rather not use the CLI, the same JSON object goes under `mcpServers.brainpedia` in `~/.claude.json` directly.

Then start Claude Code (`claude`) and ask it to set up your Brain — see Step 3.

### Option B — Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or the equivalent on your OS. Same JSON object, wrapped in the standard `mcpServers` block:

```json
{
  "mcpServers": {
    "brainpedia": {
      "command": "npx",
      "args": ["-y", "brainpedia-mcp"],
      "env": {
        "ZG_WALLET_PRIVATE_KEY": "0x<your-testnet-pk>",
        "ZG_INFT_CONTRACT_ADDRESS": "0x4E5c6DC869F9B3220F01de9047031cEd1577b08F",
        "BRAIN_MINTER_ADDRESS": "0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7",
        "ZG_RPC_URL": "https://evmrpc-testnet.0g.ai",
        "ZG_COMPUTE_PROVIDER_ADDRESS": "0xa48f01287233509FD694a22Bf840225062E67836",
        "ZG_COMPUTE_PROVIDER_URL": "https://compute-network-6.integratenetwork.work",
        "ZG_COMPUTE_MODEL": "qwen/qwen-2.5-7b-instruct",
        "ENS_NETWORK": "sepolia",
        "ENS_PARENT_NAME": "bpedia.eth",
        "ENS_RPC_URL": "https://ethereum-sepolia.publicnode.com",
        "ENS_SUBNAME_REGISTRAR_ADDRESS": "0xBb921bFFBbbE2219D1EC365213a74097348F28F0",
        "ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS": "0x3e7D22150d6b883a89703d760d66743D2223456b",
        "AXL_API_URL": "http://127.0.0.1:9012",
        "OBSIDIAN_REST_API_KEY": "<paste-from-Local-REST-API-plugin-settings>",
    "OBSIDIAN_VAULT_PATH": "users/<your-handle>"
      }
    }
  }
}
```

Restart Claude Desktop. Brainpedia will show up in the MCP tools list.

### Why this works (and why "connect wallet" doesn't apply)

The "wallet" in this stack isn't a browser extension — it's just the PK that signs Galileo + Sepolia txs. The MCP server uses ethers/viem under the hood, sees `ZG_WALLET_PRIVATE_KEY` in its env, and signs whatever Claude asks it to (mint, registerSubname, setText, Flow.submit, ledger top-ups). No wallet popup, no SIWE, no signature requests in the chat — Claude orchestrates, the MCP server signs, you read the resulting tx hashes in the response.

This means your PK should be a *testnet-only key* you don't reuse anywhere — treat the env block like you would any secret on disk.

## Step 3 — set up your Brain

In Claude Code (`claude`) or Claude Desktop:

> Set up my Brain from `/Users/me/Documents/SecondBrain`. Pick "yourname" as the subname and "your-specialty-here" as the brain.specialty.

Claude will call:

1. **`setup_brain`** → reads your vault, returns the parsed graph (notes + frontmatter + wikilinks). Costs nothing.
2. **Compile step (Claude does this in-context)** → groups related notes into wiki-style articles per the Karpathy-LLM-Wiki pattern. This is real LLM work happening on Anthropic's side — no on-chain cost, just Claude tokens.
3. **`upload_articles`** → pushes the compiled articles to **0G Storage** (KV layer for the live editable copy + Log layer for the merkle-rooted snapshot). Costs ~0.001 OG in `Flow.submit` fees.
4. **`finalize_brain`** → calls `BrainMinter.mintToSender(rootHash, description)` on Galileo (~0.001 OG gas), then registers `<yourname>.bpedia.eth` on Sepolia (~0.005 ETH gas), then writes 8 brain.* text records (~0.005 ETH gas). The minted iNFT is owned by your wallet; the ENS subname is owned by your wallet.

After this you own:
- `tokenId N` on Brain.sol (`0x4E5c…b08F` on Galileo)
- `<yourname>.bpedia.eth` on Sepolia ENS

## Step 4 — make money on it

Your Brain is now reachable to other agents. Each query pays you `brain.price_query` wei (default `0.001 OG`).

```bash
# Anyone with the access token can query your brain:
curl -X POST https://brainpedia.up.railway.app/api/query \
  -H 'content-type: application/json' \
  -d '{"prompt": "...", "target": "yourname.bpedia.eth"}'
```

For multi-brain queries that include yours, the orchestrator computes citation-weighted splits and `RoyaltyDistributor` (`0x44eaad…0649`) settles them on chain — your share lands directly in the wallet that owns your tokenId.

## Step 5 — iterate

Edited your vault? In Claude Code or Claude Desktop:

> Sync my Brain — re-read the vault and push a new snapshot.

Calls `sync_vault` → diffs against the current snapshot → uploads the new one → `Brain.appendStorageRoot(yourTokenId, newRoot, "snapshot v2")` → updates your `brain.storage_root` ENS text record.

Old snapshots stay on chain forever (the iNFT's `IntelligentData[]` is append-only) so callers can reference historical versions of your brain.

---

## What you don't need to do

- Deploy any contract (Brain.sol + SubnameRegistrar + AccessTokenRegistrar + RoyaltyDistributor + BrainMinter all already live)
- Ask anyone for permission (mint is permissionless via BrainMinter)
- Pay rent for ENS (subnames under `bpedia.eth` are free — we own the parent and the registrar's `register` is unrestricted)
- Run any infrastructure (Brainpedia's web + brain are on Railway, axl-bootstrap is up)

## What we don't handle yet

- **Wallet provisioning.** You bring your own wallet. Privy / Magic embedded wallets are a v2 add — for now the wallet management story is "use whatever you already have."
- **Mainnet.** Everything is testnet (Galileo + Sepolia). Mainnet payments would need `bpedia.eth` registered on Ethereum mainnet (~$5/yr) and a fresh deploy of all five contracts.
- **Vault re-sync from a hosted vault.** `sync_vault` reads your local filesystem only — no Obsidian Sync / iCloud / Notion integration yet.
