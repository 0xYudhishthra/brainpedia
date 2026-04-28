import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  loadZgConfig,
  streamIdForBrain,
  createBrainKvClient,
  createBrainLogClient,
  type ArticleRecord,
} from '@brainpedia/storage-0g';

export const uploadArticlesTool: Tool = {
  name: 'upload_articles',
  description:
    'Upload compiled wiki articles to 0G Storage. Writes each article into the ' +
    "Brain's KV stream (live editable state) and takes a Log-layer snapshot — " +
    'returns the merkle root that should be embedded in the ERC-7857 iNFT.',
  inputSchema: {
    type: 'object',
    properties: {
      brainOwner: {
        type: 'string',
        description: '0x address of the Brain owner (deterministic stream id input).',
      },
      articles: {
        type: 'array',
        description: 'Array of compiled wiki articles.',
        items: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            links: { type: 'array', items: { type: 'string' } },
            sources: { type: 'array', items: { type: 'string' } },
          },
          required: ['slug', 'title', 'body'],
        },
      },
      previousRoot: {
        type: 'string',
        description: 'Optional hex hash of the prior snapshot root (for chained history).',
      },
    },
    required: ['brainOwner', 'articles'],
  },
};

const articleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  body: z.string(),
  links: z.array(z.string()).optional().default([]),
  sources: z.array(z.string()).optional().default([]),
});

const inputSchema = z.object({
  brainOwner: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  articles: z.array(articleSchema).min(1),
  previousRoot: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .nullish(),
});

export async function handleUploadArticles(args: Record<string, unknown>) {
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    return {
      isError: true,
      content: [
        { type: 'text', text: `upload_articles: invalid args — ${parsed.error.message}` },
      ],
    };
  }

  const privateKey = process.env.ZG_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'upload_articles: ZG_WALLET_PRIVATE_KEY env var is required (testnet wallet).',
        },
      ],
    };
  }

  const cfg = loadZgConfig();
  const kv = createBrainKvClient(cfg, privateKey);
  const log = createBrainLogClient(cfg, privateKey);
  const streamId = streamIdForBrain(parsed.data.brainOwner);

  const now = new Date().toISOString();
  const articles: ArticleRecord[] = parsed.data.articles.map((a) => ({
    ...a,
    links: a.links ?? [],
    sources: a.sources ?? [],
    updatedAt: now,
  }));

  // Write each article to KV (so live edits work), then snapshot the whole set to Log.
  const kvResults: Array<{ slug: string; txHash: string }> = [];
  for (const article of articles) {
    const { txHash } = await kv.putArticle(streamId, article);
    kvResults.push({ slug: article.slug, txHash });
  }

  const snapshot = await log.uploadSnapshot(
    parsed.data.brainOwner,
    articles,
    parsed.data.previousRoot ?? null,
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            streamId,
            snapshot: {
              rootHash: snapshot.rootHash,
              txHash: snapshot.txHash,
              articleCount: snapshot.manifest.articleCount,
              createdAt: snapshot.manifest.createdAt,
            },
            kvWrites: kvResults,
            nextSteps: [
              `Mint a Brain iNFT with initialStorageRoot=${snapshot.rootHash}`,
              `Register the ENS subname and set brain.storage_root=${snapshot.rootHash}`,
              'Call finalize_brain to do both in one shot.',
            ],
          },
          null,
          2,
        ),
      },
    ],
  };
}
