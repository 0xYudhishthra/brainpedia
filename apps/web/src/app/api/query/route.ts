import { NextRequest, NextResponse } from 'next/server';
import {
  loadEnsConfig,
  createEnsPublicClient,
  listBrainsForTopic,
  readBrainRecords,
  BRAIN_TEXT_KEYS,
} from '@brainpedia/ens';
import { AxlClient, BRAIN_MCP_SERVICE_NAME, type McpResponse } from '@brainpedia/axl';
import { getTextRecord } from '@ensdomains/ensjs/public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BrainQueryResult {
  answer: string;
  citations: string[];
  confidence: number | null;
  brainEnsName: string;
  storageRoot: string;
  verified: boolean;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: BrainQueryResult;
  error?: { code: number; message: string };
}

interface MixtureBrainResult extends Partial<BrainQueryResult> {
  brainEnsName: string;
  ok: boolean;
  errorMessage?: string;
}

interface PaymentSplit {
  brainEnsName: string;
  inft: string | null;
  brainOwner?: string;
  citationCount: number;
  weight: number; // 0..1, normalised across successful brains
  amountWei: string; // string because uint256 doesn't fit in JS number
  priceQueryWei: string | null;
}

interface MixtureResponse {
  mode: 'mixture';
  topic: string;
  prompt: string;
  /**
   * Underlying transport for each brain call: 'axl' if we routed through the
   * AXL daemon's HTTP API at AXL_API_URL, otherwise 'https' (direct to
   * BRAINPEDIA_BRAIN_URL — the convenience path when the web service isn't
   * co-located with an AXL daemon).
   */
  transport: 'axl' | 'https';
  brains: MixtureBrainResult[];
  synthesis: string;
  /**
   * Per-brain payment shares for an N-brain query, citation-weighted. The
   * orchestrator (or a payment-relayer agent) settles these by calling
   * RoyaltyDistributor.distribute(tokenIds, amounts, reason) on the
   * `distributor` address in one tx — see contracts/src/RoyaltyDistributor.sol.
   */
  payments: PaymentSplit[];
  /** Total wei to be distributed across `payments`, computed from the calling agent's optional `value` (defaults to sum of priceQueryWei across responding brains). */
  totalAmountWei: string;
  /** RoyaltyDistributor contract address on the Brain.sol chain — caller
   *  sends `totalAmountWei` and the same arrays of tokenIds + amounts to
   *  distribute() to settle on chain. Null if the env var isn't set. */
  distributor: string | null;
}

const BRAIN_TIMEOUT_MS = 90_000;

/**
 * Default single-brain proxy. Forwards prompt as JSON-RPC `query` to the
 * brain (over AXL when AXL_API_URL is set, otherwise direct HTTPS to
 * BRAINPEDIA_BRAIN_URL).
 *
 * GET /api/query?mode=mixture&topic=defi
 *   → kicks the multi-brain fan-out path: resolves
 *     `<topic>.discover.<parent>`'s brainpedia.brains text record, calls each
 *     brain in parallel, returns per-brain results + a synthesised summary
 *     line + citation-weighted payment splits ready for on-chain settlement.
 */
