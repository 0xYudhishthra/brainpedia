import { getTextRecord } from '@ensdomains/ensjs/public';
import type { EnsClients } from './client.js';
import { resolveBrain } from './text-records.js';
import type { ResolvedBrain } from './types.js';

/** Text record key on the discovery shortcut whose value is a list of brain ENS names. */
export const DISCOVERY_BRAINS_KEY = 'brainpedia.brains';

/**
 * Topic discovery — `<topic>.discover.<parentName>` resolves (via a curated
 * text record list, or a content hash) to a list of Brain ENS names.
 *
 * Example: `defi.discover.brainpedia.eth` → ["yudhi.brainpedia.eth",
 *                                             "vitalik.brainpedia.eth", ...]
 *
 * For the demo this list lives in the Brain's text record `brainpedia.brains`
 * on the discovery shortcut — easy to update without redeploying.
 */
export function discoveryNameForTopic(topic: string, parentName: string): string {
  const safe = topic.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `${safe}.discover.${parentName}`;
}

/**
 * Read the list of brain ENS names from a discovery shortcut's text record.
 * Splits on newlines and commas, trims, and dedupes. Returns [] on miss.
 */
export async function listBrainsForTopic(
  clients: EnsClients,
  topic: string,
): Promise<string[]> {
  const shortcut = discoveryNameForTopic(topic, clients.config.parentName);
  // ensjs typing for getTextRecord wants ClientWithEns; our EnsPublicClient is the
  // intersection but the action's generic is fussy — cast at the call site only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await getTextRecord(clients.publicClient as any, {
    name: shortcut,
    key: DISCOVERY_BRAINS_KEY,
  });
  if (!raw) return [];
  const names = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(names));
}

/**
 * Resolve a topic shortcut to a list of fully-resolved Brains.
 * Reads the `brainpedia.brains` text record on the shortcut and parallel-
 * resolves each name's records.
 */
export async function discoverBrains(
  clients: EnsClients,
  topic: string,
): Promise<ResolvedBrain[]> {
  const names = await listBrainsForTopic(clients, topic);
  if (names.length === 0) return [];
  const resolved = await Promise.all(
    names.map((name) =>
      resolveBrain(clients, name).catch(() => ({
        ensName: name,
        owner: null,
        records: {},
      })),
    ),
  );
  return resolved;
}
