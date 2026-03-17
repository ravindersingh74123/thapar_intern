import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdfjs-dist", "xlsx", "tesseract.js",'duckdb', 'duckdb-async'],
  turbopack: {},
 
  
};

export default nextConfig;
