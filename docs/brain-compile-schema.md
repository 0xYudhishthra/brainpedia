# Brain compile schema

> Brainpedia compiles every Brain following Andrej Karpathy's [LLM-Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). This document instantiates that pattern as Brainpedia's operational schema, so the host LLM (Claude in Claude Code or Claude Desktop) follows the same discipline whenever a user calls `setup_brain`.
>
> Credit where due: the pattern, three-layer architecture, and ingest/query/lint loop are all from Karpathy's gist. We're applying his framework to a specific domain (turning a personal vault into a queryable, monetisable, on-chain Brain) and codifying it as a tool prompt so the LLM doesn't drift.

## Three layers

A Brain is built in three concentric layers.

| Layer | What | Who owns it |
|---|---|---|
| **1. Raw sources** | The user's Obsidian vault (or any folder of markdown). Immutable from Brainpedia's perspective; the user edits it in Obsidian, we never overwrite. | The user |
| **2. The wiki** | A directory of LLM-generated wiki pages compiled from the raw sources. Entity pages, concept pages, comparison pages, an `index.md`, a `log.md`. | The host LLM (Claude) |
| **3. The schema** | This document. Tells Claude how to compile, what page types to produce, what conventions to follow, and what the published artefact looks like. | Brainpedia (this file ships with `brainpedia-mcp`) |

The wiki is what gets uploaded to 0G Storage and minted as the iNFT. Raw sources stay on the user's disk (or in their Obsidian instance via the Local REST API plugin). The schema is shared across every Brain on the network.

## Page types the LLM must produce

When Claude compiles a vault into a Brain, it produces these kinds of pages:

- **Entity pages** — one per person, place, organisation, model, paper, framework, etc. mentioned across raw sources. Each accumulates everything known about that entity from the raw collection.
- **Concept pages** — one per idea, pattern, or technique. The page is the canonical explanation, with examples drawn from the raw sources.
- **Source summaries** — one per ingested raw source. Captures takeaways and links to the entity/concept pages it touches.
- **Comparison pages** — produced on demand when a query asks for one (e.g. "X vs Y"); filed back if useful.
- **An overview / synthesis page** — top-level perspective that pulls threads together.

Plus two infrastructure files:

- `index.md` — content-oriented catalog of every wiki page with a one-line summary, organised by category.
- `log.md` — chronological append-only record of ingests, queries, lints, and Brain syncs, in the format `## [YYYY-MM-DD] <op> | <subject>`.

## Operations

### Ingest

Triggered when the user runs `setup_brain` (initial compile) or `sync_vault` (incremental update).

For each raw source the LLM:

1. Reads the source.
2. Updates or creates relevant entity / concept pages.
3. Writes a source-summary page that links back to the raw file.
4. Updates `index.md`.
5. Appends an entry to `log.md`.

A single source typically touches 5-15 wiki pages. Cross-references are first-class — every claim in a wiki page should link to its source summary or to other wiki pages.

### Query

Triggered when another agent calls `query_brain` (over AXL or HTTP). The brain handler:

1. Resolves the target Brain's storage root from ENS.
2. Fetches the snapshot manifest from 0G Storage.
3. Top-K retrieves wiki pages relevant to the prompt (currently lexical overlap; embeddings v2).
4. Sends the retrieved pages + a system prompt derived from the Brain's `specialty` text record to 0G Compute (TEE-attested Qwen 2.5 7B).
5. Returns the cited answer.

Critically: the query reads the **wiki**, not the raw sources. The synthesis was done at ingest time. This is the difference from RAG — see [`docs/architecture.md`](architecture.md) §"Royalty splits" for the on-chain settlement that follows.

### Lint

Triggered manually (or scheduled) by the Brain owner. Claude looks for:

- Contradictions between wiki pages
- Stale claims that newer raw sources have superseded
- Orphan wiki pages with no inbound links
- Important entities mentioned but lacking their own page
- Missing cross-references
- Data gaps that would benefit from new raw sources

Lint output is a list of suggested edits + new questions to investigate. The Brain owner approves; Claude executes; `log.md` records the lint pass.

## Conventions

### Frontmatter

Every wiki page has YAML frontmatter:

```yaml
---
title: <Page title>
tags: [<page-type>, <topic-tags>]
created: <YYYY-MM-DD>
sources: [<source-summary-slug-1>, ...]
---
```

`tags[0]` is always one of: `entity`, `concept`, `source`, `comparison`, `overview`, `infrastructure` (for index/log).

### Wikilinks

Use `[[slug]]` or `[[slug|display text]]`. Slugs are the lower-case, kebab-case form of the page title (`the-llm-wiki-pattern`, not `The LLM Wiki Pattern.md`). The `obsidian-parser` package converts these into the article links field of the snapshot manifest.

### Citations

Inside a wiki page, cite raw sources by linking the source-summary page (which itself links the raw file): `According to [[source-summary-llm-wiki-gist]], ...`. Don't link raw files directly from non-summary pages — keep the indirection so changes to a raw file's location don't break wiki links.

### Specialisation

Each Brain has a `brain.specialty` ENS text record (e.g. `defi-yield-strategies`, `agentic-web-knowledge`). The system prompt at [query](#query) time tells the LLM "you are a Brain specialised in <specialty>, answer only from the provided context, cite slugs". Compilation should *also* be specialty-aware: if a vault contains notes on cooking and DeFi but the Brain's specialty is DeFi, the cooking notes get filed but de-emphasised.

## Why this discipline matters

Without a schema, every user's Brain ends up with a different shape — different page types, different cross-reference conventions, different metadata. That makes the network non-composable. With this schema, any agent calling any Brain knows what kind of structure to expect. Citations always point at slugs. The mixture-of-Brains synthesiser can compare answers across Brains because the answers are shaped consistently.

The other reason: the wiki is **the asset being monetised**. A messy wiki is a low-quality asset. The schema is what makes a Brain a credible product, not a chatbot wrapper around a vault dump.

## Reference Brain

`scripts/demo/karpathy-vault/` is the canonical example of this pattern: 16 cross-linked wiki pages compiled from Karpathy's LLM-Wiki gist, demonstrating the page types, frontmatter conventions, wikilink graph, and the index+log infrastructure. Mint a Brain from it via:

```bash
bun run scripts/setup/seed-from-vault.ts \
  --vault scripts/demo/karpathy-vault \
  --label karpathy \
  --specialty llm-wiki-pattern
```

Browse it at https://brainpedia.up.railway.app/karpathy once seeded. That's what a "good" compiled Brain looks like.

## Original source

Karpathy's gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

He explicitly invites readers to "share it with your LLM agent and work together to instantiate a version that fits your needs." Brainpedia's instantiation is this schema plus the on-chain monetisation layer (iNFTs, ENS subnames, AXL, RoyaltyDistributor) that turns the resulting wiki into a tradeable asset.
