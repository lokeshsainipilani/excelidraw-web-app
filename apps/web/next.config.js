/** @type {import('next').NextConfig} */
const nextConfig = {
     transpilePackages: ["@repo/common"], // Ensure the common package is transpiled
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@repo/common": require.resolve("@repo/common"),
    };
    return config;
  },
  experimental: {
    esmExternals: "loose", // Handle ESM external modules
  },
};

export default nextConfig;
