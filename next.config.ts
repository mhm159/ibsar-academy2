import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Each local fallback port gets its own cache, avoiding a stale dev-server lock.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.localhost",
    "*.space-z.ai",
    "*.chatglm.cn",
    "*.z.ai",
    "0.0.0.0",
  ],
};

export default nextConfig;
