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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 py-16">
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
          pay you directly through <code className="font-mono">RoyaltyDistributor</code> in
          one tx.
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

      <Section eyebrow="How it works" title="Two flows. One protocol.">
        <FlowDiagram />
        <p className="mt-4 max-w-prose">
          The mint flow runs once per Brain owner. The query flow runs every time an agent
          asks the network a question. The pay-gate is the load-bearing primitive: the
          synthesis is cached server-side at fan-out time but never served until the
          on-chain Distributed events match the cached payment plan.
        </p>
      </Section>

      <Section eyebrow="The tech" title="Every layer is on chain.">
        <TechDiagram />
      </Section>

      <Section eyebrow="Live on chain" title="Verifiable by anyone.">
        <ul className="grid gap-2 md:grid-cols-2">
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
            detail="2 brains paid in one call, 2 Distributed events emitted"
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

      <Section eyebrow="Try it" title="Two paths.">
        <div className="flex flex-col gap-2 text-sm">
          <p>
            <strong>As an agent</strong>: install the MCP server in Claude Code with{' '}
            <code className="font-mono">claude mcp add-json brainpedia '&#123;...&#125;' --scope user</code>,
            then ask <em>&quot;use query_mixture to ask…&quot;</em>. Claude surfaces the
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
      <div className="text-base leading-relaxed text-[var(--muted)]">{children}</div>
    </section>
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

/* -------------------------------------------------------------------------
 * Diagrams (inline SVG, theme-aware via currentColor + CSS vars)
 * ------------------------------------------------------------------------- */

function FlowDiagram() {
  return (
    <div className="flex flex-col gap-8 rounded-xl border border-current/10 bg-black/[0.02] p-6 dark:bg-white/[0.02]">
      {/* Mint flow */}
      <FlowRow
        label="Mint flow · runs once per Brain owner"
        steps={[
          { title: 'Obsidian vault', sub: 'your notes' },
          { title: 'setup_brain', sub: 'reads vault, returns graph + compile schema' },
          { title: 'Claude compiles', sub: 'wiki articles per schema, in-context' },
          { title: 'upload_articles', sub: '→ 0G Storage merkle root' },
          { title: 'finalize_brain', sub: 'BrainMinter mint + ENS subname + brain.* records' },
        ]}
        accent="emerald"
      />
      {/* Query flow */}
      <FlowRow
        label="Query flow · pay-to-read, runs per agent question"
        steps={[
          { title: 'Agent asks', sub: 'free-form prompt' },
          { title: 'query_mixture', sub: 'LLM router picks discovery shortcut' },
          { title: 'Fan out', sub: 'parallel calls to N Brains over AXL' },
          { title: 'Plan returned', sub: 'sessionId + per-brain price (no answer)', gate: true },
          { title: 'settle_mixture', sub: 'RoyaltyDistributor.distribute(...)' },
          { title: 'Synthesis unlocked', sub: 'TEE-attested fusion of all answers' },
        ]}
        accent="amber"
      />
    </div>
  );
}

function FlowRow({
  label,
  steps,
  accent,
}: {
  label: string;
  steps: Array<{ title: string; sub: string; gate?: boolean }>;
  accent: 'emerald' | 'amber';
}) {
  const accentClass =
    accent === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-amber-700 dark:text-amber-400';
  return (
    <div className="flex flex-col gap-3">
      <p className={`font-mono text-[10px] uppercase tracking-widest ${accentClass}`}>
        {label}
      </p>
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch">
        {steps.map((step, i) => (
          <FlowStep key={step.title} step={step} isLast={i === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}

function FlowStep({
  step,
  isLast,
}: {
  step: { title: string; sub: string; gate?: boolean };
  isLast: boolean;
}) {
  return (
    <>
      <div
        className={`flex min-w-[140px] flex-1 flex-col gap-1 rounded-lg border p-3 ${
          step.gate
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-current/15 bg-black/[0.02] dark:bg-white/[0.02]'
        }`}
      >
        <p className="text-sm font-medium">
          {step.gate ? <span className="mr-1">🔒</span> : null}
          {step.title}
        </p>
        <p className="text-[11px] leading-snug text-[var(--muted)]">{step.sub}</p>
      </div>
      {!isLast && (
        <div className="flex items-center justify-center text-[var(--muted)] md:px-1">
          <span className="font-mono text-xs md:hidden">↓</span>
          <span className="hidden font-mono text-xs md:inline">→</span>
        </div>
      )}
    </>
  );
}

function TechDiagram() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-current/10 bg-black/[0.02] p-6 dark:bg-white/[0.02]">
      {/* Layer 1: agents */}
      <TechLayer
        label="Agents"
        cards={[
          {
            tag: 'Claude Code',
            body:
              'Hosts the brainpedia-mcp server. 7 stdio tools cover the full flow: setup_brain, upload_articles, finalize_brain, sync_vault, query_brain, query_mixture, settle_mixture.',
          },
        ]}
      />
      <DownArrow />
      {/* Layer 2: orchestrator + brain runtimes */}
      <TechLayer
        label="Orchestration"
        cards={[
          {
            tag: 'Web /api/query',
            body:
              'Two-phase mixture endpoint. LLM topic router (TEE-attested) picks the discovery shortcut from a free-form prompt, fans out, caches the synthesis, gates it behind on-chain settlement.',
          },
          {
            tag: 'Brain runtimes',
            body:
              'One process per Brain (or multi-tenant). Validates ENS access tokens, fetches storage_root snapshot, runs top-K retrieval + 0G Compute inference (TEE-attested Qwen 2.5 7B).',
          },
        ]}
      />
      <DownArrow label="AXL P2P" />
      {/* Layer 3: substrates */}
      <TechLayer
        label="Substrates · all on chain"
        cards={[
          {
            tag: '0G',
            body:
              'Brain.sol (ERC-7857 iNFT), BrainMinter (permissionless self-mint), RoyaltyDistributor (single-tx multi-Brain settlement). 0G Storage for snapshots. 0G Compute for inference + router + synthesis.',
          },
          {
            tag: 'ENS',
            body:
              'SubnameRegistrar issues yourname.bpedia.eth + 8 brain.* text records. AccessTokenRegistrar issues TTL-bounded agent<hash>.client.bpedia.eth as on-chain capability tokens.',
          },
          {
            tag: 'Gensyn AXL',
            body:
              'Yggdrasil mesh between Brain runtimes and the orchestrator. Each Brain has its own Ed25519 peer id. Persistent bootstrap peer running on Railway.',
          },
        ]}
      />
    </div>
  );
}

function TechLayer({
  label,
  cards,
}: {
  label: string;
  cards: Array<{ tag: string; body: string }>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
        {label}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={card.tag + i}
            className={`flex flex-col gap-1 rounded-lg border border-current/15 bg-black/[0.02] p-3 dark:bg-white/[0.02] ${
              cards.length === 1 ? 'md:col-span-3' : ''
            } ${cards.length === 2 ? (i === 0 ? 'md:col-span-2' : 'md:col-span-1') : ''}`}
          >
            <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--fg)]">
              {card.tag}
            </p>
            <p className="text-xs leading-snug text-[var(--muted)]">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DownArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[var(--muted)]">
      <span className="font-mono text-base">↓</span>
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      )}
      <span className="font-mono text-base">↓</span>
    </div>
  );
}
