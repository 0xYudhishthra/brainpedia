import { NextRequest, NextResponse } from 'next/server';

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

/**
 * Proxies prompts from the web app to the Brain MCP server.
 * The Brain URL is read from BRAINPEDIA_BRAIN_URL (Railway var) so we don't
 * hardcode it. The route forwards the prompt as JSON-RPC `query` and returns
 * the raw BrainQueryResult to the client.
 */
export async function POST(req: NextRequest) {
  const brainUrl = process.env.BRAINPEDIA_BRAIN_URL;
  if (!brainUrl) {
    return NextResponse.json(
      { error: 'BRAINPEDIA_BRAIN_URL is not configured on the web server' },
      { status: 503 },
    );
  }

  let body: { prompt?: string; accessToken?: string; agent?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const prompt = (body?.prompt ?? '').toString().trim();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const rpcBody = {
    jsonrpc: '2.0' as const,
    id: 1,
    method: 'query',
    params: {
      prompt,
      ...(body.accessToken ? { accessToken: body.accessToken } : {}),
      ...(body.agent ? { agent: body.agent } : {}),
    },
  };

  const endpoint = brainUrl.replace(/\/+$/, '') + '/mcp';
  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rpcBody),
      // Brain inference can take a while (storage fetch + 0G compute).
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `brain unreachable: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  let payload: JsonRpcResponse;
  try {
    payload = (await upstream.json()) as JsonRpcResponse;
  } catch {
    return NextResponse.json(
      { error: `brain returned non-JSON (${upstream.status})` },
      { status: 502 },
    );
  }

  if (payload.error) {
    return NextResponse.json(
      { error: payload.error.message, code: payload.error.code },
      { status: 502 },
    );
  }
  if (!payload.result) {
    return NextResponse.json({ error: 'brain returned no result' }, { status: 502 });
  }

  return NextResponse.json(payload.result, { status: 200 });
}
