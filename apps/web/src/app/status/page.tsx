import { createPublicClient, http, namehash } from 'viem';
import { sepolia } from 'viem/chains';
import { addEnsContracts } from '@ensdomains/ensjs';
import { getTextRecord } from '@ensdomains/ensjs/public';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Check {
  label: string;
  detail?: string;
  status: 'ok' | 'fail';
  link?: { href: string; text: string };
}

const ZG_RPC = process.env.ZG_RPC_URL ?? 'https://evmrpc-testnet.0g.ai';
const ZG_INFT = process.env.ZG_INFT_CONTRACT_ADDRESS ?? '';
const ZG_EXPLORER = process.env.NEXT_PUBLIC_ZG_EXPLORER_URL ?? 'https://chainscan-galileo.0g.ai';
const SEPOLIA_RPC = process.env.ENS_RPC_URL ?? 'https://ethereum-sepolia.publicnode.com';
const SUBNAME_REGISTRAR = process.env.ENS_SUBNAME_REGISTRAR_ADDRESS ?? '';
const ACCESS_TOKEN_REGISTRAR = process.env.ENS_ACCESS_TOKEN_REGISTRAR_ADDRESS ?? '';
const PARENT_NAME = process.env.ENS_PARENT_NAME ?? 'brainpedia.eth';

async function rpc(url: string, method: string, params: unknown[]): Promise<string | undefined> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
      cache: 'no-store',
    });
    const d = (await r.json()) as { result?: string };
    return d.result;
  } catch {
    return undefined;
  }
}

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  // 1. Brain.sol on 0G Galileo
  if (ZG_INFT) {
    const code = await rpc(ZG_RPC, 'eth_getCode', [ZG_INFT, 'latest']);
    checks.push({
      label: `Brain.sol deployed on 0G Galileo`,
      detail: code && code !== '0x' ? `${ZG_INFT.slice(0, 10)}…${ZG_INFT.slice(-6)}` : 'no code',
      status: code && code !== '0x' ? 'ok' : 'fail',
      link: code && code !== '0x' ? { href: `${ZG_EXPLORER}/address/${ZG_INFT}`, text: 'explorer →' } : undefined,
    });
    // tokenId 7 — yudhi.bpedia.eth, the canonical demo Brain
    const data = '0x50da6a6c' + '0000000000000000000000000000000000000000000000000000000000000007';
    const root = await rpc(ZG_RPC, 'eth_call', [{ to: ZG_INFT, data }, 'latest']);
    checks.push({
      label: 'Sample Brain (tokenId 7, yudhi.bpedia.eth) intelligence',
      detail: root && root !== '0x' ? `currentStorageRoot = ${root.slice(0, 12)}…` : 'no record',
      status: root && root !== '0x' ? 'ok' : 'fail',
    });
  }

  // 2. Sepolia registrars
  for (const [name, addr] of [
    ['SubnameRegistrar', SUBNAME_REGISTRAR],
    ['AccessTokenRegistrar', ACCESS_TOKEN_REGISTRAR],
  ] as const) {
    if (!addr) {
      checks.push({ label: `${name} env unset`, status: 'fail' });
      continue;
    }
    const code = await rpc(SEPOLIA_RPC, 'eth_getCode', [addr, 'latest']);
    checks.push({
      label: `${name} deployed on Sepolia`,
      detail: code && code !== '0x' ? `${addr.slice(0, 10)}…${addr.slice(-6)}` : 'no code',
      status: code && code !== '0x' ? 'ok' : 'fail',
      link:
        code && code !== '0x'
          ? { href: `https://sepolia.etherscan.io/address/${addr}`, text: 'etherscan →' }
          : undefined,
    });
  }

  // 3. Parent name registered
  const parentNode = namehash(PARENT_NAME);
  const parentOwner = await rpc(SEPOLIA_RPC, 'eth_call', [
    { to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', data: '0x02571be3' + parentNode.slice(2) },
    'latest',
  ]);
  const parentOwnerAddr =
    parentOwner && parentOwner !== '0x' ? '0x' + parentOwner.slice(-40) : null;
  checks.push({
    label: `${PARENT_NAME} registered`,
    detail: parentOwnerAddr ? `owner ${parentOwnerAddr.slice(0, 8)}…` : 'not registered',
    status: parentOwnerAddr && parentOwnerAddr !== '0x' + '0'.repeat(40) ? 'ok' : 'fail',
    link: { href: `https://sepolia.app.ens.domains/${PARENT_NAME}`, text: 'sepolia.app.ens.domains →' },
  });

  // 4. Sample subname records
  try {
    const ensClient = createPublicClient({
      chain: addEnsContracts(sepolia),
      transport: http(SEPOLIA_RPC),
    });
    const sample = `yudhi.${PARENT_NAME}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = await getTextRecord(ensClient as any, { name: sample, key: 'brain.inft' });
    checks.push({
      label: `${sample} text records resolve`,
      detail: v ? `brain.inft = ${v}` : 'no records',
      status: v ? 'ok' : 'fail',
      link: { href: `/yudhi`, text: 'open page →' },
    });
  } catch (e) {
    checks.push({
      label: 'yudhi.brainpedia.eth text records resolve',
      detail: (e as Error).message.slice(0, 60),
      status: 'fail',
    });
  }

  // 5. Discovery shortcut
  try {
    const ensClient = createPublicClient({
      chain: addEnsContracts(sepolia),
      transport: http(SEPOLIA_RPC),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = await getTextRecord(ensClient as any, {
      name: `defi.discover.${PARENT_NAME}`,
      key: 'brainpedia.brains',
    });
    const brainCount = list ? list.split('\n').filter(Boolean).length : 0;
    checks.push({
      label: `defi.discover.${PARENT_NAME} discovery shortcut`,
      detail: brainCount > 0 ? `→ ${brainCount} brain(s)` : 'no brains listed',
      status: brainCount > 0 ? 'ok' : 'fail',
    });
  } catch {
    checks.push({
      label: 'discovery shortcut',
      status: 'fail',
    });
  }

  return checks;
}

export default async function StatusPage() {
  const checks = await runChecks();
  const okCount = checks.filter((c) => c.status === 'ok').length;
  const allGreen = okCount === checks.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs text-[var(--muted)]">/status</p>
        <h1 className="text-3xl font-medium tracking-tight">Live system health</h1>
        <p className="text-[var(--muted)]">
          Read-only checks against the deployed contracts and ENS registrations on every page
          load. {okCount}/{checks.length} green.
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-current/10 rounded-lg border border-current/10">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-3 p-4">
            <span
              className={[
                'mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                c.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500',
              ].join(' ')}
            />
            <div className="flex flex-1 flex-col">
              <p className="text-sm">{c.label}</p>
              {c.detail && <p className="font-mono text-xs text-[var(--muted)]">{c.detail}</p>}
            </div>
            {c.link && (
              <a
                href={c.link.href}
                className="text-xs underline underline-offset-4 text-[var(--muted)] hover:text-current"
                target={c.link.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
              >
                {c.link.text}
              </a>
            )}
          </li>
        ))}
      </ul>

      <section className="rounded-lg border border-current/10 p-4 text-sm text-[var(--muted)]">
        Run the same checks locally:{' '}
        <code className="font-mono">bun run --cwd scripts verify-live</code>. {allGreen ? '🟢' : '🟡'}
      </section>
    </main>
  );
}
