import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@brainpedia/ens', '@brainpedia/storage-0g'],
  experimental: {
    typedRoutes: true,
  },
};

export default config;
