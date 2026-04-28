import Link from 'next/link';

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
