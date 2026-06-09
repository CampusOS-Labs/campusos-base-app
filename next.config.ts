import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: [
    "stumble-kabob-ensnare.ngrok-free.dev",
  ],
};

export default nextConfig;
