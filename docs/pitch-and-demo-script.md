# Brainpedia — Pitch + Demo Script

> 0G APAC Hackathon. **Two separate videos, each MAX 3:00.** Submit both on HackQuest.
> Pitch video = the story + why it matters + team (≤3:00). Demo video = pure product, live, hitting the judging criteria (≤3:00).
> Storytelling order: setup, tension, discovery, resolution. No em-dashes when spoken.
> Provider note: inference runs on a Phala dstack TEE node (gpt-5.4-mini) via 0G Compute mainnet. Do NOT say "Qwen".
> Hard rule: neither video exceeds 3:00. The demo 3:00 cap is a stated hackathon requirement; keep the pitch under 3:00 too for symmetry and safety.

---

## Team one-liner (paste into HackQuest, 192 chars)

EF Devcon Scholar (1 of 50 globally). Production engineering at Etherscan and Nethermind. 30+ prizes across 40+ hackathons in 9 countries, one of EVM crypto's most active competitive builders.

---

# PART 1 — PITCH VIDEO (≤3:00, 7 slides, narrative)

The pitch sells WHY. It is separate from the demo. It must land all 5 judging criteria, with extra weight on the two the demo cannot show: Product Value & Market Potential, and Team Capability. Aesthetic: near-black canvas, lavender accent, sans-serif display, mono for hashes. Each slide skimmable in 5 seconds, voice fills the rest. Pace ~135 wpm. Land at 2:55, never past 3:00.

### Slide 1 — Hook (0:00 to 0:20)
**On screen:** `Brainpedia is the supply side of the agent economy.`
Sub: *Any human turns any folder of knowledge into a paid AI agent on 0G.*
Pills: `winner — 0G Best Autonomous Agents @ ETHGlobal Open Agents` · `live on 0G mainnet · 16661`

**Say:**
> Most human expertise sits in someone's notes folder. AI agents can't pay to use it. They burn tokens on the same generic models while the expert who could actually answer sees nothing. Brainpedia rewrites that supply side.

### Slide 2 — Problem (0:20 to 0:45)
**On screen:** `The agent economy has no supply side.`
- Autonomous agents do more research, trading, and ops every week.
- They all ask the same handful of general models.
- The human expert whose notes would answer captures none of the value.

**Say:**
> Every autonomous agent in the field does more work every week, and they all ask the same handful of general models. The domain expert whose notes would actually answer the question captures none of the value. There is no marketplace for specialty knowledge, and no rail to pay for it.

### Slide 3 — Solution (0:45 to 1:15)
**On screen:** `Drop a folder. Mint an AI agent. Get paid per query.`
Flow: drop (md, pdf, word, txt) -> compile (Karpathy wiki) -> snapshot (0G Storage) -> mint (ERC-7857 iNFT)

**Say:**
> Brainpedia changes that. Drop any folder of markdown, PDF, Word, or plain text. Our compiler turns it into a Karpathy-style wiki, snapshots it onto 0G Storage, and mints it as a canonical ERC-7857 iNFT on 0G mainnet. Other agents discover it, pay a per-query price in 0G, and you earn every time your knowledge is used.

### Slide 4 — Architecture (1:15 to 1:40)
**On screen:** `Two surfaces, one network.`
Write path: File -> Extractor -> Compiler -> 0G Storage root -> BrainMinter -> iNFT
Read path: Agent -> Orchestrator -> Mixture fan-out -> 0G Compute TEE inference -> RoyaltyDistributor (N owners paid in 1 tx)
Footer band: `0G Storage · 0G Compute · 0G Chain · Agent ID (ERC-7857) · TEE Privacy`

**Say:**
> Two surfaces split by intent. The write path mints a Brain. The read path is Mixture-of-Brains: a query fans out across many Brains, each runs attested inference on 0G Compute, and royalties settle to every owner in a single on-chain transaction. No central API, no off-chain auth.

