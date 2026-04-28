import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const setupBrainTool: Tool = {
  name: 'setup_brain',
  description:
    'Bootstrap a new Brain from a local note source (Obsidian vault by default). ' +
    'Reads the vault, asks the host LLM to compile articles, uploads to 0G Storage ' +
    '(KV layer), mints an ERC-7857 iNFT, and registers <name>.<ENS_PARENT_NAME>.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Subname to register (e.g., "yudhi" → yudhi.brainpedia.eth).',
      },
      vaultPath: {
        type: 'string',
        description:
          'Absolute path to an Obsidian vault. Defaults to BRAINPEDIA_DEFAULT_VAULT_PATH env.',
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

export async function handleSetupBrain(args: Record<string, unknown>) {
  // Day 1 — return a structured plan that Claude (the host LLM) will execute step by step.
  // Day 2 wires real implementations from @brainpedia/{obsidian-parser,storage-0g,ens}.
  const plan = {
    steps: [
      'Resolve vault path (arg vaultPath or BRAINPEDIA_DEFAULT_VAULT_PATH)',
      'Parse vault → article graph via @brainpedia/obsidian-parser',
      'Compile clusters into wiki articles (host LLM call)',
      'Upload articles to 0G Storage KV layer via @brainpedia/storage-0g',
      'Snapshot to Log layer → get merkle root',
      'Mint ERC-7857 iNFT pointing at merkle root',
      'Register subname + write text records via @brainpedia/ens',
    ],
    args,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(plan, null, 2),
      },
    ],
  };
}
