import Link from 'next/link';
import { CreateBrainClient } from './create-client';

export const dynamic = 'force-dynamic';

export default function CreatePage() {
  const minterAddress =
    process.env.NEXT_PUBLIC_BRAIN_MINTER_ADDRESS ??
    '0x3e7D22150d6b883a89703d760d66743D2223456b';
  const explorerUrl =
    process.env.NEXT_PUBLIC_ZG_EXPLORER_URL ?? 'https://chainscan.0g.ai';

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-4">
        <Link href="/" className="font-mono text-xs text-[var(--muted)] hover:underline">
          ← brainpedia
        </Link>
        <h1 className="font-mono text-3xl font-medium tracking-tight">
          mint a brain
        </h1>
        <p className="text-balance text-lg text-[var(--muted)]">
          Drop any folder of knowledge. Brainpedia compiles it into a
          Karpathy-style wiki, uploads the snapshot to 0G Storage, and you
          sign one transaction to mint an ERC-7857 Brain that other agents
          can pay to query.
        </p>
        <p className="text-sm text-[var(--muted)]">
          Supported formats today: markdown (.md), plain text (.txt), PDF
          (.pdf), Word (.docx). Same content fed to{' '}
          <code className="font-mono">brainpedia-mcp</code> via Claude Code
          works here too — this is the no-CLI path.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-current/10 bg-black/[0.02] p-6 dark:bg-white/[0.02]">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          How it works
        </h2>
        <ol className="flex flex-col gap-2 text-sm">
          <li>1. Connect a wallet on 0G Aristotle mainnet (chainId 16661).</li>
          <li>2. Drop your files. Server extracts text and compiles articles.</li>
          <li>3. Server uploads the snapshot to 0G Storage and returns a merkle root.</li>
          <li>
            4. Your wallet signs <code className="font-mono">BrainMinter.mintToSender(rootHash, ...)</code> at{' '}
            <a
              className="underline"
              href={`${explorerUrl}/open/address/${minterAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              {minterAddress.slice(0, 6)}…{minterAddress.slice(-4)}
            </a>
            .
          </li>
          <li>5. The minted iNFT is owned by your wallet, not the server.</li>
        </ol>
      </section>

      <CreateBrainClient minterAddress={minterAddress as `0x${string}`} />

      <footer className="text-xs text-[var(--muted)]">
        Power-user path: <code className="font-mono">npx -y brainpedia-mcp</code>{' '}
        in Claude Code. Web path: this page. Both mint the same canonical
        ERC-7857 Brain on 0G mainnet.
      </footer>
    </main>
  );
}
