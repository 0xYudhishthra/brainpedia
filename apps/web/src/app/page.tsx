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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Topic used as the discovery shortcut for the homepage graph. */
const HOMEPAGE_DISCOVERY_TOPIC = 'defi';

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

  // If ENS env isn't configured (build-time / dev with no .env), return just
  // the agent + orchestrator skeleton — never the old hardcoded demo brains.
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-12 px-6 py-20">
      <header className="flex flex-col gap-4">
        <h1 className="font-mono text-3xl font-medium tracking-tight">brainpedia</h1>
        <p className="text-balance text-lg text-[var(--muted)]">
          Compiled human expertise as iNFTs — a knowledge layer agents pay to query.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Mixture-of-Brains query
        </h2>
        <div className="rounded-lg border border-current/10 bg-black/[0.02] p-3 dark:bg-white/[0.02]">
          <NetworkViz nodes={nodes} links={links} />
        </div>
        <p className="text-xs text-[var(--muted)]">
          {brainNames.length > 0 ? (
            <>
              Live from Sepolia ENS — {brainNames.length} brain
              {brainNames.length === 1 ? '' : 's'} listed under{' '}
              <code className="font-mono">{HOMEPAGE_DISCOVERY_TOPIC}.discover.bpedia.eth</code>.
              Agent → orchestrator (AXL <code className="font-mono">/mcp</code>) → fan-out to
              specialty Brains → synthesized response. Each Brain runs its own AXL daemon
              with its own Ed25519 peer id.
            </>
          ) : (
            <>
              No brains registered yet under{' '}
              <code className="font-mono">{HOMEPAGE_DISCOVERY_TOPIC}.discover.bpedia.eth</code>
              . Once a Brain ENS name is added to the discovery shortcut&apos;s{' '}
              <code className="font-mono">brainpedia.brains</code> text record, it shows up
              here automatically.
            </>
          )}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">Get started</h2>
        <div className="rounded-lg border border-current/10 p-5">
          <p className="mb-3 text-sm">Run the MCP server locally and point Claude Desktop at it:</p>
          <pre className="overflow-x-auto rounded bg-black/5 p-3 font-mono text-xs dark:bg-white/5">
{`git clone https://github.com/0xYudhishthra/brainpedia
cd brainpedia
bun install && bun run --filter=@brainpedia/mcp-server build

# claude_desktop_config.json
{
  "mcpServers": {
    "brainpedia": {
      "command": "node",
      "args": ["<absolute-path>/brainpedia/apps/mcp-server/dist/index.js"],
      "env": {
        "ZG_WALLET_PRIVATE_KEY": "0x<your-testnet-pk>",
        "ZG_INFT_CONTRACT_ADDRESS": "0x4E5c6DC869F9B3220F01de9047031cEd1577b08F",
        "BRAIN_MINTER_ADDRESS": "0xcca5e8c639505dd6f1d4ebf2f0c138ddc9aca2e7",
        "ZG_RPC_URL": "https://evmrpc-testnet.0g.ai",
        "ENS_NETWORK": "sepolia",
        "ENS_PARENT_NAME": "bpedia.eth",
        "ENS_RPC_URL": "https://ethereum-sepolia.publicnode.com",
        "ENS_SUBNAME_REGISTRAR_ADDRESS": "0xBb921bFFBbbE2219D1EC365213a74097348F28F0",
        "ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS": "0x3e7D22150d6b883a89703d760d66743D2223456b",
        "AXL_API_URL": "http://127.0.0.1:9012",
        "BRAINPEDIA_DEFAULT_VAULT_PATH": "<absolute-path>/your-obsidian-vault"
      }
    }
  }
}`}
          </pre>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">Browse Brains</h2>
        <p className="text-sm text-[var(--muted)]">
          Each Brain has a public page at{' '}
          <code className="font-mono">brainpedia.up.railway.app/&lt;name&gt;</code>. Try{' '}
          <Link className="underline underline-offset-4" href="/yudhi">
            /yudhi
          </Link>
          .
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DemoLink
          href="/yudhi"
          label="Sample Brain"
          detail="defi-yield-strategies, 6 articles, 0.001 OG/query"
        />
        <DemoLink href="/status" label="Live status" detail="7 read-only checks against on-chain state" />
        <DemoLink
          external
          href="https://sepolia.app.ens.domains/bpedia.eth"
          label="bpedia.eth on ENS"
          detail="parent name, deployer-owned"
        />
        <DemoLink
          external
          href="https://sepolia.app.ens.domains/yudhi.bpedia.eth"
          label="yudhi.bpedia.eth"
          detail="all brain.* records, live"
        />
        <DemoLink
          external
          href="https://sepolia.app.ens.domains/defi.discover.bpedia.eth"
          label="defi.discover…"
          detail="discovery shortcut → 3 brains"
        />
        <DemoLink
          external
          href="https://chainscan-galileo.0g.ai/address/0x4E5c6DC869F9B3220F01de9047031cEd1577b08F"
          label="Brain.sol on 0G"
          detail="ERC-7857 iNFT, 4 tokens minted"
        />
        <DemoLink
          external
          href="https://chainscan-galileo.0g.ai/address/0x44eaad4fdb7d509cd3fe7624ce512cc97b910649"
          label="RoyaltyDistributor"
          detail="single-tx multi-Brain payment"
        />
      </section>

      <footer className="mt-auto border-t border-current/10 pt-6 text-xs text-[var(--muted)]">
        <p>
          Built for ETHGlobal Open Agents · 0G · ENS · Gensyn AXL ·{' '}
          <a
            className="underline underline-offset-4"
            href="https://github.com/0xYudhishthra/brainpedia"
          >
            github
          </a>
        </p>
      </footer>
    </main>
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
      className="flex flex-col gap-1 rounded-lg border border-current/10 p-3 hover:border-current/20 transition-colors"
    >
      <span className="text-sm font-medium">{label} →</span>
      <span className="text-xs text-[var(--muted)]">{detail}</span>
    </Comp>
  );
}

