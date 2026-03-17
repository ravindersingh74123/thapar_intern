import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdfjs-dist", "xlsx", "tesseract.js",'duckdb', 'duckdb-async'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent any of these from being bundled for the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "duckdb": false,
        "duckdb-async": false,
      };
    }
    return config;
  },
};

export default nextConfig;
