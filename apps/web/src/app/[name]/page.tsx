import { notFound } from 'next/navigation';

interface BrainPageProps {
  params: Promise<{ name: string }>;
}

export default async function BrainPage({ params }: BrainPageProps) {
  const { name } = await params;

  // TODO Day 3: resolve <name>.<ENS_PARENT_NAME> via @brainpedia/ens
  //              read text records (brain.inft, brain.storage_root, brain.axl_peer_id, ...)
  //              fetch the snapshot manifest from 0G Storage Log layer
  //              render compiled wiki articles
  const brain = await resolveBrain(name);
  if (!brain) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs text-[var(--muted)]">
          {brain.ensName}
        </p>
        <h1 className="text-3xl font-medium tracking-tight">{brain.title}</h1>
        <p className="text-[var(--muted)]">{brain.description}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Stat label="iNFT" value={brain.inft ?? '—'} mono />
        <Stat label="Storage root" value={brain.storageRoot ?? '—'} mono truncate />
        <Stat label="Specialty" value={brain.specialty ?? '—'} />
        <Stat label="Price / query" value={brain.pricePerQuery ?? '—'} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">Articles</h2>
        <p className="text-sm text-[var(--muted)]">
          Day 3 — fetch from 0G Storage Log snapshot referenced by{' '}
          <code className="font-mono">brain.storage_root</code>.
        </p>
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

interface ResolvedBrain {
  ensName: string;
  title: string;
  description: string;
  inft: string | null;
  storageRoot: string | null;
  specialty: string | null;
  pricePerQuery: string | null;
}

async function resolveBrain(name: string): Promise<ResolvedBrain | null> {
  // Stub — wired up Day 3 once @brainpedia/ens lands.
  return {
    ensName: `${name}.${process.env.ENS_PARENT_NAME ?? 'brainpedia.eth'}`,
    title: name,
    description: 'Brain page — pending ENS + 0G integration.',
    inft: null,
    storageRoot: null,
    specialty: null,
    pricePerQuery: null,
  };
}
