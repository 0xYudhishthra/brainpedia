import type { EnsClients } from './client.js';
import { resolveBrain } from './text-records.js';
import type { ResolvedBrain } from './types.js';

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
 * Resolve a topic shortcut to a list of fully-resolved Brains.
 *
 * Day 3 reads the `brainpedia.brains` text record (newline- or
 * comma-separated list of ENS names) and parallel-resolves each.
 */
export async function discoverBrains(
  clients: EnsClients,
  topic: string,
): Promise<ResolvedBrain[]> {
  const _shortcut = discoveryNameForTopic(topic, clients.config.parentName);
  // Day 3: read text record, split into names, Promise.all(resolveBrain(...))
  void _shortcut;
  void resolveBrain;
  return [];
}
