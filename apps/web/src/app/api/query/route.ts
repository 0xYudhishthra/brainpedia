import { NextRequest, NextResponse } from 'next/server';
import {
  loadEnsConfig,
  createEnsPublicClient,
  listBrainsForTopic,
} from '@brainpedia/ens';

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

interface MixtureResponse {
  mode: 'mixture';
  topic: string;
  prompt: string;
  brains: MixtureBrainResult[];
  synthesis: string;
}

const BRAIN_TIMEOUT_MS = 90_000;

/**
 * Default single-brain proxy. Forwards prompt as JSON-RPC `query` to the
 * Railway brain and returns the raw BrainQueryResult.
 *
 * GET /api/query?mode=mixture&topic=defi
 *   → kicks the multi-brain fan-out path: resolves
 *     `<topic>.discover.<parent>`'s brainpedia.brains text record, calls each
 *     brain in parallel through the same brain service (via target=ensName),
 *     returns per-brain results + a synthesised summary line.
 */
export async function POST(req: NextRequest) {
  const brainUrl = process.env.BRAINPEDIA_BRAIN_URL;
  if (!brainUrl) {
    return NextResponse.json(
      { error: 'BRAINPEDIA_BRAIN_URL is not configured on the web server' },
      { status: 503 },
    );
  }

  let body: {
    prompt?: string;
    accessToken?: string;
    agent?: string;
    target?: string;
    mixture?: boolean;
    topic?: string;
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

  // Mixture mode lets one query fan out to every Brain registered under a
  // discovery shortcut. The brain handler is multi-tenant when the request
  // includes `target`, so a single Railway service can act as N specialty
  // brains in parallel.
  const url = new URL(req.url);
  const wantsMixture = body.mixture === true || url.searchParams.get('mode') === 'mixture';
  if (wantsMixture) {
    const topic = (body.topic ?? url.searchParams.get('topic') ?? 'defi').toString();
    return mixtureFanOut(brainUrl, prompt, topic);
  }

  return singleBrainQuery(brainUrl, prompt, body);
}

async function singleBrainQuery(
  brainUrl: string,
  prompt: string,
  body: { accessToken?: string; agent?: string; target?: string },
): Promise<NextResponse> {
  const result = await callBrain(brainUrl, prompt, {
    target: body.target,
    accessToken: body.accessToken,
    agent: body.agent,
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
  brainUrl: string,
  prompt: string,
  topic: string,
): Promise<NextResponse> {
  let brainNames: string[];
  try {
    const cfg = loadEnsConfig();
    const client = createEnsPublicClient(cfg);
    brainNames = await listBrainsForTopic(
      { publicClient: client, config: cfg },
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
    brainNames.map((name) => callBrain(brainUrl, prompt, { target: name })),
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

  const response: MixtureResponse = {
    mode: 'mixture',
    topic,
    prompt,
    brains,
    synthesis,
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
  brainUrl: string,
  prompt: string,
  params: { target?: string; accessToken?: string; agent?: string },
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
