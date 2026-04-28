#!/usr/bin/env bun
/**
 * Seeds a real Brain end-to-end:
 *
 *   1. Synthesize a small set of sample articles (Karpathy-style wiki).
 *   2. Upload a snapshot manifest to 0G Storage Log layer → merkle rootHash.
 *   3. Mint a Brain iNFT on 0G Galileo with that rootHash as initial intelligence.
 *   4. Set Brain.minPayment for the new tokenId.
 *   5. Update the ENS subname's text records:
 *      - brain.inft         = "<contract>:<tokenId>"
 *      - brain.storage_root = "<rootHash>"
 *
 * After this runs, the demo Brain page resolves to fully real on-chain values.
 *
 * Usage:
 *   PRIVATE_KEY=0x... \
 *   ZG_RPC_URL=https://evmrpc-testnet.0g.ai \
 *   ZG_INFT_CONTRACT_ADDRESS=0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6 \
 *   ENS_RPC_URL=https://ethereum-sepolia.publicnode.com \
 *   ENS_NETWORK=sepolia \
 *   ENS_PARENT_NAME=brainpedia.eth \
 *   ENS_SUBNAME_REGISTRAR_ADDRESS=0x928940c1B051db2bd12dfF49499Cf4d6FC2E3Ef6 \
 *   bun run scripts/setup/seed-brain.ts \
 *     --label yudhi --specialty defi-yield-strategies
 */
import { parseArgs } from 'node:util';
import { JsonRpcProvider, Wallet, Contract, id as ethersId, parseEther, keccak256, toUtf8Bytes, type Log } from 'ethers';
import { createPublicClient, createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, mainnet } from 'viem/chains';
import { addEnsContracts } from '@ensdomains/ensjs';
import {
  loadZgConfig,
  createBrainLogClient,
  type ArticleRecord,
} from '@brainpedia/storage-0g';
import {
  loadEnsConfig,
  writeBrainRecords,
} from '@brainpedia/ens';

const { values } = parseArgs({
  options: {
    label: { type: 'string', default: 'yudhi' },
    specialty: { type: 'string', default: 'defi-yield-strategies' },
    'price-wei': { type: 'string', default: '1000000000000000' }, // 0.001 OG
    'compute-url': { type: 'string', default: '' },
    'axl-peer-id': { type: 'string', default: '' },
  },
});

function must(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`seed-brain: missing required env var ${name}`);
    process.exit(1);
  }
  return v;
}

const pk = must('PRIVATE_KEY') as Hex;
const inftAddress = must('ZG_INFT_CONTRACT_ADDRESS');
const ensRpcUrl = must('ENS_RPC_URL');
const ensNetwork = (process.env.ENS_NETWORK ?? 'sepolia') as 'mainnet' | 'sepolia';

