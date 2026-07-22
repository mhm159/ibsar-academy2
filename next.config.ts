import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
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
