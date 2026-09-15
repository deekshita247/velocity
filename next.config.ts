import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Public filenames are mutable. Reserve immutable caching for content hashes.
    return [
      ...["/portfolio/:path*", "/assets/:path*", "/images/:path*"].map(source => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      })),
      {
        source: "/portfolio/logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
