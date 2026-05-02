import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readVault, readVaultFromRest, buildGraph } from '@brainpedia/obsidian-parser';

export const setupBrainTool: Tool = {
  name: 'setup_brain',
  description:
    'Bootstrap a new Brain from a local note source (Obsidian vault). Two modes: ' +
    '(1) filesystem read via vaultPath / BRAINPEDIA_DEFAULT_VAULT_PATH, ' +
    "(2) Obsidian Local REST API plugin via OBSIDIAN_REST_API_URL + OBSIDIAN_REST_API_KEY (no path needed; the user's running Obsidian instance is the source). " +
    'Returns a parsed article graph for the host LLM to compile. ' +
    'After compilation the host LLM should call upload_articles to push to 0G ' +
    'Storage and finalize_brain to mint the iNFT and register the ENS subname.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Subname to register (e.g., "yudhi" → yudhi.<ENS_PARENT_NAME>).',
      },
      vaultPath: {
        type: 'string',
        description:
          'Absolute path to an Obsidian vault. Defaults to BRAINPEDIA_DEFAULT_VAULT_PATH env. ' +
          'Mutually exclusive with vaultUrl — pick one.',
      },
      vaultUrl: {
        type: 'string',
        description:
          "Local REST API plugin URL (default http://localhost:27123). Used together with the OBSIDIAN_REST_API_KEY env var. Reads from the user's running Obsidian instance — no filesystem path needed.",
      },
      specialty: {
        type: 'string',
        description: 'One-line specialty (used as ENS text record brain.specialty).',
      },
      pricePerQuery: {
        type: 'string',
        description: 'Price per query in wei (used as ENS text record brain.price_query).',
      },
    },
    required: ['name'],
  },
};

const inputSchema = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i, 'must be alphanumeric + dashes'),
  vaultPath: z.string().optional(),
  vaultUrl: z.string().url().optional(),
  specialty: z.string().optional(),
  pricePerQuery: z.string().optional(),
});

export async function handleSetupBrain(args: Record<string, unknown>) {
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    return {
      isError: true,
      content: [
        { type: 'text', text: `setup_brain: invalid args — ${parsed.error.message}` },
      ],
    };
  }

  // Pick the source. REST API takes precedence if either vaultUrl arg or
  // OBSIDIAN_REST_API_KEY env is set — that path is the most demo-friendly
  // (no filesystem coupling, the user's Obsidian instance is the source).
  // Otherwise fall back to FS read via vaultPath / BRAINPEDIA_DEFAULT_VAULT_PATH.
  const restUrl = parsed.data.vaultUrl ?? process.env.OBSIDIAN_REST_API_URL;
  const restKey = process.env.OBSIDIAN_REST_API_KEY;
  const vaultPath = parsed.data.vaultPath ?? process.env.BRAINPEDIA_DEFAULT_VAULT_PATH;

  let notes: Awaited<ReturnType<typeof readVault>>;
  let source: { kind: 'fs'; path: string } | { kind: 'rest'; baseUrl: string };
  if (restKey) {
    const baseUrl = restUrl ?? 'http://localhost:27123';
    notes = await readVaultFromRest({ baseUrl, apiKey: restKey });
    source = { kind: 'rest', baseUrl };
  } else if (vaultPath) {
    notes = await readVault(vaultPath);
    source = { kind: 'fs', path: vaultPath };
  } else {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text:
            'setup_brain: no source configured. Pass vaultPath OR set BRAINPEDIA_DEFAULT_VAULT_PATH ' +
            '(filesystem mode), or pass vaultUrl + set OBSIDIAN_REST_API_KEY (Local REST API plugin mode).',
        },
      ],
    };
  }

  const graph = buildGraph(notes);

  const summary = {
    name: parsed.data.name,
    specialty: parsed.data.specialty ?? null,
    pricePerQuery: parsed.data.pricePerQuery ?? null,
    vault: {
      source,
      noteCount: notes.length,
      tagCount: countUnique(notes.flatMap((n) => n.tags)),
      linkCount: notes.reduce((acc, n) => acc + n.links.length, 0),
    },
    notes: notes.slice(0, 50).map((n) => ({
      slug: n.slug,
      title: n.title,
      tags: n.tags,
      links: n.links,
    })),
    truncated: notes.length > 50,
    nextSteps: [
      'Read the notes you need from the slugs above (use the slug to derive the path).',
      'Cluster related notes and write a wiki article per cluster (entity / concept / comparison).',
      'Call upload_articles with the compiled list to push them to 0G Storage.',
      'Call finalize_brain when ready to snapshot, mint the iNFT, and register the ENS subname.',
    ],
  };
  // graph not exposed in summary to keep payload small; available on demand.
  void graph;

  return {
    content: [
      { type: 'text', text: JSON.stringify(summary, null, 2) },
    ],
  };
}

function countUnique<T>(xs: T[]): number {
  return new Set(xs).size;
}
