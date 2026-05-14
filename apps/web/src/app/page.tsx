import Link from 'next/link';
import {
  loadEnsConfig,
  createEnsPublicClient,
  listBrainsForTopic,
} from '@brainpedia/ens';
import {
  NetworkViz,
  type NetworkNode,
  type NetworkLink,
} from '@/components/network-viz';
import { MixtureDemo } from '@/components/mixture-demo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const HOMEPAGE_DISCOVERY_TOPIC = 'all';

const BRAIN_ADDRESS = '0x4E5c6DC869F9B3220F01de9047031cEd1577b08F';
const ORACLE_ADDRESS = '0x923A0b7f21c57d92BFa8AA6721b574f47Fe5C5C0';
const MINTER_ADDRESS = '0x3e7D22150d6b883a89703d760d66743D2223456b';
const ROYALTY_ADDRESS = '0x7F26DeDe0c5E1Db844c9A8138C21cA3439B63C49';
const MIXTURE_PROOF_TX =
  '0x77202942ca382179c8a825eb48c0434a60dff3a273172ca11a25d8d6cbdb1341';
const OG_EXPERT_MINT_TX =
  '0x70618c4a4620bfb7397bd7cd6b177a69ae7586ddbb4ea0e00bde7d164c7e56d7';
const EXPLORER = 'https://chainscan.0g.ai';

interface GraphData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  brainNames: string[];
}

async function loadGraph(): Promise<GraphData> {
  const baseNodes: NetworkNode[] = [
    { id: 'agent', label: 'querying agent', kind: 'agent', active: 0.8 },
    { id: 'orch', label: 'orchestrator', kind: 'orchestrator', active: 0.7 },
  ];
  const baseLinks: NetworkLink[] = [
    { source: 'agent', target: 'orch', kind: 'request', active: 0.8 },
  ];

  if (
    !process.env.ENS_PARENT_NAME ||
    !process.env.ENS_RPC_URL ||
    !process.env.ENS_SUBNAME_REGISTRAR_ADDRESS ||
    !process.env.ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS
  ) {
    return { nodes: baseNodes, links: baseLinks, brainNames: [] };
  }

  let brainNames: string[] = [];
  try {
    const cfg = loadEnsConfig();
    const client = createEnsPublicClient(cfg);
    brainNames = await listBrainsForTopic(
      { publicClient: client, config: cfg },
      HOMEPAGE_DISCOVERY_TOPIC,
    );
  } catch {
    brainNames = [];
  }

  const brainNodes: NetworkNode[] = brainNames.map((ensName) => ({
    id: ensName,
    label: ensName,
    kind: 'brain',
    active: 0.55,
  }));

  const brainLinks: NetworkLink[] = brainNames.flatMap((ensName) => [
    { source: 'orch', target: ensName, kind: 'request', active: 0.6 },
    { source: ensName, target: 'orch', kind: 'response', active: 0.5 },
  ]);

  return {
    nodes: [...baseNodes, ...brainNodes],
    links: [...baseLinks, ...brainLinks],
    brainNames,
  };
}

