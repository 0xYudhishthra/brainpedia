/**
 * Verify that a RoyaltyDistributor settlement tx covers a previously-issued
 * mixture payment plan. Used by the phase-2 unlock path: agent settles, then
 * posts the tx hash; we read the receipt, decode Distributed events, and
 * confirm each (tokenId, amount) pair from the plan was paid.
 */
import { createPublicClient, http, keccak256, toBytes, type Hex } from 'viem';
import { loadZgConfig } from '@brainpedia/storage-0g';

// Distributed(uint256,address,address,uint256,bytes32) — selector for the
// log topic[0]. Indexed: tokenId, brainOwner, payer. Non-indexed: amount, reason.
const DISTRIBUTED_EVENT_TOPIC = keccak256(
  toBytes('Distributed(uint256,address,address,uint256,bytes32)'),
);

export interface VerifyArgs {
  txHash: string;
  expectedDistributor: string;
  expectedSplits: Array<{ inft: string | null; amountWei: string }>;
}

export type VerifyResult =
  | { ok: true; payer: string; blockNumber: number }
  | { ok: false; reason: string };

export async function verifySettlement(args: VerifyArgs): Promise<VerifyResult> {
  if (!/^0x[a-fA-F0-9]{64}$/.test(args.txHash)) {
    return { ok: false, reason: 'malformed txHash' };
  }
  const zg = loadZgConfig();
  const client = createPublicClient({ transport: http(zg.rpcUrl) });

  // 0G mainnet has a noticeable submit→receipt latency. A single
  // getTransactionReceipt right after settle_mixture broadcasts the tx
  // races the chain and 402s even though the payment landed. Poll for up
  // to ~45s before giving up so the unlock succeeds on the first settle.
  let receipt;
  const deadline = Date.now() + 150_000;
  while (true) {
    try {
      receipt = await client.getTransactionReceipt({ hash: args.txHash as Hex });
      break;
    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (/not found|not be found/i.test(msg)) {
        if (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 3_000));
          continue;
        }
        return { ok: false, reason: 'tx not yet confirmed (or unknown)' };
      }
      return { ok: false, reason: `rpc error: ${msg}` };
    }
  }
  if (receipt.status !== 'success') {
    return { ok: false, reason: `tx reverted (status=${receipt.status})` };
  }
  const to = (receipt.to ?? '').toLowerCase();
  if (to !== args.expectedDistributor.toLowerCase()) {
    return {
      ok: false,
      reason: `tx to ${to} does not match RoyaltyDistributor ${args.expectedDistributor.toLowerCase()}`,
    };
  }

  // Decode Distributed events. amount is the first non-indexed param, lives
  // in data[0:32].
  const paid = new Map<string, bigint>();
  let payer = '';
  for (const log of receipt.logs) {
    if (log.topics[0] !== DISTRIBUTED_EVENT_TOPIC) continue;
    const tokenIdTopic = log.topics[1];
    if (!tokenIdTopic) continue;
    const tokenId = BigInt(tokenIdTopic).toString();
    const amount = BigInt('0x' + log.data.slice(2, 66));
    paid.set(tokenId, (paid.get(tokenId) ?? 0n) + amount);
    if (!payer && log.topics[3]) {
      payer = '0x' + log.topics[3].slice(-40);
    }
  }

  for (const split of args.expectedSplits) {
    if (!split.inft) continue;
    const owed = BigInt(split.amountWei);
    if (owed === 0n) continue;
    const tokenId = split.inft.split(':')[1];
    if (!tokenId) continue;
    const got = paid.get(tokenId) ?? 0n;
    if (got < owed) {
      return {
        ok: false,
        reason: `tokenId ${tokenId} underpaid: owed ${owed} wei, paid ${got} wei`,
      };
    }
  }

  return { ok: true, payer, blockNumber: Number(receipt.blockNumber) };
}
