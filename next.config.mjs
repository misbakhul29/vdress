import path from 'path';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {},
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        fs: false,
      },
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
};


export default nextConfig;