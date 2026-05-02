import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  id as ethersId,
  type Log,
  type TransactionReceipt,
} from 'ethers';
import { http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  loadEnsConfig,
  createEnsPublicClient,
  registerSubname,
  viemChainForNetwork,
  BRAIN_TEXT_KEYS,
} from '@brainpedia/ens';
import { addEnsContracts } from '@ensdomains/ensjs';
import { loadZgConfig } from '@brainpedia/storage-0g';

export const finalizeBrainTool: Tool = {
  name: 'finalize_brain',
  description:
    'Mint the ERC-7857 Brain iNFT pointing at a 0G Storage merkle root, then ' +
    'register the ENS subname and write all brain.* text records in one shot. ' +
    'Call after upload_articles returned a snapshot rootHash.',
  inputSchema: {
    type: 'object',
    properties: {
      label: { type: 'string', description: 'ENS subname label (e.g., "yudhi")' },
      brainOwner: {
        type: 'string',
        description: '0x address that will own the iNFT and the subname.',
      },
      storageRoot: {
        type: 'string',
        description: '0x-prefixed merkle root from upload_articles.',
      },
      description: { type: 'string' },
      avatar: { type: 'string' },
      specialty: { type: 'string' },
      pricePerQuery: {
        type: 'string',
        description: 'Wei amount, used as ENS brain.price_query text record.',
      },
      computeUrl: {
        type: 'string',
        description: '0G Compute provider URL — will be set as brain.compute_url.',
      },
      axlPeerId: {
        type: 'string',
        description:
          "Brain's AXL Ed25519 public key (hex). Used as brain.axl_peer_id.",
      },
    },
    required: ['label', 'brainOwner', 'storageRoot'],
  },
};

const inputSchema = z.object({
  label: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i),
  brainOwner: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  storageRoot: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  description: z.string().optional(),
  avatar: z.string().optional(),
  specialty: z.string().optional(),
  pricePerQuery: z.string().optional(),
  computeUrl: z.string().optional(),
  axlPeerId: z.string().optional(),
});

// We mint through BrainMinter (a permissionless wrapper that owns Brain.sol)
// so any caller — not just the original deployer — can mint a Brain to
// themselves. The minted iNFT is owned by msg.sender; the BrainMinted event
// is emitted by Brain.sol itself.
const minterAbi = [
  'function mintToSender(bytes32 initialStorageRoot, string description) payable returns (uint256)',
  'function mintFeeWei() view returns (uint256)',
  'event Minted(uint256 indexed tokenId, address indexed minter, bytes32 storageRoot)',
] as const;
const brainAbi = [
  'event BrainMinted(uint256 indexed tokenId, address indexed owner, bytes32 storageRoot)',
] as const;

export async function handleFinalizeBrain(args: Record<string, unknown>) {
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    return errorResp(`finalize_brain: invalid args — ${parsed.error.message}`);
  }

  const inftAddress = process.env.ZG_INFT_CONTRACT_ADDRESS;
  if (!inftAddress) {
    return errorResp(
      'finalize_brain: ZG_INFT_CONTRACT_ADDRESS not set. ' +
        'Deploy contracts first (see scripts/setup/prep-deploy.ts + contracts/script/Deploy.s.sol).',
    );
  }
  const minterAddress = process.env.BRAIN_MINTER_ADDRESS;
  if (!minterAddress) {
    return errorResp(
      'finalize_brain: BRAIN_MINTER_ADDRESS not set. ' +
        'BrainMinter wraps Brain.sol and lets any wallet mint to itself permissionlessly.',
    );
  }
  const wallet = process.env.ZG_WALLET_PRIVATE_KEY;
  if (!wallet) {
    return errorResp('finalize_brain: ZG_WALLET_PRIVATE_KEY env var is required.');
  }

  const zg = loadZgConfig();
  const ens = loadEnsConfig();

  // 1. Mint the iNFT on 0G chain — via BrainMinter (permissionless).
  const provider = new JsonRpcProvider(zg.rpcUrl);
  const signer = new Wallet(wallet, provider);
  const minter = new Contract(minterAddress, minterAbi, signer) as unknown as {
    mintFeeWei: () => Promise<bigint>;
    mintToSender: (
      initialStorageRoot: string,
      description: string,
      overrides?: { value?: bigint },
    ) => Promise<{ wait: () => Promise<TransactionReceipt> }>;
  };
  const fee = await minter.mintFeeWei();
  // BrainMinter mints to msg.sender. The signer's address ends up owning the
  // iNFT — no `to` argument; the Brain owner is the wallet that signed this tx.
  const tx = await minter.mintToSender(
    parsed.data.storageRoot,
    parsed.data.description ?? `Brainpedia Brain: ${parsed.data.label}`,
    { value: fee },
  );
  const receipt = (await tx.wait()) as TransactionReceipt;
  const tokenId = extractTokenId(receipt);
  if (tokenId === null) {
    return errorResp(
      `finalize_brain: BrainMinted event not found in receipt ${receipt.hash}`,
    );
  }

  // 2. Register the ENS subname + write all text records.
  const ensPublic = createEnsPublicClient(ens);
  const account = privateKeyToAccount(`0x${wallet.replace(/^0x/, '')}`);
  const ensWallet = createWalletClient({
    account,
    chain: addEnsContracts(viemChainForNetwork(ens.network)),
    transport: http(ens.rpcUrl),
  });

  const inftPair = `${inftAddress}:${tokenId}`;
  const ensResult = await registerSubname(
    { publicClient: ensPublic, walletClient: ensWallet, config: ens },
    {
      label: parsed.data.label,
      owner: parsed.data.brainOwner as `0x${string}`,
      records: {
        description: parsed.data.description,
        avatar: parsed.data.avatar,
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://brainpedia.up.railway.app'}/${parsed.data.label}`,
        inft: inftPair,
        storageRoot: parsed.data.storageRoot,
        axlPeerId: parsed.data.axlPeerId,
        specialty: parsed.data.specialty,
        priceQuery: parsed.data.pricePerQuery,
        computeUrl: parsed.data.computeUrl,
      },
    },
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            iNFT: {
              contract: inftAddress,
              tokenId: tokenId.toString(),
              mintTxHash: receipt.hash,
              explorer: `${zg.explorerUrl}/tx/${receipt.hash}`,
            },
            ens: {
              fullName: ensResult.fullName,
              registerTxHash: ensResult.registerTxHash,
              textRecordsTxHash: ensResult.textRecordsTxHash,
            },
            textRecords: {
              [BRAIN_TEXT_KEYS.inft]: inftPair,
              [BRAIN_TEXT_KEYS.storageRoot]: parsed.data.storageRoot,
              [BRAIN_TEXT_KEYS.specialty]: parsed.data.specialty ?? null,
              [BRAIN_TEXT_KEYS.priceQuery]: parsed.data.pricePerQuery ?? null,
            },
          },
          null,
          2,
        ),
      },
    ],
  };
}

function extractTokenId(receipt: TransactionReceipt): bigint | null {
  // BrainMinted(uint256 indexed tokenId, address indexed owner, bytes32 storageRoot)
  const topic = ethersId('BrainMinted(uint256,address,bytes32)');
  const log = receipt.logs.find((l: Log) => l.topics[0] === topic);
  if (!log || !log.topics[1]) return null;
  return BigInt(log.topics[1]);
}

function errorResp(message: string) {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}
