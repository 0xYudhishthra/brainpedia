import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  id as ethersId,
  type Log,
} from 'ethers';
import { loadZgConfig } from '@brainpedia/storage-0g';

/**
 * Mixture-of-Brains query + on-chain settlement, in one MCP tool.
 *
 * Calls the web service's /api/query?mode=mixture endpoint to fan the prompt
 * out across the brains in the chosen discovery shortcut (default: `auto` —
 * the LLM router picks the shortcut for the prompt). Receives a
 * citation-weighted payment plan, then settles it in a single tx via
 * RoyaltyDistributor.distribute(tokenIds[], amounts[], reason).
 *
 * The agent's wallet (ZG_WALLET_PRIVATE_KEY) pays the total. Each Brain
 * owner receives their share directly from the contract — Distributed events
 * log the per-recipient amounts.
 */
export const queryMixtureTool: Tool = {
  name: 'query_mixture',
  description:
    'Ask a free-form question to the Brainpedia network. The orchestrator routes ' +
    'across brains (LLM-picked discovery shortcut by default), and each brain ' +
    'answers with citations. The synthesis + per-brain answers are GATED until ' +
    'on-chain settlement: this tool runs the full pay-to-read flow in one shot ' +
    '— phase 1 fetches the redacted plan, the agent\'s wallet settles each ' +
    'brain\'s advertised brain.price_query in a single RoyaltyDistributor.distribute ' +
    'tx, then phase 2 verifies the Distributed events and unlocks the synthesis. ' +
    'Pass skipSettlement=true to preview the plan without paying (synthesis ' +
    'remains gated).',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'The user\'s question.' },
      topic: {
        type: 'string',
        description:
          'Discovery shortcut to fan out to. Defaults to "auto" (the orchestrator ' +
          'LLM picks from the available shortcuts based on the prompt). Use "all" ' +
          'to fan to every Brain, or a specific topic like "research" or "frameworks".',
      },
      apiUrl: {
        type: 'string',
        description:
          'Base URL of the Brainpedia web service. Defaults to ' +
          '$BRAINPEDIA_API_URL or https://brainpedia.up.railway.app.',
      },
      skipSettlement: {
        type: 'boolean',
        description:
          'If true, return the payment plan without sending the on-chain settlement tx. ' +
          'Useful for previewing what the orchestrator would charge before authorising payment.',
      },
    },
    required: ['prompt'],
  },
};

const inputSchema = z.object({
  prompt: z.string().min(1),
  topic: z.string().min(1).optional(),
  apiUrl: z.string().url().optional(),
  skipSettlement: z.boolean().optional(),
});

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
  priceQuery: string | null;
}

interface RouterInfo {
  auto: true;
  reason: string;
  source: 'llm' | 'fallback';
  available: string[];
}

interface MixtureResponse {
  mode: 'mixture';
  status: 'awaiting-payment' | 'paid';
  sessionId: string;
  expiresAt: number;
  topic: string;
  router?: RouterInfo;
  prompt: string;
  transport: 'axl' | 'https';
  brains: BrainResult[];
  synthesis: string;
  payments: PaymentSplit[];
  totalAmountWei: string;
  distributor: string | null;
  settlement?: {
    txHash: string;
    payer: string;
    blockNumber: number;
    explorer: string;
  };
}

const ROYALTY_DISTRIBUTOR_ABI = [
  'function distribute(uint256[] tokenIds, uint256[] amounts, bytes32 reason) payable',
  'event Distributed(uint256 indexed tokenId, address indexed brainOwner, address indexed payer, uint256 amount, bytes32 reason)',
];
const DISTRIBUTED_EVENT_TOPIC = ethersId(
  'Distributed(uint256,address,address,uint256,bytes32)',
);

