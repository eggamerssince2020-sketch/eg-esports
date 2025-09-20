import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ADD THIS BLOCK to ignore ESLint errors during the build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Your existing images configuration is preserved here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