### Slide 5 — USP / 0G depth (1:40 to 2:10)
**On screen:** `0G Compute on both ends. ERC-7857 done right.`
- 5 of 5 0G components in production
- TEE attestation at creation AND query, on a real Phala dstack TEE node
- Canonical ERC-7857: encrypted metadata sealed for owner, oracle-attested transfers, no replay across transfers

**Say:**
> What makes this different. Most submissions touch one 0G component. We use all five on mainnet. Inference runs on a real Phala TEE node through 0G Compute, so every response is genuinely attested. The iNFT is canonical ERC-7857 with metadata sealed for the owner and oracle-attested transfers. This is not a rebranded ERC-721.

### Slide 6 — Market & why now (2:10 to 2:35)
**On screen:** `Every expert folder is latent supply. Brainpedia turns it liquid.`
- Today: solo experts mint from notes (live)
- Next: firms publish case-law, research, compliance as paid Brains
- Then: cross-firm agent workflows compose Brains the way Stripe composes payments
Tagline: *Track 3: financial rails, AI commerce, self-custodial agents — all three.*

**Say:**
> Why now. Agent spend is exploding and all of it routes to a few model APIs. Brainpedia is the supply layer underneath that. Solo experts mint today. Firms publish case-law, research, and compliance knowledge as revenue-generating Brains next. The Mixture-of-Brains settlement is already cross-firm settlement. It scales the way Stripe scaled payments. This is Track 3, all three Key Directions at once.

### Slide 7 — Validation + team + ask (2:35 to 3:00)
**On screen:** `Every claim has a transaction.`
6 Brains on mainnet · 4/4 contracts verified · multi-brain royalty settled in one tx · sealed-key mint + secureTransfer demoed
Team line: `EF Devcon Scholar · ex-Etherscan + Nethermind · 30+ prizes / 40+ hackathons`
Closing line, large: `Brains outlive Brainpedia. The network is the infrastructure.`

**Say:**
> Every claim has a chainscan transaction. Six Brains on mainnet, four of four contracts verified, multi-brain royalties settled in one block, plus a sealed-key mint and an oracle-attested transfer. We won 0G's iNFT prize at ETHGlobal Open Agents. Built by an Ethereum Foundation Devcon Scholar who ran production engineering at Etherscan and Nethermind, with 30-plus prizes across 40-plus hackathons. Full docs and reproduction steps are in the repo. The brain outlives Brainpedia. The network is the infrastructure.

> **Criteria coverage:** S1-S2 problem + product value, S3-S4 technical implementation, S5 0G integration depth, S6 market potential, S7 validation + team capability + documentation. All 5 judging criteria voiced. Total lands ~2:55.

---

# PART 2 — DEMO VIDEO (≤3:00, screen + voice, zero slides)

Pure product. No pitch narration, no market talk — that lives in the pitch video. The demo's only job: show core functionality, the user flow, and how each 0G component is actually used, live on mainnet. Two surfaces: create on the web app, query from Claude Code. One continuous take is best. Pre-open chainscan tabs in the background so they snap instantly. Land by 2:55, hard stop at 3:00 (stated hackathon requirement).

> Demo-requirement note: judges explicitly want "how the 0G component is actually used" shown, not just stated. Each beat below names the 0G component on screen as it is exercised. Say the component name out loud when its tx/proof appears.

### Beat 1 — Hook + create (0:00 to 1:05) — exercises 0G Storage + 0G Chain + Agent ID
**Screen:** `brainpedia.up.railway.app`, cursor on the prize pill, click `/create`. Connect wallet. Drag a folder of md/pdf files.
**Say:**
> Brainpedia turns any folder of knowledge into a paid AI agent on 0G. I connect a wallet, drop a folder. Markdown, PDF, Word, plain text.

**Screen:** Click `1. preview compilation`. Article list renders.
**Say:**
> It compiles a Karpathy-style wiki. Nothing is on chain yet. I review the articles first.

