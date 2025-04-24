import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Enables static HTML export for Docker deployment
  poweredByHeader: false, // Removes the X-Powered-By header for security
  // Enable Docker image optimization
  images: {
    unoptimized: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
