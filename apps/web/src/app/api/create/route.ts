/**
 * POST /api/create
 *
 * Server-side end of the web mint flow. Accepts a multipart upload of mixed
 * knowledge files, runs them through @brainpedia/knowledge-compiler to produce
 * a Karpathy-style wiki, then uploads the snapshot to 0G Storage via the
 * existing @brainpedia/storage-0g log client. Returns the resulting
 * rootHash + a summary the client uses to:
 *   1. Display the compiled article list as a preview
 *   2. Call BrainMinter.mintToSender(rootHash, ...) from the user's wallet
 *
 * The server signs the storage upload tx with ZG_WALLET_PRIVATE_KEY. The
 * Brain iNFT itself is minted by the user's wallet on the client side, so
 * the iNFT owner is always the connected user, never the server.
 */
import { NextResponse } from 'next/server';
import {
  compileKnowledge,
  createComputeCompiler,
  deterministicCompiler,
} from '@brainpedia/knowledge-compiler';
import { createBrainLogClient, loadZgConfig } from '@brainpedia/storage-0g';
import { isAddress } from 'viem';

// Storage upload + extraction can be slow; bump runtime.
export const maxDuration = 120;
export const runtime = 'nodejs';

interface ResponsePayload {
  ok: boolean;
  rootHash?: `0x${string}`;
  articleCount?: number;
  articles?: Array<{
    slug: string;
    title: string;
    linkCount: number;
    bodyChars: number;
    sources: string[];
  }>;
  formatBreakdown?: Record<string, number>;
  unsupported?: Array<{ path: string; reason: string }>;
  failed?: Array<{ path: string; error: string }>;
  storageUploadTx?: string;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const ownerRaw = form.get('owner');
    if (typeof ownerRaw !== 'string' || !isAddress(ownerRaw)) {
      return NextResponse.json<ResponsePayload>(
        { ok: false, error: 'Missing or invalid "owner" address.' },
        { status: 400 },
      );
    }
    const owner = ownerRaw as `0x${string}`;

    const fileEntries = form.getAll('files').filter((f): f is File => f instanceof File);
    if (fileEntries.length === 0) {
      return NextResponse.json<ResponsePayload>(
        { ok: false, error: 'No files uploaded.' },
        { status: 400 },
      );
    }

    // Cap total payload to avoid runaway uploads.
    const TOTAL_LIMIT = 25 * 1024 * 1024; // 25 MB
    let totalBytes = 0;
    const inputFiles = [];
    for (const file of fileEntries) {
      totalBytes += file.size;
      if (totalBytes > TOTAL_LIMIT) {
        return NextResponse.json<ResponsePayload>(
          { ok: false, error: `Total upload exceeds ${TOTAL_LIMIT} bytes.` },
          { status: 413 },
        );
      }
      const buf = new Uint8Array(await file.arrayBuffer());
      inputFiles.push({
        path: file.name,
        bytes: buf,
        mimeType: file.type || undefined,
      });
    }

    // Compiler backend: deterministic by default. Set ?compile=tee to use
    // 0G Compute TEE-attested inference for each article rewrite. The TEE
    // path is slower and costs broker credits per article, but produces a
    // Karpathy-style wiki with LLM-generated cross-references and emits a
    // TEE attestation for every article (creation-time provenance).
    const url = new URL(req.url);
    const compileMode = url.searchParams.get('compile') ?? 'deterministic';
    let compiler = deterministicCompiler;
    if (compileMode === 'tee' || compileMode === 'compute' || compileMode === '0g') {
      try {
        compiler = createComputeCompiler();
      } catch (err) {
        return NextResponse.json<ResponsePayload>(
          {
            ok: false,
            error: `TEE compile backend unavailable: ${err instanceof Error ? err.message : String(err)}`,
          },
          { status: 500 },
        );
      }
    }

    const compiled = await compileKnowledge(inputFiles, { compiler });
    if (compiled.articles.length === 0) {
      return NextResponse.json<ResponsePayload>(
        {
          ok: false,
          error:
            'No articles were produced. Upload markdown, plain text, PDF, or DOCX files with some real content.',
          unsupported: compiled.unsupported,
          failed: compiled.failed,
        },
        { status: 422 },
      );
    }

    const signerKey = process.env.ZG_WALLET_PRIVATE_KEY;
    if (!signerKey) {
      return NextResponse.json<ResponsePayload>(
        {
          ok: false,
          error: 'Server is missing ZG_WALLET_PRIVATE_KEY; storage upload disabled.',
        },
        { status: 500 },
      );
    }

    const zgConfig = loadZgConfig();
    const logClient = createBrainLogClient(zgConfig, signerKey);
    const articleRecords = compiled.articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      body: a.body,
      links: a.links,
      sources: a.sources,
      updatedAt: a.updatedAt,
    }));

    const snapshot = await logClient.uploadSnapshot(owner, articleRecords, null);

    return NextResponse.json<ResponsePayload>({
      ok: true,
      rootHash: snapshot.rootHash as `0x${string}`,
      articleCount: compiled.articles.length,
      articles: compiled.articles.map((a) => ({
        slug: a.slug,
        title: a.title,
        linkCount: a.links.length,
        bodyChars: a.body.length,
        sources: a.sources,
      })),
      formatBreakdown: compiled.formatBreakdown,
      unsupported: compiled.unsupported,
      failed: compiled.failed,
      storageUploadTx: snapshot.txHash,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/create] error:', err);
    return NextResponse.json<ResponsePayload>(
      { ok: false, error: msg },
      { status: 500 },
    );
  }
}