**Screen:** Click `2. upload to 0G Storage`. Wait for rootHash + storage tx link. Click the storage tx, show it on chainscan.
**Say:**
> This is **0G Storage**. The snapshot goes to the Log layer, here is the on-chain storage transaction, and the merkle root is what the iNFT will carry.

**Screen:** Click `3. sign mint`. MetaMask confirm. Success state, click the chainscan link to the mint tx + the verified contract.
**Say:**
> My wallet signs the mint on **0G Chain**. This is the **Agent ID**, a canonical ERC-7857 iNFT, owned by me, not the server. Contract is verified on chainscan.

### Beat 2 — Query from Claude Code (1:05 to 2:10) — exercises 0G Compute + TEE Privacy
**Screen:** Claude Code with `brainpedia-mcp` installed. Type a natural prompt.
**Say:**
> Now I switch hats. I'm an agent. From Claude Code, the brainpedia MCP server fans my question across the network.

**Screen:** Run the mixture query (prompt: "What is 0G Storage and how does the Log layer differ from the KV layer?"). Show the response: brains responding, `verified: true`, citations, the payment plan with the mainnet distributor `0x7AF89556…`.
**Say:**
> Each brain runs inference on **0G Compute**, on a real Phala TEE node. See `verified: true` on every response, that is the **TEE attestation**. The orchestrator returns citations and an on-chain payment plan that pays every brain owner. The synthesized answer is gated until the agent pays.

> This is the reliable stopping point for the live query. Do NOT trigger settle live (0G mainnet confirmation timing is variable and can race the unlock). Instead, go straight to Beat 3 and prove settlement with a real confirmed tx on chainscan.

### Beat 3 — Settlement proof + close (2:10 to 3:00) — exercises 0G Chain + RoyaltyDistributor
**Screen:** Cut to a pre-opened chainscan tab on a real, confirmed settlement tx — `0x73448bd6c0f7acbe564969c3a343f7209618a6fb1a41947bee893cdb77d8064f` (live mainnet settle from this build, 0.002 OG to brain owners) OR the hero `0x9a503d7c48787d423883c0b05b690c873af1389ee75e27a315ab232e8a57230c` (3 brains, 3 Distributed events in one block). Hover the Distributed events.
**Say:**
> When the agent settles, one transaction pays every brain owner their royalty. Here it is on **0G mainnet**: the RoyaltyDistributor, the Distributed events, real OG moved. This is pay-to-read knowledge settled on chain, not a webhook.

**Screen:** Landing "0G integration depth" section, then the sealed-key mint + secureTransfer txs.
**Say:**
> Five of five 0G components, all on mainnet. Canonical ERC-7857 with metadata sealed for the owner and oracle-attested transfers. Full docs and reproduction steps are in the repo. The brain outlives Brainpedia. Mint your own at brainpedia dot up dot railway dot app slash create.

**End card:** logo · brainpedia.up.railway.app · the 4 tags + 2 hashtags.

> Why settlement is shown via chainscan, not live: the payment is 100% real and on mainnet (multiple confirmed settle txs exist). Only the synchronous in-call unlock races 0G's variable confirmation latency, which is outside our control. Showing a confirmed settlement tx is the same proof with zero camera risk. This is the locked approach, not a fallback.

---

## Recording checklist
- 1080p minimum. ScreenStudio (Mac) for cursor highlight + click zoom, or Loom.
- Fresh incognito browser profile, no bookmark bar, zoom 110%.
- Real mic. Speak slightly slower than feels natural.
- Pre-open chainscan tabs so they load instantly.
- Record the demo first (mechanical), then the pitch (narrative).
- Submit both video links on HackQuest. Public (YouTube unlisted or Loom).

## X post (mandatory) — already drafted in docs/submission-kit.md
Single tweet with screenshot, `#0GHackathon #BuildOn0G`, tags `@0G_labs @0g_CN @0g_Eco @HackQuest_`.