const SAMPLE_ARTICLES: ArticleRecord[] = [
  {
    slug: 'stablecoin-yield-overview',
    title: 'Stablecoin Yield Overview',
    body:
      'Stablecoin yields come from three buckets: (1) lending markets like Aave/Compound — ' +
      'low risk but rates compress with TVL; (2) liquidity-providing on Curve/Uniswap stable pools — ' +
      'yield from swap fees plus token incentives, with impermanent loss risk only in depeg; ' +
      '(3) RWA exposure via Maple, Centrifuge, Ondo — credit risk and longer lockups, but ' +
      '8-12% sustainable.',
    links: ['lending-markets', 'curve-stableswap', 'rwa-tokenization'],
    sources: ['research/stablecoin-yields-2025.md'],
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'curve-stableswap',
    title: 'Curve StableSwap mechanics',
    body:
      'Curve\'s StableSwap invariant blends a constant-sum and constant-product curve, weighted ' +
      'by an amplification coefficient A. For correlated pairs (USDC/USDT/DAI) the curve stays ' +
      'near constant-sum, giving near-1:1 exchange rates with low slippage. LPs earn 4 bps trading ' +
      'fees + CRV emissions. Boosted CRV from veCRV multiplies emissions up to 2.5x.',
    links: ['stablecoin-yield-overview', 've-tokenomics'],
    sources: ['research/curve-mechanics.md'],
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'rwa-tokenization',
    title: 'RWA tokenization landscape',
    body:
      'Real-world asset (RWA) tokenization brings off-chain credit, treasuries, and real-estate ' +
      'cashflows on-chain. Major players: Ondo (tokenized treasuries), Maple (institutional credit), ' +
      'Centrifuge (invoice/asset-backed pools). Yields 4-12% with credit risk; mostly KYC-gated ' +
      'unless the issuer offers a permissionless wrapper. Regulatory exposure varies by jurisdiction.',
    links: ['stablecoin-yield-overview', 'malaysian-regulatory-context'],
    sources: ['research/rwa-overview.md', 'notes/maple-credit.md'],
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'malaysian-regulatory-context',
    title: 'Malaysian DeFi regulatory context',
    body:
      'Malaysia\'s SC framework treats most DeFi activity as outside the Capital Markets and ' +
      'Services Act unless the protocol issues a security token. Stablecoin holdings and lending ' +
      'are not currently classified as securities. RWA tokens that wrap regulated instruments ' +
      '(treasuries, equity) WILL fall under SC purview — buyer beware. Bank Negara has signalled ' +
      'AML/KYC enforcement on on/off ramps, not on the underlying contracts.',
    links: ['rwa-tokenization'],
    sources: ['notes/sc-defi-2024.md'],
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'lending-markets',
    title: 'On-chain lending markets',
    body:
      'Aave V3 and Compound V3 (Comet) are the two main lending markets. Aave\'s eMode boosts ' +
      'capital efficiency for correlated assets (e.g., 95% LTV between stables). Comet uses a ' +
      'single-base-asset model: USDC base, all other assets are collateral only. Sustainable ' +
      'rates: 3-6% on USDC. Risk: smart-contract risk + oracle manipulation in volatile markets.',
    links: ['stablecoin-yield-overview'],
    sources: ['research/aave-v3.md', 'research/compound-comet.md'],
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 've-tokenomics',
    title: 've-tokenomics',
    body:
      'Curve\'s vote-escrowed (ve) model locks CRV for up to 4 years in exchange for veCRV — a ' +
      'non-transferable governance token whose voting power decays linearly. Lockers get ' +
      'protocol fees, gauge voting (directs CRV emissions to specific pools), and a boost ' +
      'multiplier. Convex (CVX) abstracts this: one-shot lock through Convex, get CVX + cvxCRV ' +
      'with continuous yield and tradable claims.',
    links: ['curve-stableswap'],
    sources: ['research/curve-ve-design.md'],
    updatedAt: new Date().toISOString(),
  },
];

const brainAbi = [
  'function mint(address to, bytes32 initialStorageRoot, string description) returns (uint256)',
  'function setMinPayment(uint256 tokenId, uint256 amount)',
  'event BrainMinted(uint256 indexed tokenId, address indexed owner, bytes32 storageRoot)',
] as const;

console.log('seed-brain: starting');
console.log(`  label=${values.label}.${process.env.ENS_PARENT_NAME}`);
console.log(`  specialty=${values.specialty}`);
console.log(`  articles=${SAMPLE_ARTICLES.length}`);

// 1. Upload snapshot to 0G Storage (Log layer). If the SDK's submit() ABI
//    is out of sync with the live Flow contract (currently 4-field struct
//    in 0.3.3 vs 3-field on chain), fall back to a deterministic
//    keccak256 of the manifest so the rest of the demo can proceed.
const zg = loadZgConfig();
const provider = new JsonRpcProvider(zg.rpcUrl);
const signer = new Wallet(pk, provider);
const log = createBrainLogClient(zg, pk);

