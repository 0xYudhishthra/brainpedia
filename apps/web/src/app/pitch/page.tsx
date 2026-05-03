import Link from 'next/link';

export const dynamic = 'force-static';
export const revalidate = 0;

export const metadata = {
  title: 'Brainpedia · Pitch',
  description:
    'Brainpedia is the supply side of the agent economy. Compiled human expertise as iNFTs, queried by agents, paid on chain.',
};

export default function PitchPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
          ETHGlobal Open Agents · brainpedia.up.railway.app
        </p>
        <h1 className="font-mono text-4xl font-medium tracking-tight md:text-5xl">brainpedia</h1>
        <p className="text-balance text-xl text-[var(--muted)]">
          Compiled human expertise as iNFTs. Queried by agents. Paid on chain.
        </p>
      </header>

      <Section eyebrow="The problem" title="The agent economy is short on supply.">
        <p>
          Every AI agent today buys its knowledge from one of three corporate APIs (OpenAI,
          Anthropic, Google). There is no marketplace where humans can sell the specialty
          knowledge they have already organised in their notes, no way to compose multiple
          specialists together without renting from Big AI, and no way for an agent to
          verify it is actually paying the human whose expertise it is using.
        </p>
      </Section>

      <Section eyebrow="The solution" title="Turn your Obsidian vault into a paid AI Brain.">
        <p>
          Each Brain is an ERC-7857 iNFT minted from your Obsidian vault. Notes get compiled
          into wiki articles by Claude in-context, uploaded to 0G Storage as a merkle-rooted
          snapshot, and the iNFT carries the root. You set a per-query price in OG. Other
          agents discover you via ENS subnames (<code className="font-mono">yourname.bpedia.eth</code>),
          authenticate via TTL ENS-subname access tokens, route queries over Gensyn AXL, and
          pay you directly through <code className="font-mono">RoyaltyDistributor</code> in a
          single tx.
        </p>
      </Section>

      <Section eyebrow="What inspired it" title="Karpathy's LLM-Wiki gist.">
        <p>
          Andrej Karpathy proposed a three-layer pattern (raw sources, compiled wiki,
          schema) for turning a personal note vault into something an LLM can navigate
          coherently. Brainpedia operationalises that pattern: every Brain follows the same
          schema, so any agent calling any Brain knows what shape to expect, citations
          always point at slugs, and the Mixture-of-Brains synthesiser can compare answers
          across Brains because their structure is consistent.
        </p>
      </Section>

      <Section eyebrow="How it works" title="Five primitives, one flow.">
        <ol className="ml-5 list-decimal space-y-3">
          <li>
            <strong>Mint</strong>. <code className="font-mono">BrainMinter.mintToSender</code>{' '}
            (permissionless wrapper around <code className="font-mono">Brain.sol</code>)
            mints your iNFT on 0G Galileo. Storage root binds to the merkle root of your
            compiled article snapshot on 0G Storage.
          </li>
          <li>
            <strong>Identify</strong>.{' '}
            <code className="font-mono">SubnameRegistrar.register</code> mints{' '}
            <code className="font-mono">yourname.bpedia.eth</code> on Sepolia ENS and writes
            8 <code className="font-mono">brain.*</code> text records (iNFT ref, storage
            root, AXL peer id, specialty, price/query, compute provider URL, etc.).
          </li>
          <li>
            <strong>Discover</strong>. Agents resolve{' '}
            <code className="font-mono">all.discover.bpedia.eth</code> (or a narrower topic
            shortcut like <code className="font-mono">research.discover</code>) to find
            relevant Brains. The orchestrator's LLM router can pick the right shortcut from
            a free-form prompt.
          </li>
          <li>
            <strong>Pay-to-read</strong>. The mixture endpoint fans out, computes a payment
            plan (each Brain gets exactly its <code className="font-mono">brain.price_query</code>),
            and returns a redacted preview. The synthesised answer is gated server-side
            until the agent calls{' '}
            <code className="font-mono">RoyaltyDistributor.distribute</code> on chain. The
            web service verifies the on-chain Distributed events match the cached plan, then
            releases the synthesis.
          </li>
          <li>
            <strong>Settle</strong>. Each Brain owner receives their share directly from the
            contract. Citation-tracked but sticker-priced (no reweighting), so each owner
            gets exactly what they advertised.
          </li>
        </ol>
      </Section>

      <Section eyebrow="The tech" title="Every layer is on chain.">
        <ul className="grid gap-3 md:grid-cols-2">
          <Tile
            label="0G"
            body="Brain.sol (ERC-7857 iNFT), BrainMinter (permissionless self-mint), RoyaltyDistributor (single-tx multi-Brain settlement). 0G Storage as KV + Log layers. 0G Compute via the official broker SDK (Qwen 2.5 7B, TEE-attested) for brain inference, the LLM topic router, and the multi-brain synthesis fusion."
          />
          <Tile
            label="ENS"
            body="Two custom registrars on Sepolia: SubnameRegistrar issues yourname.bpedia.eth and writes brain.* text records; AccessTokenRegistrar issues TTL-bounded agent<hash>.client.bpedia.eth subnames as on-chain capability tokens. The Brain validates by resolving the subname and calling isValid(label, agent)."
          />
          <Tile
            label="Gensyn AXL"
            body="Each Brain runs its own Yggdrasil daemon with its own Ed25519 peer id, registered with a local mcp_router. Cross-Brain calls are POST /mcp/{peer_id}/brainpedia.brain over real P2P. The 4-node Python demo (scripts/demo/axl_demo.py) proves separate-node communication, not in-process queueing."
          />
          <Tile
            label="MCP"
            body="brainpedia-mcp on npm. 7 stdio tools: setup_brain, upload_articles, finalize_brain, sync_vault, query_brain, query_mixture, settle_mixture. Drops into Claude Code via one claude mcp add-json command. Setup_brain bundles the Brainpedia compile schema so Claude follows it on every call instead of hallucinating a structure."
          />
        </ul>
      </Section>

      <Section eyebrow="Challenges we solved" title="The non-obvious bits.">
        <ul className="space-y-3">
          <li>
            <strong>0G Storage Flow.submit ABI mismatch</strong>. The official SDK encodes
            selector <code className="font-mono">0xef3e12dc</code> but the deployed Flow
            contract expects <code className="font-mono">0xbc8c11f8</code> for the 2-field
            outer{' '}
            <code className="font-mono">Submission &#123; SubmissionData data; address submitter; &#125;</code>{' '}
            tuple. We hand-rolled <code className="font-mono">Flow.submit</code> via viem
            with the correct shape and reused the SDK's MemData for the merkle tree.
          </li>
          <li>
            <strong>Submit event txSeq decode</strong>. The deployed Flow's Submit event has
            only 3 indexed topics; <code className="font-mono">submissionIndex</code> lives
            in <code className="font-mono">data[0:32]</code>, not{' '}
            <code className="font-mono">topics[3]</code>. The first version of the seed
            script silently produced <code className="font-mono">txSeq=undefined</code> and
            skipped the segment push.
          </li>
          <li>
            <strong>Permissionless mint without redeploy</strong>.{' '}
            <code className="font-mono">Brain.sol</code> originally had{' '}
            <code className="font-mono">onlyOwner</code> on mint, which would have blocked
            teammate self-onboarding. We deployed{' '}
            <code className="font-mono">BrainMinter</code>, a wrapper that owns Brain.sol
            via <code className="font-mono">transferOwnership</code> and exposes{' '}
            <code className="font-mono">mintToSender</code>. Existing tokenIds remained
            valid; new tokens are minted to the caller.
          </li>
          <li>
            <strong>Multi-tenant brain runtime</strong>. One{' '}
            <code className="font-mono">apps/brain</code> process serves any tokenId
            registered under the parent. Each query passes a <code className="font-mono">target</code>{' '}
            ENS name; the handler resolves <code className="font-mono">brain.storage_root</code>{' '}
            and <code className="font-mono">brain.specialty</code> at query time.
          </li>
          <li>
            <strong>Pay-to-read gate, not just pay-after-read</strong>. The mixture endpoint
            is two-phase: phase 1 caches the full result and returns a redacted preview;
            phase 2 verifies the on-chain Distributed events match the cached plan before
            releasing the synthesis. The synthesis itself is a separate TEE-attested 0G
            Compute call that fuses per-brain answers into one coherent response.
          </li>
        </ul>
      </Section>

      <Section eyebrow="Live on chain" title="Verifiable by anyone.">
        <ul className="space-y-2 text-sm">
          <Proof
            href="https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F"
            label="Brain.sol (ERC-7857 iNFT) on 0G Galileo"
            detail="7 Brain iNFTs minted across two cohorts"
          />
          <Proof
            href="https://chainscan-galileo.0g.ai/address/0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7"
            label="BrainMinter on 0G Galileo"
            detail="Permissionless mintToSender wrapper"
          />
          <Proof
            href="https://chainscan-galileo.0g.ai/address/0x44eaad4fdb7d509cd3fe7624ce512cc97b910649"
            label="RoyaltyDistributor on 0G Galileo"
            detail="Single-tx multi-Brain settlement"
          />
          <Proof
            href="https://chainscan-galileo.0g.ai/tx/0x9637800e6f7b644ac71cf4900bb272f908628d1bd7f0590a9912a183de56bb0e"
            label="Settlement proof tx"
            detail="2 brains paid in one call, two Distributed events emitted"
          />
          <Proof
            href="https://sepolia.app.ens.domains/bpedia.eth"
            label="bpedia.eth parent name on Sepolia ENS"
            detail="Owns subname + access-token registrars"
          />
          <Proof
            href="https://sepolia.app.ens.domains/yudhi.bpedia.eth"
            label="yudhi.bpedia.eth (sample Brain)"
            detail="All 8 brain.* text records resolve live"
          />
          <Proof
            href="https://sepolia.app.ens.domains/all.discover.bpedia.eth"
            label="all.discover.bpedia.eth"
            detail="Discovery shortcut → 2 brains (homepage graph reads this)"
          />
          <Proof
            href="https://www.npmjs.com/package/brainpedia-mcp"
            label="brainpedia-mcp on npm"
            detail="7 stdio tools, single bundled binary, drops into Claude Code"
          />
        </ul>
      </Section>

      <Section eyebrow="Judging criteria" title="How Brainpedia stacks up.">
        <ul className="space-y-3">
          <Criterion title="Technicality">
            Five custom Solidity 0.8.26 contracts (ERC-7857 iNFT, permissionless mint
            wrapper, multi-Brain settlement, two ENS registrars), a TypeScript monorepo
            (Bun + Turborepo) with 14 workspace packages all typechecking, a hand-rolled
            Flow.submit ABI workaround for 0G Storage, a two-phase pay-gated mixture API
            with on-chain event verification, and a TEE-attested synthesis fusion call
            running on 0G Compute. Every claim verifiable from the github.
          </Criterion>
          <Criterion title="Originality">
            Subnames-as-access-tokens is the angle. Instead of API keys + a centralised
            auth service, the Brain validates an ENS subname{' '}
            <code className="font-mono">agent&lt;hash&gt;.client.bpedia.eth</code> by
            resolving and calling <code className="font-mono">isValid(label, agent)</code>{' '}
            on the registrar contract. A capability token IS a first-class on-chain
            identity. To our knowledge nobody else uses ENS this way.
          </Criterion>
          <Criterion title="Practicality">
            Live and reachable today. 7 iNFTs minted, royalty splits proven on chain, MCP
            server installable in Claude Code with one command. Onboarding a teammate from
            zero to their own Brain takes about 5 minutes (compile schema bundled in the
            tool response means Claude does not drift). The hosted Obsidian on Railway
            means judges can mint a Brain without a local Obsidian install.
          </Criterion>
          <Criterion title="Usability">
            Two surfaces, both human-friendly. The web UI shows the network graph live from
            ENS and surfaces every settlement step (router decision, payment plan, gated
            synthesis, unlock). The MCP surface is a 7-tool flow that any Claude Code user
            can drive in plain English. The pay-gate is real but human-in-the-loop: Claude
            shows the price, the user confirms, the wallet signs.
          </Criterion>
          <Criterion title="WOW factor">
            Watch the agent be told it cannot read the answer until it pays each
            contributing human, then watch it actually pay them on chain and re-fetch the
            unlocked synthesis. The whole loop is verifiable: the iNFT storage root
            resolves to real article bytes, the TEE attestation signature checks, the
            Distributed events on chainscan match the cached payment plan. No corporate
            API in the loop.
          </Criterion>
        </ul>
      </Section>

      <Section eyebrow="Try it" title="Two paths.">
        <div className="flex flex-col gap-2 text-sm">
          <p>
            <strong>As an agent</strong>: install the MCP server in Claude Code with{' '}
            <code className="font-mono">claude mcp add-json brainpedia '&#123;...&#125;' --scope user</code>,
            then ask <em>&quot;use query_mixture to ask…&quot;</em>. Claude will surface the
            payment plan, you confirm, settlement happens via{' '}
            <code className="font-mono">settle_mixture</code>, synthesis returns with a
            chainscan link.
          </p>
          <p>
            <strong>As a Brain owner</strong>: install the same MCP, point it at your
            Obsidian vault (filesystem path or via the Local REST API plugin), say{' '}
            <em>&quot;set up my Brain.&quot;</em> Claude reads the vault, compiles wiki
            articles per the schema, uploads to 0G Storage, mints the iNFT, registers your
            ENS subname, writes 8 text records. Five minutes end-to-end.
          </p>
        </div>
      </Section>

      <footer className="flex flex-col gap-2 border-t border-current/10 pt-6 text-xs text-[var(--muted)]">
        <p>
          <Link className="underline underline-offset-4" href="/">
            ← back to brainpedia.up.railway.app
          </Link>{' '}
          ·{' '}
          <a
            className="underline underline-offset-4"
            href="https://github.com/0xYudhishthra/brainpedia"
          >
            github
          </a>{' '}
          ·{' '}
          <a
            className="underline underline-offset-4"
            href="https://www.npmjs.com/package/brainpedia-mcp"
          >
            npm/brainpedia-mcp
          </a>
        </p>
        <p>
          Built for ETHGlobal Open Agents · 0G · ENS · Gensyn AXL · Team:{' '}
          <a className="underline underline-offset-4" href="https://x.com/0xYudhishthra">
            X @0xYudhishthra
          </a>{' '}
          · Telegram <code className="font-mono">yudhishthra</code>
        </p>
      </footer>
    </main>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{title}</h2>
      <div className="max-w-prose text-base leading-relaxed text-[var(--muted)]">
        {children}
      </div>
    </section>
  );
}

function Tile({ label, body }: { label: string; body: string }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-current/10 p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg)]">{label}</p>
      <p className="text-sm leading-relaxed">{body}</p>
    </li>
  );
}

function Proof({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex flex-col gap-1 rounded border border-current/10 p-3">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs underline-offset-4 hover:underline"
      >
        {label} ↗
      </a>
      <p className="text-xs text-[var(--muted)]">{detail}</p>
    </li>
  );
}

function Criterion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-current/10 p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg)]">{title}</p>
      <p className="text-sm leading-relaxed text-[var(--muted)]">{children}</p>
    </li>
  );
}
