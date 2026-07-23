import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: '/restaurant/dashboard', destination: '/dashboard' },
      { source: '/restaurant/:path*', destination: '/:path*' },
      { source: '/access-control/:path*', destination: '/:path*' },
    ];
  },
};

export default nextConfig;
