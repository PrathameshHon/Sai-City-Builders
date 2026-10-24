import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only needed for the local `bun run start` flow —
  // Vercel builds plain `next build` output.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
