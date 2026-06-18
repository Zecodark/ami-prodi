import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - Ignore TS complaining about NextConfig type
  allowedDevOrigins: ["localhost:3000", "172.16.161.128", "192.168.56.1", "0.0.0.0", "192.168.1.33,"],
};

export default nextConfig;
