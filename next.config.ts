import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - Ignore TS complaining about NextConfig type
  allowedDevOrigins: [
    "172.16.161.128",
    "172.16.162.212",
    "192.168.56.1",
    "192.168.1.33",
    "192.168.10.10",
  ],
};

export default nextConfig;
