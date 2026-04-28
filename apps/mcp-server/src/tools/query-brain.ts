import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const queryBrainTool: Tool = {
  name: 'query_brain',
  description:
    'Query a remote Brain (or run a Mixture-of-Brains query through an orchestrator). ' +
    'Resolves the target Brain via ENS, calls authorizeUsage on its iNFT, then sends ' +
    'the prompt over AXL via POST /mcp/{peer_id}/query.',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description:
          'Either a single Brain ENS name (e.g., "defi.brainpedia.eth") or a topic ' +
          'shortcut ("defi.discover.brainpedia.eth") to fan out to multiple Brains.',
      },
      prompt: {
        type: 'string',
        description: 'The user\'s question.',
      },
    },
    required: ['target', 'prompt'],
  },
};

export async function handleQueryBrain(args: Record<string, unknown>) {
  return {
    content: [
      {
        type: 'text',
        text: `query_brain — pending implementation. args: ${JSON.stringify(args)}`,
      },
    ],
  };
}
