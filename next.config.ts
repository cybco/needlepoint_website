import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // for upload thing
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
    ],
  },
};

export default nextConfig;
