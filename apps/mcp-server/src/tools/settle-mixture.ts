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
 * Phase 1.5 + Phase 2 of the pay-to-read mixture flow.
 *
 * Takes a sessionId returned by `query_mixture`, looks up the cached payment
 * plan from /api/query?mode=mixture&peek=true (or just trusts the agent to
 * also pass the explicit splits — see args), settles the plan in one
 * RoyaltyDistributor.distribute tx using the agent's wallet, then posts
 * `{sessionId, txHash}` back to /api/query?mode=mixture which verifies the
 * Distributed events match the cached plan and releases the synthesis +
 * full per-brain answers.
 *
 * The agent is REQUIRED to ask the user for confirmation before calling this
 * tool — see the matching warning in `query_mixture`.
 */
export const settleMixtureTool: Tool = {
  name: 'settle_mixture',
  description:
    'PHASE 2 of pay-to-read mixture query. Settles the payment plan returned ' +
    'by query_mixture in a single RoyaltyDistributor.distribute tx, then ' +
    'unlocks the cached synthesis. Only call this AFTER the user has ' +
    'explicitly confirmed they want to pay the total OG amount shown in the ' +
    "phase-1 plan. The agent's wallet (ZG_WALLET_PRIVATE_KEY) signs and pays.",
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Opaque session handle returned by query_mixture (e.g. "mix_abc...").',
      },
      payments: {
        type: 'array',
        description:
          'The payments[] array from the query_mixture response. Each item ' +
          'must include `inft` (format "<addr>:<tokenId>") and `amountWei`. ' +
          'Used to construct the RoyaltyDistributor.distribute(tokenIds, amounts) call.',
        items: {
          type: 'object',
          properties: {
            inft: { type: ['string', 'null'] },
            amountWei: { type: 'string' },
          },
          required: ['inft', 'amountWei'],
        },
      },
      distributor: {
        type: 'string',
        description:
          'RoyaltyDistributor contract address from the query_mixture response. ' +
          'Used as the tx target.',
      },
      reason: {
        type: 'string',
        description:
          "Optional human-readable settlement reason (turned into the tx's ".concat(
            'bytes32 reason via keccak256). Defaults to "mixture-settle".',
          ),
      },
      apiUrl: {
        type: 'string',
        description:
          'Base URL of the Brainpedia web service. Defaults to ' +
          '$BRAINPEDIA_API_URL or https://brainpedia.up.railway.app.',
      },
    },
    required: ['sessionId', 'payments', 'distributor'],
  },
};

const inputSchema = z.object({
  sessionId: z.string().min(1),
  payments: z
    .array(
      z.object({
        inft: z.string().nullable(),
        amountWei: z.string().regex(/^\d+$/),
      }),
    )
    .min(1),
  distributor: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  reason: z.string().optional(),
  apiUrl: z.string().url().optional(),
});

const ROYALTY_DISTRIBUTOR_ABI = [
  'function distribute(uint256[] tokenIds, uint256[] amounts, bytes32 reason) payable',
  'event Distributed(uint256 indexed tokenId, address indexed brainOwner, address indexed payer, uint256 amount, bytes32 reason)',
];
const DISTRIBUTED_EVENT_TOPIC = ethersId(
  'Distributed(uint256,address,address,uint256,bytes32)',
);

export async function handleSettleMixture(args: Record<string, unknown>) {
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    return errorResp(`settle_mixture: invalid args — ${parsed.error.message}`);
  }
  const { sessionId, distributor } = parsed.data;
  const apiUrl =
    parsed.data.apiUrl ??
    process.env.BRAINPEDIA_API_URL ??
    'https://brainpedia.up.railway.app';
  const wallet = process.env.ZG_WALLET_PRIVATE_KEY;
  if (!wallet) {
    return errorResp('settle_mixture: ZG_WALLET_PRIVATE_KEY required to sign settlement tx');
  }

  const settleable = parsed.data.payments.filter(
    (p) => p.inft && BigInt(p.amountWei) > 0n,
  );
  if (settleable.length === 0) {
    return errorResp('settle_mixture: no settleable payments (each split needs both an inft and a non-zero amountWei)');
  }

  // Settle on chain.
  const zg = loadZgConfig();
  const tokenIds = settleable.map((p) => BigInt(p.inft!.split(':')[1]!));
  const amounts = settleable.map((p) => BigInt(p.amountWei));
  const total = amounts.reduce((acc, a) => acc + a, 0n);
  const reasonHash = ethersId(parsed.data.reason ?? `mixture-settle:${sessionId}`);

  let txHash: string;
  let distributedEvents: Array<{ tokenId: string; brainOwner: string }>;
  try {
    const provider = new JsonRpcProvider(zg.rpcUrl);
    const signer = new Wallet(wallet, provider);
    const contract = new Contract(distributor, ROYALTY_DISTRIBUTOR_ABI, signer) as unknown as {
      distribute: (
        tokenIds: bigint[],
        amounts: bigint[],
        reason: string,
        overrides: { value: bigint },
      ) => Promise<{ wait: () => Promise<{ hash: string; logs: Log[] }> }>;
    };
    const tx = await contract.distribute(tokenIds, amounts, reasonHash, { value: total });
    const rcpt = await tx.wait();
    txHash = rcpt.hash;
    distributedEvents = rcpt.logs
      .filter((l) => l.topics[0] === DISTRIBUTED_EVENT_TOPIC)
      .map((e) => ({
        tokenId: BigInt(e.topics[1]!).toString(),
        brainOwner: '0x' + (e.topics[2]?.slice(-40) ?? ''),
      }));
  } catch (err) {
    return errorResp(`settle_mixture: settlement tx failed: ${(err as Error).message}`);
  }

  // Phase-2 unlock.
  let unlocked: Record<string, unknown>;
  try {
    const r = await fetch(`${apiUrl.replace(/\/+$/, '')}/api/query?mode=mixture`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, txHash }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return errorResp(
        `settle_mixture: settlement tx ${txHash} succeeded but unlock failed (${r.status}): ${text.slice(0, 300)}`,
      );
    }
    unlocked = (await r.json()) as Record<string, unknown>;
  } catch (err) {
    return errorResp(`settle_mixture: settlement tx ${txHash} succeeded but cannot reach unlock endpoint: ${(err as Error).message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            settlement: {
              txHash,
              explorer: `${zg.explorerUrl}/tx/${txHash}`,
              totalWei: total.toString(),
              totalOg: weiToOg(total),
              distributedCount: distributedEvents.length,
              distributed: distributedEvents,
            },
            unlocked,
          },
          null,
          2,
        ),
      },
    ],
  };
}

function weiToOg(wei: bigint): string {
  const ether = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (frac === 0n) return `${ether} OG`;
  const fracStr = frac.toString().padStart(18, '0').replace(/0+$/, '');
  return `${ether}.${fracStr} OG`;
}

function errorResp(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}
