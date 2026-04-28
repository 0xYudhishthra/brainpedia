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
          <p className="mb-3 text-sm">Connect Brainpedia to Claude Desktop:</p>
          <pre className="overflow-x-auto rounded bg-black/5 p-3 font-mono text-xs dark:bg-white/5">
{`# in Claude Desktop's mcp config
{
  "mcpServers": {
    "brainpedia": {
      "command": "npx",
      "args": ["-y", "@brainpedia/mcp-server"]
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
          <code className="font-mono">brainpedia.xyz/&lt;name&gt;</code>. Try{' '}
          <Link className="underline underline-offset-4" href="/yudhi">
            /yudhi
          </Link>
          .
        </p>
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
