import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "/sheeple" in the deployed build (thorsteingames.com/sheeple), "" in dev
  // and e2e (see lib/basePath.ts).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // Static export is for the Netlify build (which rewrites /room/* to the
  // generateStaticParams "_" shell). `next dev` enforces the export
  // constraint strictly and 500s on real dynamic params, so only export in
  // production builds — `next build` sets NODE_ENV=production automatically.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
};

export default nextConfig;
