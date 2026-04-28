import Link from 'next/link';
import { NetworkViz } from '@/components/network-viz';

const DEMO_NODES = [
  { id: 'agent', label: 'querying agent', kind: 'agent' as const, active: 0.8 },
  { id: 'orch', label: 'orchestrator', kind: 'orchestrator' as const, active: 0.7 },
  { id: 'defi', label: 'defi.brainpedia.eth', kind: 'brain' as const, active: 0.5 },
  { id: 'malaysia', label: 'malaysia.brainpedia.eth', kind: 'brain' as const, active: 0.5 },
  { id: 'mush', label: 'mushroom.brainpedia.eth', kind: 'brain' as const, active: 0.3 },
];

const DEMO_LINKS = [
  { source: 'agent', target: 'orch', kind: 'request' as const, active: 0.8 },
  { source: 'orch', target: 'defi', kind: 'request' as const, active: 0.7 },
  { source: 'orch', target: 'malaysia', kind: 'request' as const, active: 0.7 },
  { source: 'orch', target: 'mush', kind: 'request' as const, active: 0.4 },
  { source: 'defi', target: 'orch', kind: 'response' as const, active: 0.6 },
  { source: 'malaysia', target: 'orch', kind: 'response' as const, active: 0.6 },
];

export default function HomePage() {
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
          <NetworkViz nodes={DEMO_NODES} links={DEMO_LINKS} />
        </div>
        <p className="text-xs text-[var(--muted)]">
          Agent → orchestrator (AXL <code className="font-mono">/mcp</code>) → fan-out to
          specialty Brains → synthesized response. Each Brain runs its own AXL daemon with
          its own Ed25519 peer id.
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
      "args": ["/absolute/path/to/brainpedia/apps/mcp-server/dist/index.js"],
      "env": {
        "ZG_WALLET_PRIVATE_KEY": "0x...",
        "ZG_INFT_CONTRACT_ADDRESS": "0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6",
        "ENS_RPC_URL": "https://ethereum-sepolia.publicnode.com",
        "ENS_PARENT_NAME": "brainpedia.eth",
        "ENS_NETWORK": "sepolia",
        "ENS_SUBNAME_REGISTRAR_ADDRESS": "0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6",
        "ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS": "0x36ce746e88b9098899fc8d0ab274c45748d04fd9"
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
          href="https://app.ens.domains/brainpedia.eth?chain=sepolia"
          label="brainpedia.eth on ENS"
          detail="parent name, deployer-owned"
        />
        <DemoLink
          external
          href="https://app.ens.domains/yudhi.brainpedia.eth?chain=sepolia"
          label="yudhi.brainpedia.eth"
          detail="all 8 brain.* records"
        />
        <DemoLink
          external
          href="https://app.ens.domains/defi.discover.brainpedia.eth?chain=sepolia"
          label="defi.discover…"
          detail="topic discovery shortcut"
        />
        <DemoLink
          external
          href="https://chainscan-galileo.0g.ai/address/0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6"
          label="Brain.sol on 0G"
          detail="ERC-7857 iNFT, tokenId 1 minted"
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

