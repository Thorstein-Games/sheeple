import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export is for the Netlify build (which rewrites /room/* to the
  // generateStaticParams "_" shell). `next dev` enforces the export
  // constraint strictly and 500s on real dynamic params, so only export in
  // production builds — `next build` sets NODE_ENV=production automatically.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
};

export default nextConfig;