export default async function HomePage() {
  const { nodes, links, brainNames } = await loadGraph();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-24 px-6 py-20">
      {/* HERO */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill pill-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-hover)]" />
            live on 0G mainnet
          </span>
          <a
            href="https://ethglobal.com/showcase/brainpedia-ctx9g"
            target="_blank"
            rel="noreferrer"
            className="pill hover:border-[var(--hairline-strong)]"
          >
            winner: ETHGlobal Open Agents
          </a>
          <span className="pill">0G best autonomous agents + iNFT</span>
          <span className="pill">ENS for AI agents (2nd place)</span>
        </div>

        <h1 className="text-display-xl text-[var(--ink)]">brainpedia.</h1>
        <p className="max-w-2xl text-balance text-xl text-[var(--ink-muted)]">
          A network where any human turns any folder of knowledge into a paid
          AI agent on 0G. Markdown, PDF, Word, plain text. Other agents
          discover, query, and pay royalties on chain.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/create" className="btn-primary">
            mint a brain
          </Link>
          <a
            href="https://www.npmjs.com/package/brainpedia-mcp"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            install the MCP server
          </a>
          <a
            href={`${EXPLORER}/tx/${MIXTURE_PROOF_TX}`}
            target="_blank"
            rel="noreferrer"
            className="btn-tertiary"
          >
            view hero settlement tx
          </a>
        </div>
      </header>

      {/* PRIZE STRIP (collapsible context) */}
      <section className="flex flex-col gap-4">
        <h2 className="text-eyebrow text-[var(--ink-subtle)]">already validated</h2>
        <div className="surface-1 rounded-xl p-6">
          <p className="text-[var(--ink-muted)]">
            Brainpedia won 0G&apos;s <strong className="text-[var(--ink)]">Best Autonomous Agents, Swarms &amp; iNFT Innovations</strong> prize and ENS&apos;s
            {' '}
            <strong className="text-[var(--ink)]">Best ENS Integration for AI Agents (2nd place)</strong> at ETHGlobal Open Agents.
            0G itself{' '}
            <a
              className="text-[var(--accent-hover)] hover:underline"
              href="https://x.com/0G_labs/status/2052362392026108335"
              target="_blank"
              rel="noreferrer"
            >
              tweeted the win
            </a>
            . This submission rebuilds the project on 0G mainnet with multi-format
            ingest, a web-native mint flow, and a Karpathy-style knowledge framework.
          </p>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="flex flex-col gap-6">
        <h2 className="text-eyebrow text-[var(--ink-subtle)]">what it is</h2>
        <h3 className="text-display-md text-[var(--ink)]">
          The supply side of the agent economy.
        </h3>
        <p className="max-w-3xl text-lg text-[var(--ink-muted)]">
          Agents have no legitimate way to buy specialty knowledge. APIs are
          centralized and the human expert sees nothing. Brainpedia turns any
          human knowledge artifact (notes, papers, case files) into an
          ERC-7857 iNFT on 0G that other agents pay to query. Mixture-of-Brains
          settles royalties to multiple Brain owners in a single on-chain tx.
        </p>
      </section>

      {/* TWO PATHS */}
      <section className="flex flex-col gap-6">
        <h2 className="text-eyebrow text-[var(--ink-subtle)]">two ways to mint</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-1 rounded-xl p-6">
            <div className="text-card-title text-[var(--ink)]">web</div>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Drop a folder. We extract markdown, PDF, Word, and plain text,
              compile into a Karpathy-style wiki, upload to 0G Storage, and
              your wallet signs the mint. No CLI.
            </p>
            <Link href="/create" className="btn-primary mt-4 inline-block">
              open /create
            </Link>
          </div>
          <div className="surface-1 rounded-xl p-6">
            <div className="text-card-title text-[var(--ink)]">claude code</div>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              The MCP server reads your vault, lets Claude compile pages, and
              mints the iNFT from your wallet. Power-user path for live wikis
              that update with every Obsidian save.
            </p>
            <a
              href="https://www.npmjs.com/package/brainpedia-mcp"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary mt-4 inline-block"
            >
              brainpedia-mcp on npm
            </a>
          </div>
        </div>
      </section>

      {/* NETWORK */}
      <section className="flex flex-col gap-6">
        <h2 className="text-eyebrow text-[var(--ink-subtle)]">mixture-of-brains</h2>
        <div className="surface-1 overflow-hidden rounded-xl p-3">
          <NetworkViz nodes={nodes} links={links} />
        </div>
        <p className="text-sm text-[var(--ink-subtle)]">
          {brainNames.length > 0 ? (
            <>
              Live from Sepolia ENS. {brainNames.length} brain
              {brainNames.length === 1 ? '' : 's'} listed under{' '}
              <code className="text-[var(--ink-muted)]">
                {HOMEPAGE_DISCOVERY_TOPIC}.discover.bpedia.eth
              </code>
              . Agent fans out to specialty Brains, each runs TEE-attested
              inference on 0G Compute, and the orchestrator settles royalties
              in one tx.
            </>
          ) : (
            <>
              No brains registered yet under{' '}
              <code className="text-[var(--ink-muted)]">
                {HOMEPAGE_DISCOVERY_TOPIC}.discover.bpedia.eth
              </code>
              . A Brain ENS name added to that shortcut&apos;s text records shows
              up here automatically.
            </>
          )}
        </p>
      </section>

      <MixtureDemo />

      {/* 0G INTEGRATION DEPTH */}
      <section className="flex flex-col gap-6">
        <h2 className="text-eyebrow text-[var(--ink-subtle)]">0G integration depth</h2>
        <p className="max-w-3xl text-lg text-[var(--ink-muted)]">
          Brainpedia uses 5 of 5 0G components on mainnet. Every Brain creation,
          query, and settlement is verifiable on chainscan.0g.ai.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <IntegrationCard
            label="0G Storage"
            detail="KV layer for live wiki edits. Log layer for immutable merkle-rooted snapshots that the iNFT carries."
          />
          <IntegrationCard
            label="0G Compute"
            detail="Per-query inference on TEE-attested Qwen 2.5 7B via broker.ledger metering. Mixture-of-Brains synthesis runs here too."
          />
          <IntegrationCard
            label="0G Chain (Aristotle, 16661)"
            detail="All iNFT custody, royalty distribution, and mint wrappers live on mainnet. 4 verified contracts."
          />
          <IntegrationCard
            label="Agent ID (ERC-7857 iNFT)"
            detail="Encrypted private manifest sealed for owner. Oracle-attested transfers via BrainOracle. Append-only intelligence lineage."
          />
          <IntegrationCard
            label="Privacy + TEE attestation"
            detail="Every inference response carries verified=true from the TEE attestor. Same attestor key gates ownership transfer."
          />
        </div>
      </section>

      {/* ON-CHAIN PROOF */}
      <section className="flex flex-col gap-6">
        <h2 className="text-eyebrow text-[var(--ink-subtle)]">live on 0G mainnet</h2>
        <div className="surface-1 grid grid-cols-1 divide-y divide-[var(--hairline)] rounded-xl text-sm md:grid-cols-2 md:divide-x md:divide-y-0">
          <ProofRow label="Brain.sol" address={BRAIN_ADDRESS} />
          <ProofRow label="BrainOracle" address={ORACLE_ADDRESS} />
          <ProofRow label="BrainMinter" address={MINTER_ADDRESS} />
          <ProofRow label="RoyaltyDistributor" address={ROYALTY_ADDRESS} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <a
            href={`${EXPLORER}/tx/${OG_EXPERT_MINT_TX}`}
            target="_blank"
            rel="noreferrer"
            className="surface-1 group flex flex-col gap-1 rounded-xl p-5 transition-colors hover:border-[var(--hairline-strong)]"
          >
            <span className="text-eyebrow text-[var(--ink-subtle)]">0G Expert Brain</span>
            <span className="text-card-title text-[var(--ink)]">
              Brainpedia is hosting 0G&apos;s knowledge on 0G itself
            </span>
            <span className="text-xs text-[var(--ink-subtle)] group-hover:text-[var(--ink-muted)]">
              tokenId 3 · 428 articles compiled from{' '}
              <code className="font-mono">docs.0g.ai/llms-full.txt</code> · 0.001 OG/query ·{' '}
              <span className="font-mono">{OG_EXPERT_MINT_TX.slice(0, 14)}…</span>
            </span>
          </a>
          <a
            href={`${EXPLORER}/tx/${MIXTURE_PROOF_TX}`}
            target="_blank"
            rel="noreferrer"
            className="surface-1 group flex flex-col gap-1 rounded-xl p-5 transition-colors hover:border-[var(--hairline-strong)]"
          >
            <span className="text-eyebrow text-[var(--ink-subtle)]">hero settlement tx</span>
            <span className="text-card-title text-[var(--ink)]">
              3 brains paid in one transaction
            </span>
            <span className="text-xs text-[var(--ink-subtle)] group-hover:text-[var(--ink-muted)]">
              RoyaltyDistributor.distribute([1, 2, 3], [0.002, 0.0015, 0.0035], reason) · 3 Distributed events ·{' '}
              <span className="font-mono">{MIXTURE_PROOF_TX.slice(0, 14)}…</span>
            </span>
          </a>
        </div>
      </section>

      {/* EXPLORE */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DemoLink href="/yudhi" label="sample brain" detail="yudhi.bpedia.eth · live wiki" />
        <DemoLink href="/status" label="live status" detail="7 read-only checks against on-chain state" />
        <DemoLink href="/create" label="/create" detail="drag a folder · mint from any wallet" />
        <DemoLink
          external
          href="https://github.com/0xYudhishthra/brainpedia"
          label="github"
          detail="apps · packages · contracts · docs"
        />
        <DemoLink
          external
          href="https://sepolia.app.ens.domains/bpedia.eth"
          label="bpedia.eth on ENS"
          detail="discovery layer on Sepolia"
        />
        <DemoLink
          external
          href={`${EXPLORER}/address/${MINTER_ADDRESS}`}
          label="brain minter"
          detail="permissionless self-mint on 0G mainnet"
        />
      </section>

      <footer className="border-t border-[var(--hairline)] pt-6 text-xs text-[var(--ink-subtle)]">
        <p>
          0G Aristotle (chainId 16661) · ENS Sepolia · AXL P2P ·{' '}
          <a
            className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
            href="https://github.com/0xYudhishthra/brainpedia"
          >
            github
          </a>
        </p>
      </footer>
    </main>
  );
}

