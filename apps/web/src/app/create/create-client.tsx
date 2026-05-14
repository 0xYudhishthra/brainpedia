'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWriteContract } from 'wagmi';
import { ZG_EXPLORER_URL, ZG_MAINNET_ID } from '@/lib/wagmi';

interface CompiledArticleSummary {
  slug: string;
  title: string;
  linkCount: number;
  bodyChars: number;
  sources: string[];
}

interface CompileResponse {
  ok: boolean;
  rootHash?: `0x${string}`;
  articleCount?: number;
  articles?: CompiledArticleSummary[];
  formatBreakdown?: Record<string, number>;
  unsupported?: Array<{ path: string; reason: string }>;
  failed?: Array<{ path: string; error: string }>;
  storageUploadTx?: string;
  error?: string;
}

// Minimal BrainMinter ABI for mintToSender. Public-only Brain — encryptedURI
// and sealedKey are empty, metadataHash is zero. The server-uploaded snapshot
// merkle root goes in as initialStorageRoot.
const MINTER_ABI = [
  {
    type: 'function',
    name: 'mintToSender',
    stateMutability: 'payable',
    inputs: [
      { name: 'initialStorageRoot', type: 'bytes32' },
      { name: 'encryptedURI', type: 'bytes' },
      { name: 'metadataHash', type: 'bytes32' },
      { name: 'description', type: 'string' },
      { name: 'sealedKey', type: 'bytes' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const;

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

export function CreateBrainClient({ minterAddress }: { minterAddress: `0x${string}` }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, isPending: isMinting } = useWriteContract();

  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [compileState, setCompileState] = useState<'idle' | 'compiling' | 'done' | 'error'>('idle');
  const [compileResult, setCompileResult] = useState<CompileResponse | null>(null);
  const [mintHash, setMintHash] = useState<`0x${string}` | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);

  const onChainCorrect = chainId === ZG_MAINNET_ID;
  const injectedConnector = useMemo(() => connectors.find((c) => c.id === 'injected') ?? connectors[0], [connectors]);

  const onPickFiles = useCallback((picked: FileList | null) => {
    if (!picked) return;
    setFiles(Array.from(picked));
    setCompileState('idle');
    setCompileResult(null);
    setMintHash(null);
    setMintError(null);
  }, []);

  const onDrop = useCallback((ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const dropped = Array.from(ev.dataTransfer.files);
    if (dropped.length === 0) return;
    setFiles(dropped);
    setCompileState('idle');
    setCompileResult(null);
  }, []);

  const onCompile = useCallback(async () => {
    if (!address || files.length === 0) return;
    setCompileState('compiling');
    setCompileResult(null);
    setMintError(null);
    try {
      const fd = new FormData();
      fd.append('owner', address);
      for (const f of files) fd.append('files', f);
      const res = await fetch('/api/create', { method: 'POST', body: fd });
      const body: CompileResponse = await res.json();
      setCompileResult(body);
      setCompileState(body.ok ? 'done' : 'error');
    } catch (err) {
      setCompileResult({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      setCompileState('error');
    }
  }, [address, files]);

  const onMint = useCallback(async () => {
    if (!compileResult?.rootHash) return;
    setMintError(null);
    try {
      if (!onChainCorrect) {
        await switchChain({ chainId: ZG_MAINNET_ID });
      }
      const hash = await writeContractAsync({
        address: minterAddress,
        abi: MINTER_ABI,
        functionName: 'mintToSender',
        args: [
          compileResult.rootHash,
          '0x' as `0x${string}`,
          ZERO_BYTES32,
          description.trim() || 'Brain created via brainpedia.up.railway.app',
          '0x' as `0x${string}`,
        ],
        value: 0n,
      });
      setMintHash(hash);
    } catch (err) {
      setMintError(err instanceof Error ? err.message : String(err));
    }
  }, [compileResult, description, minterAddress, onChainCorrect, switchChain, writeContractAsync]);

  return (
    <section className="flex flex-col gap-6">
      {/* Wallet block */}
      <div className="rounded-lg border border-current/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <div className="text-[var(--muted)]">wallet</div>
            <div className="font-mono">
              {isConnected && address
                ? `${address.slice(0, 6)}…${address.slice(-4)}`
                : 'not connected'}
            </div>
          </div>
          {!isConnected ? (
            <button
              className="rounded border border-current/20 px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              disabled={isConnecting || !injectedConnector}
              onClick={() => injectedConnector && connect({ connector: injectedConnector })}
            >
              {isConnecting ? 'connecting…' : 'connect wallet'}
            </button>
          ) : (
            <button
              className="rounded border border-current/20 px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => disconnect()}
            >
              disconnect
            </button>
          )}
        </div>
        {isConnected && !onChainCorrect && (
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-amber-600 dark:text-amber-400">
            <span>Wrong network. Brainpedia mints on 0G Aristotle (chainId {ZG_MAINNET_ID}).</span>
            <button
              className="rounded border border-current/30 px-2 py-1 text-xs hover:bg-amber-100/30"
              onClick={() => switchChain({ chainId: ZG_MAINNET_ID })}
            >
              switch network
            </button>
          </div>
        )}
      </div>

      {/* File picker / drop zone */}
      <div
        className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-current/20 p-6 text-center"
        onDrop={onDrop}
        onDragOver={(ev) => ev.preventDefault()}
      >
        <p className="text-sm">
          Drop a folder of files here, or pick them manually. Markdown, plain
          text, PDF, and Word are supported.
        </p>
        <input
          type="file"
          multiple
          accept=".md,.markdown,.txt,.text,.pdf,.docx"
          onChange={(ev) => onPickFiles(ev.target.files)}
          className="mx-auto block max-w-md text-sm"
        />
        {files.length > 0 && (
          <ul className="mx-auto max-w-md text-left text-xs text-[var(--muted)]">
            {files.map((f) => (
              <li key={f.name + f.size} className="truncate">
                {f.name} ({Math.ceil(f.size / 1024)} KB)
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-[var(--muted)]" htmlFor="desc">
          Brain description (optional)
        </label>
        <input
          id="desc"
          type="text"
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          placeholder="e.g. AI x Web3 protocol design notes"
          className="rounded border border-current/20 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <button
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        disabled={!isConnected || files.length === 0 || compileState === 'compiling'}
        onClick={onCompile}
      >
        {compileState === 'compiling' ? 'compiling + uploading…' : 'compile and upload to 0G Storage'}
      </button>

      {/* Compile result */}
      {compileResult && !compileResult.ok && (
        <div className="rounded border border-red-300/30 bg-red-50/30 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <div className="font-medium">compile failed</div>
          <div className="font-mono text-xs">{compileResult.error}</div>
        </div>
      )}

      {compileResult?.ok && (
        <div className="flex flex-col gap-4 rounded-lg border border-current/10 p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-[var(--muted)]">articles:</span>{' '}
              <span className="font-mono">{compileResult.articleCount}</span>
            </span>
            <span>
              <span className="text-[var(--muted)]">storage root:</span>{' '}
              <span className="font-mono">
                {compileResult.rootHash?.slice(0, 10)}…{compileResult.rootHash?.slice(-6)}
              </span>
            </span>
            {compileResult.storageUploadTx && (
              <a
                href={`${ZG_EXPLORER_URL}/tx/${compileResult.storageUploadTx}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                storage upload tx ↗
              </a>
            )}
          </div>

          <ul className="flex flex-col gap-1 text-xs">
            {compileResult.articles?.map((a) => (
              <li key={a.slug} className="font-mono">
                <span className="text-[var(--muted)]">{a.slug}</span> · {a.title} · {a.bodyChars} chars · {a.linkCount} link
                {a.linkCount === 1 ? '' : 's'}
              </li>
            ))}
          </ul>

          {compileResult.unsupported && compileResult.unsupported.length > 0 && (
            <div className="text-xs text-[var(--muted)]">
              Skipped (unsupported): {compileResult.unsupported.map((u) => u.path).join(', ')}
            </div>
          )}

          <button
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
            disabled={!isConnected || isMinting}
            onClick={onMint}
          >
            {isMinting ? 'sign mint in wallet…' : 'sign mint transaction'}
          </button>
        </div>
      )}

      {mintError && (
        <div className="rounded border border-red-300/30 bg-red-50/30 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <div className="font-medium">mint failed</div>
          <div className="font-mono text-xs break-all">{mintError}</div>
        </div>
      )}

      {mintHash && (
        <div className="rounded border border-emerald-300/30 bg-emerald-50/30 p-4 text-sm dark:bg-emerald-900/20">
          <div className="font-medium">Brain minted</div>
          <a
            className="font-mono text-xs underline break-all"
            href={`${ZG_EXPLORER_URL}/tx/${mintHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {mintHash}
          </a>
        </div>
      )}
    </section>
  );
}
