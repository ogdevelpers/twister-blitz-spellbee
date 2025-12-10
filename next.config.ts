import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Cloudflare compatibility
  output: 'standalone', // Can be changed to 'export' for static export if needed
};

export default nextConfig;

