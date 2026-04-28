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

export function QueryDemo({ brainEnsName, iNFT, peerId, pricePerQuery }: Props) {
  const [prompt, setPrompt] = useState('What are the safest 8%+ stablecoin yields right now?');
  const [steps, setSteps] = useState<Step[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setAnswer(null);
    const initial: Step[] = [
      { label: `Resolve ${brainEnsName} via ENS`, detail: 'reading text records on Sepolia…', status: 'pending' },
      { label: 'Read brain.* records', detail: 'iNFT pair, peer id, price, compute URL', status: 'pending' },
      { label: 'Brain.authorizeUsage(tokenId, agent, 900)', detail: `payment: ${pricePerQuery ?? '0'} wei`, status: 'pending' },
      { label: 'Issue access-token subname', detail: 'agent<hash>.client.brainpedia.eth (TTL on chain)', status: 'pending' },
      { label: 'POST /mcp/{peer}/brainpedia.brain over AXL', detail: peerId ? `peer ${peerId.slice(0, 12)}…` : 'no peer id', status: 'pending' },
      { label: 'Brain fetches articles from 0G Storage Log', detail: 'top-K relevance against the snapshot', status: 'pending' },
      { label: '0G Compute inference (qwen-2.5-7b)', detail: 'TEE-signed; processResponse verifies', status: 'pending' },
      { label: 'Synthesized answer + citations', detail: '', status: 'pending' },
    ];
    setSteps(initial);

    for (let i = 0; i < initial.length; i++) {
      await sleep(450 + Math.random() * 350);
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: 'running' } : idx < i ? { ...s, status: 'done' } : s,
        ),
      );
      await sleep(550 + Math.random() * 450);
      setSteps((prev) =>
        prev.map((s, idx) => (idx <= i ? { ...s, status: 'done' } : s)),
      );
    }

    setAnswer(
      'Curve stableswap pools (USDC/USDT/DAI) currently offer 5-7% from trading fees + boosted ' +
        'CRV emissions, with low impermanent-loss risk under normal market conditions. For 8%+, ' +
        'tokenized treasuries via Ondo (~5%) layered with Maple credit pools (~10-12%) is more ' +
        "sustainable than chasing leveraged-yield strategies. From a Malaysian regulatory lens, " +
        'plain stablecoin LP positions are outside SC purview today; RWA tokens that wrap ' +
        'regulated instruments ARE in scope. (Citations: stablecoin-yield-overview, ' +
        'rwa-tokenization, malaysian-regulatory-context.)',
    );
    setRunning(false);
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm uppercase tracking-wider text-[var(--muted)]">
        Try a query (simulated)
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
            Walks the same flow an MCP-registered agent would: ENS → iNFT authorize → AXL routing →
            0G Compute. Live tx flow runs once the wallet is funded above 3 OG.
          </p>
          <button
            onClick={run}
            disabled={running || !iNFT}
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

      {answer && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </section>
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
