#!/usr/bin/env bun
/**
 * Sanity check that all 4 Brainpedia contracts are verified on
 * chainscan.0g.ai. Hits the public chainscan API for each contract and
 * prints the verify object, including the on-disk source code length
 * and the exactMatch flag.
 *
 * Use this if the chainscan SPA at /address/{addr} appears to not show
 * the source tab — the backend has the source even if the frontend is
 * being slow or odd.
 *
 * Usage:
 *
 *   bun scripts/setup/verify-contracts-on-chainscan.ts
 *
 * Or pipe through `jq` for the full source payload:
 *
 *   curl -s https://chainscan.0g.ai/v1/contract/<addr> | jq .result.verify
 */

const CONTRACTS = [
  { name: 'Brain', address: '0x4E5c6DC869F9B3220F01de9047031cEd1577b08F' },
  { name: 'BrainOracle', address: '0x923A0b7f21c57d92BFa8AA6721b574f47Fe5C5C0' },
  { name: 'BrainMinter', address: '0x3e7D22150d6b883a89703d760d66743D2223456b' },
  { name: 'RoyaltyDistributor', address: '0x7F26DeDe0c5E1Db844c9A8138C21cA3439B63C49' },
];

interface VerifyResponse {
  status: string;
  message: string;
  result: {
    verify?: {
      name: string;
      language: string;
      sourceCode: string;
      abi: string;
      version: string;
      evmVersion: string;
      optimization: number;
      runs: number;
      libraries: unknown[];
      license: string | null;
      constructorArgs: string;
      exactMatch: boolean;
    };
  };
}

async function main() {
  console.log('Verifying that Brainpedia contracts are verified on chainscan.0g.ai\n');
  let allGood = true;

  for (const c of CONTRACTS) {
    const url = `https://chainscan.0g.ai/v1/contract/${c.address.toLowerCase()}`;
    const res = await fetch(url);
    const data = (await res.json()) as VerifyResponse;
    const v = data.result?.verify;
    if (!v) {
      console.log(`  [FAIL] ${c.name.padEnd(20)} ${c.address}  no verify object`);
      allGood = false;
      continue;
    }
    const ok = v.exactMatch && v.sourceCode.length > 0;
    if (!ok) allGood = false;
    console.log(
      `  [${ok ? ' OK ' : 'FAIL'}] ${c.name.padEnd(20)} ${c.address}` +
        `  exactMatch=${v.exactMatch}` +
        `  src=${v.sourceCode.length}c` +
        `  abi=${v.abi.length}c` +
        `  compiler=${v.version}` +
        `  evm=${v.evmVersion}` +
        `  opt=${v.optimization}/${v.runs}`,
    );
  }

  console.log('');
  if (allGood) {
    console.log('All 4 contracts are verified with exactMatch=true.');
    console.log('Source code is in chainscan.0g.ai/v1/contract/{address} -> result.verify.sourceCode');
    console.log('SPA tab at chainscan.0g.ai/address/{address} reads the same data.');
  } else {
    console.error('Some contracts are not verified. Re-run forge verify-contract.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('verify-contracts-on-chainscan failed:', err);
  process.exit(1);
});
