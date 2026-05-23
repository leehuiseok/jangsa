import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.runwayml.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "dnznrvs05pmza.cloudfront.net" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
