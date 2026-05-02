'use client';

import { useState } from 'react';

interface BrainResult {
  brainEnsName: string;
  ok: boolean;
  answer?: string;
  citations?: string[];
  verified?: boolean;
  storageRoot?: string;
  errorMessage?: string;
}

interface PaymentSplit {
  brainEnsName: string;
  inft: string | null;
  citationCount: number;
  weight: number;
  amountWei: string;
  priceQueryWei: string | null;
}

interface RouterInfo {
  auto: true;
  reason: string;
  source: 'llm' | 'fallback';
  available: string[];
}

interface MixtureResponse {
  mode: 'mixture';
  topic: string;
  router?: RouterInfo;
  prompt: string;
  transport: 'axl' | 'https';
  brains: BrainResult[];
  synthesis: string;
  payments: PaymentSplit[];
  totalAmountWei: string;
  distributor: string | null;
}

const DEFAULT_PROMPT =
  'Compare the safest stablecoin yield strategies with the LLM-Wiki approach to compiling research notes.';

const KNOWN_BRAINS = ['yudhi.bpedia.eth', 'karpathy.bpedia.eth'];

export function MixtureDemo() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [topic, setTopic] = useState('auto');
  const [response, setResponse] = useState<MixtureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (running || !prompt.trim()) return;
    setRunning(true);
    setResponse(null);
    setError(null);
    try {
      const res = await fetch(`/api/query?mode=mixture&topic=${encodeURIComponent(topic)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? `mixture returned ${res.status}`);
      }
      const data = (await res.json()) as MixtureResponse;
      setResponse(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const totalOg = response ? formatOg(response.totalAmountWei) : null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
          Mixture-of-Brains query
        </h2>
        <p className="font-mono text-[10px] text-[var(--muted)]">
          POST /api/query?mode=mixture
        </p>
      </div>

      <div className="rounded-lg border border-current/10 p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full resize-none border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          disabled={running}
          placeholder="Ask the network a question…"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>topic</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={running}
              className="rounded border border-current/10 bg-transparent px-2 py-1 font-mono text-xs"
            >
              <option value="auto">auto (LLM router)</option>
              <option value="all">all (every brain)</option>
              <option value="research">research</option>
              <option value="frameworks">frameworks</option>
            </select>
            <span className="opacity-70">
              {topic === 'auto'
                ? '→ orchestrator picks the shortcut'
                : (
                  <>→ resolves <code className="font-mono">{topic}.discover.bpedia.eth</code></>
                )}
            </span>
          </div>
          <button
            onClick={run}
            disabled={running || !prompt.trim()}
            className="ml-auto shrink-0 rounded bg-[var(--fg)] px-4 py-1.5 text-xs font-medium text-[var(--bg)] disabled:opacity-40"
          >
            {running ? 'fanning out…' : 'query the network'}
          </button>
        </div>
      </div>

      {running && (
        <div className="rounded-lg border border-current/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            in flight
          </p>
          <ul className="mt-2 flex flex-col gap-1 font-mono text-xs">
            {KNOWN_BRAINS.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <span>{b}</span>
                <span className="text-[var(--muted)]">
                  resolving · top-K retrieving · TEE-attested inference
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <p className="font-mono text-[10px] uppercase tracking-wider text-red-700">
            error
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {response && (
        <div className="flex flex-col gap-3">
          {response.router && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-blue-700">
                orchestrator routed → {response.topic} · source={response.router.source}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{response.router.reason}</p>
              <p className="mt-2 font-mono text-[10px] text-[var(--muted)]">
                considered: {response.router.available.join(', ')}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">
              synthesis · transport={response.transport}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{response.synthesis}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {response.brains.map((b) => (
              <BrainCard key={b.brainEnsName} brain={b} />
            ))}
          </div>

          {response.payments.length > 0 && (
            <div className="rounded-lg border border-current/10 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  citation-weighted royalty splits
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  total{' '}
                  <span className="font-mono text-[var(--fg)]">{totalOg} OG</span>
                </p>
              </div>
              <ul className="mt-3 flex flex-col gap-2 text-xs">
                {response.payments.map((p) => (
                  <li
                    key={p.brainEnsName}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-current/10 bg-black/[0.02] px-3 py-2 dark:bg-white/[0.02]"
                  >
                    <a
                      href={`https://sepolia.app.ens.domains/${p.brainEnsName}`}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-xs hover:underline"
                    >
                      {p.brainEnsName} ↗
                    </a>
                    <span className="font-mono text-[var(--muted)]">
                      {p.citationCount} cite{p.citationCount === 1 ? '' : 's'} · weight{' '}
                      {(p.weight * 100).toFixed(0)}%
                    </span>
                    <span className="font-mono">{formatOg(p.amountWei)} OG</span>
                  </li>
                ))}
              </ul>
              {response.distributor && (
                <p className="mt-3 text-[11px] text-[var(--muted)]">
                  Settle in one tx via{' '}
                  <a
                    href={`https://chainscan-galileo.0g.ai/address/${response.distributor}`}
                    target="_blank"
                    rel="noopener"
                    className="font-mono underline-offset-4 hover:underline"
                  >
                    RoyaltyDistributor.distribute ↗
                  </a>{' '}
                  on 0G Galileo. Each Brain owner receives their share directly. (CLI:{' '}
                  <code className="font-mono">bun run scripts/setup/settle-royalties.ts</code>)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function BrainCard({ brain }: { brain: BrainResult }) {
  if (!brain.ok) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <a
          href={`https://sepolia.app.ens.domains/${brain.brainEnsName}`}
          target="_blank"
          rel="noopener"
          className="font-mono text-xs hover:underline"
        >
          {brain.brainEnsName} ↗
        </a>
        <p className="font-mono text-[10px] uppercase tracking-wider text-red-700">
          unreachable
        </p>
        <p className="text-xs">{brain.errorMessage}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-current/10 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://sepolia.app.ens.domains/${brain.brainEnsName}`}
          target="_blank"
          rel="noopener"
          className="font-mono text-xs hover:underline"
        >
          {brain.brainEnsName} ↗
        </a>
        {brain.verified && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-700">
            verified · TEE
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed line-clamp-6">{brain.answer}</p>
      {brain.citations && brain.citations.length > 0 && (
        <p className="font-mono text-[10px] text-[var(--muted)]">
          cites: {brain.citations.join(', ')}
        </p>
      )}
      {brain.storageRoot && (
        <p className="font-mono text-[10px] text-[var(--muted)]">
          root {brain.storageRoot.slice(0, 10)}…{brain.storageRoot.slice(-6)}
        </p>
      )}
    </div>
  );
}

function formatOg(wei: string): string {
  // Wei strings can exceed JS number precision, so do the divide manually.
  // Display 6 decimal places — matches the per-query 0.001 OG scale.
  if (!wei || wei === '0') return '0';
  const n = BigInt(wei);
  const ether = n / 10n ** 18n;
  const frac = n % 10n ** 18n;
  const fracStr = frac.toString().padStart(18, '0').slice(0, 6);
  const trimmed = fracStr.replace(/0+$/, '');
  return trimmed.length > 0 ? `${ether}.${trimmed}` : ether.toString();
}
