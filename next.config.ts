import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  images: {
    qualities: [70, 80, 90],
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    // The home directory above this project has its own package-lock.json; pin the workspace root here.
    root: process.cwd(),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