export async function handleQueryMixture(args: Record<string, unknown>) {
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    return errorResp(`query_mixture: invalid args — ${parsed.error.message}`);
  }
  const { prompt, skipSettlement } = parsed.data;
  const topic = parsed.data.topic ?? 'auto';
  const apiUrl =
    parsed.data.apiUrl ??
    process.env.BRAINPEDIA_API_URL ??
    'https://brainpedia.up.railway.app';

  // PHASE 1: get the payment plan. The /api/query endpoint returns
  // `status: 'awaiting-payment'` with brain metadata + the plan but the
  // actual answers + synthesis are gated server-side until we settle and
  // post the txHash back.
  const queryUrl = `${apiUrl.replace(/\/+$/, '')}/api/query?mode=mixture&topic=${encodeURIComponent(topic)}`;
  let plan: MixtureResponse;
  try {
    const r = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return errorResp(`query_mixture: phase-1 ${queryUrl} failed (${r.status}): ${text.slice(0, 300)}`);
    }
    plan = (await r.json()) as MixtureResponse;
  } catch (err) {
    return errorResp(`query_mixture: phase-1 cannot reach ${queryUrl}: ${(err as Error).message}`);
  }

  if (plan.status !== 'awaiting-payment') {
    return errorResp(`query_mixture: phase-1 returned unexpected status="${plan.status}" — server may be on an older build`);
  }

  // Decide whether to settle.
  const settleable = plan.payments.filter((p) => p.inft && BigInt(p.amountWei) > 0n);
  if (skipSettlement === true) {
    return ok({
      ...summarisePlan(plan),
      synthesis: null,
      brains: redactedBrains(plan),
      settlement: { skipped: true, reason: 'skipSettlement=true; payment plan returned without on-chain tx (synthesis will not be unlocked)' },
    });
  }
  if (settleable.length === 0) {
    return ok({
      ...summarisePlan(plan),
      synthesis: null,
      brains: redactedBrains(plan),
      settlement: { skipped: true, reason: 'no settleable payments (each split needs both an inft text record and a non-zero amountWei)' },
    });
  }
  if (!plan.distributor) {
    return errorResp('query_mixture: phase-1 response has no distributor — server must have ROYALTY_DISTRIBUTOR_ADDRESS set');
  }
  const wallet = process.env.ZG_WALLET_PRIVATE_KEY;
  if (!wallet) {
    return errorResp('query_mixture: ZG_WALLET_PRIVATE_KEY required to settle (or pass skipSettlement=true)');
  }

  // PHASE 1.5: settle on chain.
  let txHash: string;
  let settlementMeta: SettleResult;
  try {
    const settled = await settleOnChain({
      prompt,
      distributor: plan.distributor,
      settleable,
      wallet,
    });
    txHash = settled.txHash as string;
    settlementMeta = settled;
  } catch (err) {
    return errorResp(`query_mixture: settlement tx failed: ${(err as Error).message}`);
  }

  // PHASE 2: claim the synthesis by posting sessionId + txHash. Server
  // verifies the on-chain Distributed events match the cached plan, then
  // releases the cached full response.
  let unlocked: MixtureResponse;
  try {
    const r = await fetch(`${apiUrl.replace(/\/+$/, '')}/api/query?mode=mixture`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: plan.sessionId, txHash }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return errorResp(`query_mixture: phase-2 unlock failed (${r.status}): ${text.slice(0, 300)} — settlement tx ${txHash} may need more confirmations`);
    }
    unlocked = (await r.json()) as MixtureResponse;
  } catch (err) {
    return errorResp(`query_mixture: phase-2 cannot reach unlock endpoint: ${(err as Error).message}`);
  }

  return ok({
    ...summarisePlan(unlocked),
    synthesis: unlocked.synthesis,
    brains: unlocked.brains.map((b) => ({
      brainEnsName: b.brainEnsName,
      ok: b.ok,
      verified: b.verified ?? null,
      answer: b.answer ?? null,
      citations: b.citations ?? [],
      errorMessage: b.errorMessage ?? null,
    })),
    settlement: { ...settlementMeta, ...(unlocked.settlement ?? {}) },
  });
}

function summarisePlan(plan: MixtureResponse) {
  return {
    status: plan.status,
    sessionId: plan.sessionId,
    topic: plan.topic,
    router: plan.router ?? null,
    transport: plan.transport,
    payments: plan.payments,
    totalAmountWei: plan.totalAmountWei,
    distributor: plan.distributor,
  };
}

function redactedBrains(plan: MixtureResponse) {
  return plan.brains.map((b) => ({
    brainEnsName: b.brainEnsName,
    ok: b.ok,
    verified: b.verified ?? null,
    citations: b.citations ?? [],
    errorMessage: b.errorMessage ?? null,
    answer: null,
  }));
}

function ok(body: Record<string, unknown>) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(body, null, 2),
      },
    ],
  };
}

interface SettleResult {
  txHash: string;
  explorer: string;
  totalWei: string;
  distributedCount: number;
  distributed: Array<{ tokenId: string; brainOwner: string }>;
}

async function settleOnChain(opts: {
  prompt: string;
  distributor: string;
  settleable: PaymentSplit[];
  wallet: string;
}): Promise<SettleResult> {
  const zg = loadZgConfig();
  const tokenIds = opts.settleable.map((p) => BigInt(p.inft!.split(':')[1]!));
  const amounts = opts.settleable.map((p) => BigInt(p.amountWei));
  const total = amounts.reduce((acc, a) => acc + a, 0n);
  const reason = ethersId(`mixture:${opts.prompt}`);

  const provider = new JsonRpcProvider(zg.rpcUrl);
  const signer = new Wallet(opts.wallet, provider);
  const distributor = new Contract(
    opts.distributor,
    ROYALTY_DISTRIBUTOR_ABI,
    signer,
  ) as unknown as {
    distribute: (
      tokenIds: bigint[],
      amounts: bigint[],
      reason: string,
      overrides: { value: bigint },
    ) => Promise<{ wait: () => Promise<{ hash: string; logs: Log[] }> }>;
  };

  const tx = await distributor.distribute(tokenIds, amounts, reason, { value: total });
  const rcpt = await tx.wait();
  const events = rcpt.logs.filter((l) => l.topics[0] === DISTRIBUTED_EVENT_TOPIC);

  return {
    txHash: rcpt.hash,
    explorer: `${zg.explorerUrl}/tx/${rcpt.hash}`,
    totalWei: total.toString(),
    distributedCount: events.length,
    distributed: events.map((e) => ({
      tokenId: BigInt(e.topics[1]!).toString(),
      brainOwner: '0x' + (e.topics[2]?.slice(-40) ?? ''),
    })),
  };
}

function errorResp(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}
