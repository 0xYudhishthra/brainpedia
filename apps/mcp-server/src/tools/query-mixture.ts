import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * Phase-1 quote of a Mixture-of-Brains query.
 *
 * Calls /api/query?mode=mixture which fans out to the brains in the chosen
 * discovery shortcut, runs them in parallel, and returns a REDACTED response:
 * per-brain metadata (citations, verified flag), the per-brain payment plan
 * (each responder paid its advertised brain.price_query), the
 * RoyaltyDistributor address, and a sessionId. The synthesis + actual
 * per-brain answers are cached server-side but NOT returned — those unlock
 * only after on-chain settlement is verified.
 *
 * The agent (host LLM) is expected to surface the cost to the user, ask for
 * confirmation, then call `settle_mixture` with the returned sessionId to
 * pay + unlock the synthesis. This is the human-in-the-loop pay-to-read gate.
 */
export const queryMixtureTool: Tool = {
  name: 'query_mixture',
  description:
    'PHASE 1 of pay-to-read mixture query. Fans the prompt out to brains in ' +
    'the chosen discovery shortcut (LLM-picked by default), runs them in ' +
    'parallel, returns a payment plan + sessionId. Synthesis is GATED until ' +
    'settlement. After receiving the plan, surface the total cost in OG to ' +
    'the user, ask for explicit confirmation, then call `settle_mixture` ' +
    'with the sessionId to pay + unlock. NEVER call settle_mixture without ' +
    'asking the user — they may not want to pay that price.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: "The user's question." },
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
    },
    required: ['prompt'],
  },
};

const inputSchema = z.object({
  prompt: z.string().min(1),
  topic: z.string().min(1).optional(),
  apiUrl: z.string().url().optional(),
});

export async function handleQueryMixture(args: Record<string, unknown>) {
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    return errorResp(`query_mixture: invalid args — ${parsed.error.message}`);
  }
  const { prompt } = parsed.data;
  const topic = parsed.data.topic ?? 'auto';
  const apiUrl =
    parsed.data.apiUrl ??
    process.env.BRAINPEDIA_API_URL ??
    'https://brainpedia.up.railway.app';

  const queryUrl = `${apiUrl.replace(/\/+$/, '')}/api/query?mode=mixture&topic=${encodeURIComponent(topic)}`;
  let plan: Record<string, unknown>;
  try {
    const r = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return errorResp(`query_mixture: ${queryUrl} failed (${r.status}): ${text.slice(0, 300)}`);
    }
    plan = (await r.json()) as Record<string, unknown>;
  } catch (err) {
    return errorResp(`query_mixture: cannot reach ${queryUrl}: ${(err as Error).message}`);
  }

  // Pass through everything the server returned (status, sessionId, router,
  // payments, totalAmountWei, distributor, redacted brains). Pretty-print so
  // Claude can see the structure clearly when deciding what to ask the user.
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(plan, null, 2) +
          '\n\n---\nNEXT STEP: surface the totalAmountWei (in OG) and per-brain ' +
          'breakdown to the user. If they confirm, call settle_mixture with the ' +
          'sessionId above. If they decline, do nothing — the session expires ' +
          'in 10 min.',
      },
    ],
  };
}

function errorResp(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}
