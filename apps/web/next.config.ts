// FILE: apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "media.discordapp.net" },
    ],
  },
  
async rewrites() {
    return [
      // Proxy exactly the media route your CMS returns (relative path)
      {
        source: '/api/media/file/:path*',
        destination: `${process.env.CMS_INTERNAL_URL}/api/media/file/:path*`,
      },
      // optional: if your CMS also uses other /api/media/* routes
      {
        source: '/api/media/:path*',
        destination: `${process.env.CMS_INTERNAL_URL}/api/media/:path*`,
      },
    ];
  },
  
};

export default nextConfig;