export async function POST(req: NextRequest) {
  let body: {
    prompt?: string;
    accessToken?: string;
    agent?: string;
    target?: string;
    mixture?: boolean;
    topic?: string;
    /** Optional total (in wei) to split across responding brains. Defaults to
     *  sum of each brain's brain.price_query text record. */
    valueWei?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const prompt = (body?.prompt ?? '').toString().trim();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const transport = transportPreference();
  if (transport === 'https' && !process.env.BRAINPEDIA_BRAIN_URL) {
    return NextResponse.json(
      { error: 'either AXL_API_URL or BRAINPEDIA_BRAIN_URL must be configured' },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const wantsMixture = body.mixture === true || url.searchParams.get('mode') === 'mixture';
  if (wantsMixture) {
    const topic = (body.topic ?? url.searchParams.get('topic') ?? 'defi').toString();
    return mixtureFanOut(prompt, topic, transport, body.valueWei);
  }

  return singleBrainQuery(prompt, body, transport);
}

function transportPreference(): 'axl' | 'https' {
  return process.env.AXL_API_URL ? 'axl' : 'https';
}

async function singleBrainQuery(
  prompt: string,
  body: { accessToken?: string; agent?: string; target?: string },
  transport: 'axl' | 'https',
): Promise<NextResponse> {
  const result = await callBrain(prompt, {
    target: body.target,
    accessToken: body.accessToken,
    agent: body.agent,
    transport,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.errorMessage, code: result.code },
      { status: 502 },
    );
  }
  return NextResponse.json(result.value, { status: 200 });
}

async function mixtureFanOut(
  prompt: string,
  topic: string,
  transport: 'axl' | 'https',
  valueWei: string | undefined,
): Promise<NextResponse> {
  let brainNames: string[];
  const cfg = loadEnsConfig();
  const ensClient = createEnsPublicClient(cfg);
  try {
    brainNames = await listBrainsForTopic(
      { publicClient: ensClient, config: cfg },
      topic,
    );
  } catch (err) {
    return NextResponse.json(
      { error: `mixture: discovery resolve failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  if (brainNames.length === 0) {
    return NextResponse.json(
      { error: `mixture: no brains registered under ${topic}.discover.<parent>` },
      { status: 404 },
    );
  }

  const settled = await Promise.allSettled(
    brainNames.map((name) => callBrain(prompt, { target: name, transport })),
  );

  const brains: MixtureBrainResult[] = settled.map((s, i) => {
    const name = brainNames[i]!;
    if (s.status === 'rejected') {
      return { brainEnsName: name, ok: false, errorMessage: String(s.reason) };
    }
    const r = s.value;
    if (!r.ok) {
      return { brainEnsName: name, ok: false, errorMessage: r.errorMessage };
    }
    return { ...r.value, ok: true };
  });

  const successful = brains.filter((b) => b.ok);
  const synthesis = successful.length === 0
    ? 'No brain in the discovery shortcut returned a usable answer.'
    : `Synthesised from ${successful.length} brain${successful.length === 1 ? '' : 's'}: `
      + successful.map((b) => `${b.brainEnsName.split('.')[0]} cites [${(b.citations ?? []).join(', ')}]`).join(' · ');

  const payments = await computePayments(
    ensClient,
    cfg,
    successful,
    valueWei,
  );
  const totalAmountWei = payments
    .reduce((acc, p) => acc + BigInt(p.amountWei), 0n)
    .toString();

  const response: MixtureResponse = {
    mode: 'mixture',
    topic,
    prompt,
    transport,
    brains,
    synthesis,
    payments,
    totalAmountWei,
    distributor: process.env.ROYALTY_DISTRIBUTOR_ADDRESS ?? null,
  };
  return NextResponse.json(response, { status: 200 });
}

interface BrainCallSuccess {
  ok: true;
  value: BrainQueryResult;
}
interface BrainCallFailure {
  ok: false;
  errorMessage: string;
  code?: number;
}
type BrainCall = BrainCallSuccess | BrainCallFailure;

async function callBrain(
  prompt: string,
  params: {
    target?: string;
    accessToken?: string;
    agent?: string;
    transport: 'axl' | 'https';
  },
): Promise<BrainCall> {
  const rpcBody = {
    jsonrpc: '2.0' as const,
    id: 1,
    method: 'query',
    params: {
      prompt,
      ...(params.target ? { target: params.target } : {}),
      ...(params.accessToken ? { accessToken: params.accessToken } : {}),
      ...(params.agent ? { agent: params.agent } : {}),
    },
  };

  if (params.transport === 'axl') {
    return callBrainViaAxl(rpcBody, params.target);
  }
  return callBrainViaHttps(rpcBody);
}

async function callBrainViaAxl(
  rpcBody: { jsonrpc: '2.0'; id: number; method: string; params: Record<string, unknown> },
  target: string | undefined,
): Promise<BrainCall> {
  const apiUrl = process.env.AXL_API_URL!;
  // We need the brain's AXL peer id to route through the mesh. Resolve it
  // from the target's brain.axl_peer_id ENS text record. Falls back to
  // AXL_DEFAULT_BRAIN_PEER if target is missing (single-tenant mode).
  let peerId: string | undefined = process.env.AXL_DEFAULT_BRAIN_PEER;
  if (target) {
    try {
      const cfg = loadEnsConfig();
      const ensClient = createEnsPublicClient(cfg);
      const records = await readBrainRecords(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { publicClient: ensClient as any, config: cfg },
        target,
      );
      peerId = records.axlPeerId ?? peerId;
    } catch (err) {
      return { ok: false, errorMessage: `axl: failed to resolve peer for ${target}: ${(err as Error).message}` };
    }
  }
  if (!peerId) {
    return { ok: false, errorMessage: 'axl: no peer id (set AXL_DEFAULT_BRAIN_PEER or use a target with brain.axl_peer_id record)' };
  }

  const client = new AxlClient({ apiUrl, bootstrapPeers: [] });
  let envelope: McpResponse<BrainQueryResult>;
  try {
    envelope = await client.mcp<BrainQueryResult>(peerId, BRAIN_MCP_SERVICE_NAME, rpcBody);
  } catch (err) {
    return { ok: false, errorMessage: `axl unreachable at ${apiUrl}: ${(err as Error).message}` };
  }
  if (envelope.error) {
    return { ok: false, errorMessage: envelope.error.message, code: envelope.error.code };
  }
  if (!envelope.result) {
    return { ok: false, errorMessage: 'axl: brain returned no result' };
  }
  return { ok: true, value: envelope.result };
}

async function callBrainViaHttps(rpcBody: object): Promise<BrainCall> {
  const brainUrl = process.env.BRAINPEDIA_BRAIN_URL!;
  const endpoint = brainUrl.replace(/\/+$/, '') + '/mcp';
  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rpcBody),
      signal: AbortSignal.timeout(BRAIN_TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, errorMessage: `brain unreachable: ${(err as Error).message}` };
  }

  let payload: JsonRpcResponse;
  try {
    payload = (await upstream.json()) as JsonRpcResponse;
  } catch {
    return { ok: false, errorMessage: `brain returned non-JSON (${upstream.status})` };
  }
  if (payload.error) {
    return { ok: false, errorMessage: payload.error.message, code: payload.error.code };
  }
  if (!payload.result) {
    return { ok: false, errorMessage: 'brain returned no result' };
  }
  return { ok: true, value: payload.result };
}

/**
 * Citation-weighted royalty splits. For each successful brain:
 *
 *   weight_i = max(citation_count_i, 1) / Σ max(citation_count, 1)
 *   amount_i = floor(totalAmountWei * weight_i)
 *
 * The "max(_, 1)" floor means a brain that responded but cited nothing still
 * gets a baseline share for showing up — otherwise a brain with cleaner
 * answer-without-citations would get 0, which under-rewards conciseness.
 *
 * If the caller didn't pass valueWei, we default to the sum of each
 * responding brain's brain.price_query text record (so the agent pays exactly
 * what each brain advertised). When prices are missing we fall back to 0 for
 * that brain — the on-chain settlement just won't forward anything for it.
 *
 * The output is *not* settled here; the orchestrator (or a payment-relayer
 * agent with funds) calls RoyaltyDistributor.distribute(tokenIds, amounts)
 * in a single tx to forward shares on chain. Keeping it as a payment plan in
 * the response means the web service doesn't need a hot wallet.
 */
async function computePayments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ensClient: any,
  cfg: ReturnType<typeof loadEnsConfig>,
  successful: MixtureBrainResult[],
  valueWei: string | undefined,
): Promise<PaymentSplit[]> {
  if (successful.length === 0) return [];

  // Resolve brain.inft + brain.price_query for each successful brain in
  // parallel. inft text record format is "<contract>:<tokenId>".
  const enriched = await Promise.all(
    successful.map(async (b) => {
      let inft: string | null = null;
      let priceQueryWei: string | null = null;
      try {
        const records = await readBrainRecords(
          { publicClient: ensClient, config: cfg },
          b.brainEnsName,
        );
        inft = records.inft ?? null;
        priceQueryWei = records.priceQuery ?? null;
      } catch {
        // tolerate ENS read failures — payment plan just won't include this brain
      }
      return { brain: b, inft, priceQueryWei };
    }),
  );

  // Total to split. Caller wins if explicit; otherwise sum of advertised
  // per-query prices.
  let total: bigint;
  if (valueWei) {
    total = BigInt(valueWei);
  } else {
    total = enriched.reduce((acc, e) => acc + BigInt(e.priceQueryWei ?? '0'), 0n);
  }

  const weightOf = (b: MixtureBrainResult) => Math.max((b.citations ?? []).length, 1);
  const weightSum = enriched.reduce((acc, e) => acc + weightOf(e.brain), 0);

  const splits: PaymentSplit[] = enriched.map((e) => {
    const w = weightOf(e.brain);
    const amount = weightSum === 0
      ? 0n
      : (total * BigInt(w * 1_000_000)) / BigInt(weightSum * 1_000_000);
    return {
      brainEnsName: e.brain.brainEnsName,
      inft: e.inft,
      citationCount: (e.brain.citations ?? []).length,
      weight: w / weightSum,
      amountWei: amount.toString(),
      priceQueryWei: e.priceQueryWei,
    };
  });

  // Round-off correction: ensure Σ amountWei == total (avoid losing wei to floor).
  if (splits.length > 0) {
    const summed = splits.reduce((acc, s) => acc + BigInt(s.amountWei), 0n);
    const diff = total - summed;
    if (diff !== 0n) {
      splits[0]!.amountWei = (BigInt(splits[0]!.amountWei) + diff).toString();
    }
  }

  void getTextRecord; // imported for future per-record reads if needed
  void BRAIN_TEXT_KEYS;
  return splits;
}