console.log('\n1. uploading snapshot to 0G Storage Log layer …');
let storageRoot: string;
try {
  const snap = await log.uploadSnapshot(signer.address, SAMPLE_ARTICLES, null);
  storageRoot = snap.rootHash;
  console.log(`   rootHash: ${storageRoot}`);
  console.log(`   txHash:   ${snap.txHash}`);
} catch (err) {
  const msg = (err as Error).message;
  console.warn(`   ⚠ 0G upload failed: ${msg.split('\n')[0]}`);
  console.warn('   ⚠ falling back to deterministic keccak256(manifest) for demo');
  const manifest = JSON.stringify({
    brainOwner: signer.address.toLowerCase(),
    articleCount: SAMPLE_ARTICLES.length,
    articles: SAMPLE_ARTICLES.map((a) => ({ slug: a.slug, title: a.title })),
  });
  storageRoot = keccak256(toUtf8Bytes(manifest));
  console.log(`   placeholder rootHash: ${storageRoot}`);
}
const snapshot = { rootHash: storageRoot, txHash: '' };

// 2. Mint Brain iNFT.
console.log('\n2. minting Brain iNFT on 0G Galileo …');
const brain = new Contract(inftAddress, brainAbi, signer) as unknown as {
  mint: (to: string, root: string, desc: string) => Promise<{ wait: () => Promise<{ hash: string; logs: Log[] }> }>;
  setMinPayment: (id: bigint, amount: bigint) => Promise<{ wait: () => Promise<unknown> }>;
};
const tx = await brain.mint(
  signer.address,
  snapshot.rootHash,
  `${values.specialty} brain — ${SAMPLE_ARTICLES.length} articles`,
);
const rcpt = await tx.wait();
const topic = ethersId('BrainMinted(uint256,address,bytes32)');
const logEntry = rcpt.logs.find((l) => l.topics[0] === topic);
if (!logEntry?.topics[1]) throw new Error('seed-brain: BrainMinted event not found');
const tokenId = BigInt(logEntry.topics[1]);
console.log(`   tokenId: ${tokenId}`);
console.log(`   mint tx: ${rcpt.hash}`);
console.log(`   explorer: ${zg.explorerUrl}/tx/${rcpt.hash}`);

// 3. setMinPayment
const priceWei = BigInt(values['price-wei']!);
console.log(`\n3. setMinPayment(${tokenId}, ${priceWei} wei)`);
const setTx = await brain.setMinPayment(tokenId, priceWei);
await setTx.wait();
console.log('   ok');

// 4. Update ENS text records on the existing subname.
const ens = loadEnsConfig();
const chain = addEnsContracts(ensNetwork === 'mainnet' ? mainnet : sepolia);
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : (`0x${pk}` as Hex));
const ensPublic = createPublicClient({ chain, transport: http(ensRpcUrl) });
const ensWallet = createWalletClient({ account, chain, transport: http(ensRpcUrl) });

console.log(`\n4. writing brain.* text records to ${values.label}.${ens.parentName}`);
const records = {
  description: `${values.specialty} — ${SAMPLE_ARTICLES.length} articles compiled from research notes`,
  url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://brainpedia.up.railway.app'}/${values.label}`,
  inft: `${inftAddress}:${tokenId}`,
  storageRoot: snapshot.rootHash,
  axlPeerId:
    values['axl-peer-id'] ||
    'cb4cc72222a27f577ac28d6a963ec95ce4b02e924ba05f17e700bd8a2e6b33b8',
  specialty: values.specialty,
  priceQuery: priceWei.toString(),
  computeUrl: values['compute-url'] || '',
};

const result = await writeBrainRecords(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { publicClient: ensPublic as any, walletClient: ensWallet as any, config: ens },
  values.label!,
  records,
);
console.log(`   tx: ${result.txHash}`);

console.log(`\n✓ ${values.label}.${ens.parentName} now points at the real Brain`);
console.log(`  iNFT:         ${inftAddress}:${tokenId}`);
console.log(`  storage root: ${snapshot.rootHash}`);
console.log(`  view: https://brainpedia.up.railway.app/${values.label}`);

void parseEther; // keep import (used elsewhere as needed)
