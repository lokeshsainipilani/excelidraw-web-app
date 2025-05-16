/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
     transpilePackages: ["@repo/common"], // Ensure the common package is transpiled
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@repo/common": path.resolve(__dirname, "../../packages/common/src"),
    };
    return config;
  },
  experimental: {
    esmExternals: "loose", // Handle ESM external modules
  },
};

export default nextConfig;