function IntegrationCard({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="surface-1 rounded-xl p-5">
      <div className="text-card-title text-[var(--ink)]">{label}</div>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">{detail}</p>
    </div>
  );
}

function ProofRow({ label, address }: { label: string; address: string }) {
  const lower = address.toLowerCase();
  return (
    <div className="flex flex-col gap-1 p-5">
      <span className="text-eyebrow text-[var(--ink-subtle)]">{label}</span>
      <a
        href={`${EXPLORER}/address/${lower}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        {address.slice(0, 8)}…{address.slice(-6)}
      </a>
      <a
        href={`https://explorer.0g.ai/mainnet/blockchain/accounts/${lower}/verified-contracts`}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-[var(--accent-hover)] hover:underline"
      >
        verified source ↗
      </a>
    </div>
  );
}

function DemoLink({
  href,
  label,
  detail,
  external,
}: {
  href: string;
  label: string;
  detail: string;
  external?: boolean;
}) {
  const Comp: 'a' | typeof Link = external ? 'a' : Link;
  const props = external ? { href, target: '_blank', rel: 'noreferrer' } : { href };
  return (
    <Comp
      {...(props as { href: string; target?: string; rel?: string })}
      className="surface-1 flex flex-col gap-1 rounded-lg p-4 transition-colors hover:border-[var(--hairline-strong)]"
    >
      <span className="text-sm font-medium text-[var(--ink)]">{label} →</span>
      <span className="text-xs text-[var(--ink-subtle)]">{detail}</span>
    </Comp>
  );
}
