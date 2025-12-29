import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable server components for pages that need Socket.IO
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Turbopack configuration
  turbopack: {},
  // Ensure webpack is configured for the custom server
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};

export default nextConfig;
