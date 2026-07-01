import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - Ignore TS complaining about NextConfig type
  allowedDevOrigins: [
    // IP Local/Static
    "172.16.161.128",
    "172.16.162.212",
    "172.16.94.93",   // Added new IP
    "192.168.56.1",
    "192.168.1.33",
    "192.168.10.10",
    "192.168.10.245", // Requested IP
    
    // Common IP ranges (add more as needed)
    // Note: Next.js doesn't support wildcard, so you need to add each IP individually
  ],
  
  // Alternative: Disable CORS check for HMR in development
  // This allows ALL origins to access HMR in dev mode (use with caution)
  // webpack: (config, { dev, isServer }) => {
  //   if (dev && !isServer) {
  //     config.devServer = {
  //       ...config.devServer,
  //       allowedHosts: 'all',
  //     };
  //   }
  //   return config;
  // },
};

export default nextConfig;

