# Submission Kit — 0G APAC Hackathon (May 2026)

Everything needed to ship the submission, in one place. Most copy is ready to paste; only the video needs you in front of a camera.

## 1. X post (mandatory)

Two options. Pick one.

### Option A: Single tweet (recommended for first publication)

```
brainpedia turns any folder of notes (md, pdf, docx, txt) into a paid
AI agent on 0G mainnet. other agents pay you in 0G when they query.

hero mixture settlement tx (2 brains, 1 tx):
chainscan.0g.ai/tx/0x50bbb323eacb42e59b4bd617f6e2486d4cc402cd6f9aaf11fc71b16af8e506ba

mint your own: brainpedia.up.railway.app/create

#0GHackathon #BuildOn0G
@0G_labs @0g_CN @0g_Eco @HackQuest_
```

Attach: screenshot of brainpedia.up.railway.app landing page (the hero with the "winner: ETHGlobal Open Agents" pill row), OR a 15-second screen recording of the /create flow.

### Option B: 4-tweet thread (deeper)

**Tweet 1 — hook**
```
most of human expertise sits in someone's notes folder. AI agents
can't pay to use it. they burn tokens on general-purpose models
while domain experts capture nothing.

brainpedia rewrites the supply side.

#0GHackathon #BuildOn0G
```

**Tweet 2 — what**
```
any human turns any folder (markdown, pdf, word, plain text) into
an ERC-7857 AI brain on 0G mainnet.

drop the folder at brainpedia.up.railway.app/create.
connect a wallet. sign one transaction.

other agents pay you in 0G when they query.
```

**Tweet 3 — proof**
```
mixture-of-brains: one question, multiple expert brains, royalties
settled in a single tx on 0G mainnet.

live hero tx (2 brains paid in one block):
chainscan.0g.ai/tx/0x50bbb323eacb42e59b4bd617f6e2486d4cc402cd6f9aaf11fc71b16af8e506ba
```

**Tweet 4 — depth + tags**
```
0G TEE attestation gates both brain creation and per-query
inference. every response carries verified=true. ownership transfers
re-seal the encrypted manifest before changing hands. ERC-7857 done
right.

@0G_labs @0g_CN @0g_Eco @HackQuest_
```

## 2. Video script (3 min max)

Storytelling beats, not a feature tour. Each beat ~30 seconds.

### Beat 1: The problem (0:00 to 0:30)

Open on screen: ChatGPT answering a domain question generically.

Voiceover: "Agents do more research, trading, and operations every month. They all ask the same handful of general-purpose models. The human expert whose notes would actually answer the question sees nothing. There's no supply side for specialty knowledge."

### Beat 2: The discovery (0:30 to 1:00)

Cut to: brainpedia.up.railway.app landing page. Cursor lands on "winner: ETHGlobal Open Agents" pill.

Voiceover: "Brainpedia is the supply side. Any human turns any folder of knowledge into a paid AI agent on 0G. We won 0G's iNFT prize and ENS's AI integration prize at ETHGlobal Open Agents. This is the mainnet rebuild."

### Beat 3: The web flow (1:00 to 1:45)

Screen record: open /create, connect MetaMask, drag a folder containing 2 markdown files + 1 PDF, click compile.

Voiceover: "Drag any folder. We extract markdown, PDF, Word, plain text. The knowledge compiler builds a Karpathy-style wiki, uploads the snapshot to 0G Storage, and returns a merkle root."

Show: compile result panel with article list and rootHash.

"Your wallet signs the mint. The ERC-7857 iNFT is owned by you, not the server."

Sign mint tx in MetaMask. Show success state with the chainscan link.

### Beat 4: The query + settlement (1:45 to 2:30)

Cut to mixture demo or a Claude Code session.

Voiceover: "When an agent queries Brainpedia, the orchestrator fans out across multiple brains. Each runs TEE-attested inference on 0G Compute. The agent gets a synthesized answer plus citations."

Show: a mixture query running. Then: open chainscan, point at the single royalty settlement tx.

"Royalties to every brain involved settle in one transaction. Two distributed events, one block. The human owner pulls their accumulated payment whenever they want."

### Beat 5: 0G depth + call to action (2:30 to 3:00)

Cut to the "0G integration depth" section of the landing page.

Voiceover: "5 of 5 0G components on mainnet: Storage for snapshots, Compute for inference, Chain for iNFT custody, Agent ID via canonical ERC-7857, and TEE attestation gating both creation and queries. Mint your own brain at brainpedia.up.railway.app/create."

End card: project name, logo, the 4 tags + 2 hashtags.

### Filming notes

- Storytelling first. No long feature lists or jargon dumps. Setup, tension, discovery, resolution.
- Screen recording quality matters more than face-cam. If you do face-cam, keep it brief at the start and end.
- Show real chainscan tabs with real txs. Judges check.
- No em-dashes in voiceover or captions per project convention.
- Upload to YouTube or Loom unlisted, paste link into HackQuest.

## 3. Test accounts for judges

To remove onboarding friction, document one fresh-funded test wallet judges can import to play with /create end-to-end without needing 0G tokens themselves.

```
Test wallet address: <prefund a fresh wallet with 0.05 OG>
Private key: <provide privately via the HackQuest submission notes, NOT in the public repo>
0G mainnet RPC: https://evmrpc.0g.ai
Suggested action: open brainpedia.up.railway.app/create, import the key, drop any folder.
```

Do NOT commit the test private key to the repo. Add it to the HackQuest submission notes field instead.

## 4. Submission checklist

- [ ] Production env on Railway flipped to mainnet (see env list in chat context)
- [ ] Live /create page tested end-to-end on prod
- [ ] X post published with all 4 tags + 2 hashtags
- [ ] X post URL pasted into HackQuest
- [ ] 3-minute demo video uploaded to YouTube (unlisted)
- [ ] YouTube link pasted into HackQuest
- [ ] Test wallet pre-funded and key noted in HackQuest reviewer notes (NOT in repo)
- [ ] HackQuest submission form completed
- [ ] HackQuest submission submitted before May 16 23:59 UTC+8
