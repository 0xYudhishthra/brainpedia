import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';
import { mainnet, sepolia } from 'wagmi/chains';

/**
 * 0G Aristotle mainnet — chain id 16661.
 * Brainpedia's Brain iNFTs + RoyaltyDistributor live here.
 */
const zeroGMainnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ZG_CHAIN_ID ?? 16661),
  name: '0G Aristotle',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ZG_RPC_URL ?? 'https://evmrpc.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Chainscan',
      url: process.env.NEXT_PUBLIC_ZG_EXPLORER_URL ?? 'https://chainscan.0g.ai',
    },
  },
});

/** 0G Galileo testnet — still useful for dev work. */
const zeroGGalileo = defineChain({
  id: 16602,
  name: '0G Galileo Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Chainscan Galileo', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [zeroGMainnet, zeroGGalileo, sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [zeroGMainnet.id]: http(),
    [zeroGGalileo.id]: http(),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
  },
  ssr: true,
});

export const ZG_MAINNET_ID = zeroGMainnet.id;
export const ZG_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ZG_EXPLORER_URL ?? 'https://chainscan.0g.ai';

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
