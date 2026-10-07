import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server load over a Cloudflare quick tunnel for remote previews.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
