import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@powerlytic/ui', '@powerlytic/permissions'],
};

export default nextConfig;
