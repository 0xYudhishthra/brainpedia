import type { Address } from 'viem';
import { getTextRecord } from '@ensdomains/ensjs/public';
import { BRAIN_TEXT_KEYS, type BrainTextRecords, type ResolvedBrain } from './types.js';
import type { EnsClients } from './client.js';

const STANDARD_KEYS = ['description', 'avatar', 'url'] as const;

/**
 * Read every Brainpedia-relevant text record off an ENS name.
 *
 * No values are baked in — the keys themselves are well-known (defined
 * once in types.ts) and the addresses are looked up at runtime via
 * @ensdomains/ensjs.
 */
export async function readBrainRecords(
  clients: EnsClients,
  ensName: string,
): Promise<BrainTextRecords> {
  const out: BrainTextRecords = {};
  const reads: Array<Promise<void>> = [];

  for (const key of STANDARD_KEYS) {
    reads.push(
      getTextRecord(clients.publicClient, { name: ensName, key }).then((v) => {
        if (v) out[key] = v;
      }),
    );
  }

  reads.push(
    getTextRecord(clients.publicClient, { name: ensName, key: BRAIN_TEXT_KEYS.inft }).then(
      (v) => {
        if (v) out.inft = v;
      },
    ),
    getTextRecord(clients.publicClient, {
      name: ensName,
      key: BRAIN_TEXT_KEYS.storageRoot,
    }).then((v) => {
      if (v) out.storageRoot = v;
    }),
    getTextRecord(clients.publicClient, {
      name: ensName,
      key: BRAIN_TEXT_KEYS.axlPeerId,
    }).then((v) => {
      if (v) out.axlPeerId = v;
    }),
    getTextRecord(clients.publicClient, { name: ensName, key: BRAIN_TEXT_KEYS.specialty }).then(
      (v) => {
        if (v) out.specialty = v;
      },
    ),
    getTextRecord(clients.publicClient, {
      name: ensName,
      key: BRAIN_TEXT_KEYS.priceQuery,
    }).then((v) => {
      if (v) out.priceQuery = v;
    }),
    getTextRecord(clients.publicClient, {
      name: ensName,
      key: BRAIN_TEXT_KEYS.computeUrl,
    }).then((v) => {
      if (v) out.computeUrl = v;
    }),
  );

  await Promise.all(reads);
  return out;
}

export async function resolveBrain(
  clients: EnsClients,
  ensName: string,
): Promise<ResolvedBrain> {
  const records = await readBrainRecords(clients, ensName);
  // owner lookup happens via NameWrapper or Registry — wired Day 3.
  const owner: Address | null = null;
  return { ensName, owner, records };
}

/**
 * Write all Brain text records in a single batched multicall.
 * Day 3 wires this against the Public Resolver's `multicall(setText[])`.
 */
export async function writeBrainRecords(
  _clients: EnsClients,
  _ensName: string,
  _records: BrainTextRecords,
): Promise<{ txHash: `0x${string}` }> {
  throw new Error('writeBrainRecords: not yet implemented (Day 3)');
}
