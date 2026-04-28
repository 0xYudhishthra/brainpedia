import { notFound } from 'next/navigation';
import {
  loadEnsConfig,
  createEnsPublicClient,
  resolveBrain,
  BRAIN_TEXT_KEYS,
  type ResolvedBrain,
} from '@brainpedia/ens';

interface BrainPageProps {
  params: Promise<{ name: string }>;
}

export const dynamic = 'force-dynamic';

export default async function BrainPage({ params }: BrainPageProps) {
  const { name } = await params;
  const brain = await safeResolveBrain(name);
  if (!brain) notFound();

  const r = brain.records;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs text-[var(--muted)]">{brain.ensName}</p>
        <h1 className="text-3xl font-medium tracking-tight">
          {r.specialty ? `${name} · ${r.specialty}` : name}
        </h1>
        {r.description && (
          <p className="max-w-prose text-[var(--muted)]">{r.description}</p>
        )}
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Stat label="iNFT" value={r.inft ?? '—'} mono truncate />
        <Stat label="Storage root" value={r.storageRoot ?? '—'} mono truncate />
        <Stat label="AXL peer id" value={r.axlPeerId ?? '—'} mono truncate />
        <Stat label="Specialty" value={r.specialty ?? '—'} />
        <Stat label="Price / query" value={r.priceQuery ?? '—'} mono />
        <Stat label="Compute provider" value={r.computeUrl ?? '—'} mono truncate />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          How agents query this Brain
        </h2>
        <ol className="ml-5 list-decimal space-y-2 text-sm">
          <li>
            Resolve <code className="font-mono">{brain.ensName}</code> →
            read the {BRAIN_TEXT_KEYS.axlPeerId}, {BRAIN_TEXT_KEYS.inft}, and{' '}
            {BRAIN_TEXT_KEYS.priceQuery} text records.
          </li>
          <li>
            Call <code className="font-mono">authorizeUsage(tokenId, agent, ttl)</code> on{' '}
            {r.inft ? <code className="font-mono">{r.inft}</code> : 'the iNFT'} with
            payment.
          </li>
          <li>
            POST the prompt to{' '}
            <code className="font-mono">/mcp/{r.axlPeerId ?? '<peer>'}/brainpedia.brain</code>{' '}
            on a connected AXL daemon.
          </li>
        </ol>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="rounded-lg border border-current/10 p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p
        className={[
          'mt-1 text-sm',
          mono ? 'font-mono' : '',
          truncate ? 'truncate' : '',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

async function safeResolveBrain(name: string): Promise<ResolvedBrain | null> {
  // Skip resolution at build time / in dev when ENS env isn't configured.
  if (
    !process.env.ENS_PARENT_NAME ||
    !process.env.ENS_RPC_URL ||
    !process.env.ENS_SUBNAME_REGISTRAR_ADDRESS ||
    !process.env.ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS
  ) {
    return {
      ensName: `${name}.${process.env.ENS_PARENT_NAME ?? 'brainpedia.eth'}`,
      owner: null,
      records: {
        description: 'ENS not configured — set ENS_RPC_URL and registrar addresses to resolve.',
      },
    };
  }
  try {
    const cfg = loadEnsConfig();
    const client = createEnsPublicClient(cfg);
    const brain = await resolveBrain(
      { publicClient: client, config: cfg },
      `${name}.${cfg.parentName}`,
    );
    return brain;
  } catch {
    return null;
  }
}
