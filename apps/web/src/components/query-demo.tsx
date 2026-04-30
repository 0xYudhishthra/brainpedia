'use client';

import { useState } from 'react';

interface Props {
  brainEnsName: string;
  iNFT: string | null;
  peerId: string | null;
  pricePerQuery: string | null;
}

interface Step {
  label: string;
  detail: string;
  status: 'pending' | 'running' | 'done';
}

interface BrainQueryResult {
  answer: string;
  citations: string[];
  confidence: number | null;
  brainEnsName: string;
  storageRoot: string;
  verified: boolean;
}

const FALLBACK_ANSWER =
  'Curve stableswap pools (USDC/USDT/DAI) currently offer 5-7% from trading fees + boosted ' +
  'CRV emissions, with low impermanent-loss risk under normal market conditions. For 8%+, ' +
  'tokenized treasuries via Ondo (~5%) layered with Maple credit pools (~10-12%) is more ' +
  "sustainable than chasing leveraged-yield strategies. From a Malaysian regulatory lens, " +
  'plain stablecoin LP positions are outside SC purview today; RWA tokens that wrap ' +
  'regulated instruments ARE in scope.';

const FALLBACK_CITATIONS = [
  'stablecoin-yield-overview',
  'rwa-tokenization',
  'malaysian-regulatory-context',
];

export function QueryDemo({ brainEnsName, iNFT, peerId, pricePerQuery }: Props) {
  const [prompt, setPrompt] = useState('What are the safest 8%+ stablecoin yields right now?');
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<BrainQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const run = async () => {
    if (running) return;
    if (!prompt.trim()) return;
    setRunning(true);
    setResult(null);
    setError(null);
    setUsedFallback(false);

    const initial: Step[] = [
      { label: `Resolve ${brainEnsName} via ENS`, detail: 'reading text records on Sepolia…', status: 'running' },
      { label: 'POST /api/query → brain.* records', detail: `iNFT ${iNFT ? iNFT.slice(0, 10) + '…' : '—'}`, status: 'pending' },
      { label: 'Brain forwards JSON-RPC query', detail: peerId ? `peer ${peerId.slice(0, 12)}…` : 'live brain endpoint', status: 'pending' },
      { label: 'Brain fetches articles from 0G Storage Log', detail: 'top-K relevance against the snapshot', status: 'pending' },
      { label: '0G Compute inference (qwen-2.5-7b)', detail: 'TEE-signed; processResponse verifies', status: 'pending' },
      { label: 'Synthesized answer + citations', detail: pricePerQuery ? `paid ${pricePerQuery} wei` : '', status: 'pending' },
    ];
    setSteps(initial);

    // Animate the first 5 stages while the network call is in flight; we'll
    // race the animation against the real fetch so the UI stays responsive.
    const animationDone = (async () => {
      for (let i = 0; i < initial.length - 1; i++) {
        await sleep(380 + Math.random() * 280);
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'done' } : idx === i + 1 ? { ...s, status: 'running' } : s,
          ),
        );
      }
    })();

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errBody.error ?? `brain returned ${res.status}`);
      }
      const data = (await res.json()) as BrainQueryResult;

      await animationDone;
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
      setResult(data);
    } catch (err) {
      // Network/proxy/brain failure — fall through to canned answer so the
      // hackathon demo never goes blank, but mark it as a fallback in the UI.
      // eslint-disable-next-line no-console
      console.error('[query-demo] live call failed:', err);
      setError((err as Error).message);
      await animationDone;
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
      setResult({
        answer: FALLBACK_ANSWER,
        citations: FALLBACK_CITATIONS,
        confidence: null,
        brainEnsName,
        storageRoot: '',
        verified: false,
      });
      setUsedFallback(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
        Try a query (live)
      </h2>
      <div className="rounded-lg border border-current/10 p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="w-full resize-none border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          disabled={running}
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-[var(--muted)]">
            Hits the live Brain over MCP JSON-RPC: ENS → /api/query proxy → 0G Storage retrieval →
            0G Compute (qwen-2.5-7b). Falls back to a canned answer if the brain is down.
          </p>
          <button
            onClick={run}
            disabled={running || !prompt.trim()}
            className="ml-4 shrink-0 rounded bg-[var(--fg)] px-4 py-1.5 text-xs font-medium text-[var(--bg)] disabled:opacity-40"
          >
            {running ? 'querying…' : 'query'}
          </button>
        </div>
      </div>

      {steps.length > 0 && (
        <ol className="flex flex-col gap-2 rounded-lg border border-current/10 p-4 font-mono text-xs">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={[
                  'mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full',
                  s.status === 'done'
                    ? 'bg-emerald-500'
                    : s.status === 'running'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-current/20',
                ].join(' ')}
              />
              <div className="flex flex-col">
                <span>{s.label}</span>
                {s.detail && <span className="text-[var(--muted)]">{s.detail}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {result && (
        <div
          className={[
            'flex flex-col gap-2 rounded-lg border p-4 text-sm leading-relaxed',
            usedFallback
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5',
          ].join(' ')}
        >
          {usedFallback && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700">
              fallback — live brain unreachable
              {error ? ` (${error})` : ''}
            </p>
          )}
          {!usedFallback && (
            <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <span>{result.brainEnsName}</span>
              {result.verified && (
                <span className="text-emerald-700">verified · TEE-signed</span>
              )}
              {result.confidence !== null && (
                <span>confidence {Math.round(result.confidence * 100)}%</span>
              )}
            </div>
          )}
          <p className="whitespace-pre-wrap">{result.answer}</p>
          {result.citations.length > 0 && (
            <p className="font-mono text-[11px] text-[var(--muted)]">
              citations: {result.citations.join(', ')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
