import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { mainnet, sepolia } from 'wagmi/chains';

/**
 * 0G Galileo testnet — chain id 16602.
 * RPC and explorer URLs come from env so we don't hardcode them at build time.
 */
const zeroGGalileo = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ZG_CHAIN_ID ?? 16602),
  name: '0G Galileo Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ZG_RPC_URL ?? 'https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: process.env.NEXT_PUBLIC_ZG_EXPLORER_URL ?? 'https://chainscan-galileo.0g.ai',
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [zeroGGalileo, sepolia, mainnet],
  transports: {
    [zeroGGalileo.id]: http(),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
