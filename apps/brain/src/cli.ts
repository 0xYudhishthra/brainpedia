#!/usr/bin/env node
import { startBrainServer } from './server.js';

function must(name: string): string {
  const v = process.env[name];
  if (!v) {
    // eslint-disable-next-line no-console
    console.error(`brain: missing required env var ${name}`);
    process.exit(1);
  }
  return v;
}

const opts = {
  port: Number(process.env.BRAIN_PORT ?? 7100),
  routerUrl: process.env.BRAIN_ROUTER_URL ?? 'http://127.0.0.1:9003',
  serviceName: process.env.BRAIN_SERVICE_NAME ?? 'brainpedia.brain',
  signerPrivateKey: must('ZG_WALLET_PRIVATE_KEY'),
  ensName: must('BRAIN_ENS_NAME'),
  storageRoot: must('BRAIN_STORAGE_ROOT'),
  specialty: must('BRAIN_SPECIALTY'),
  topK: Number(process.env.BRAIN_TOP_K ?? 4),
  enforceAccessTokens: process.env.BRAIN_ENFORCE_ACCESS_TOKENS !== 'false',
};

await startBrainServer(opts);
