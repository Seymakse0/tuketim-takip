import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/**/*"],
  },
  async rewrites() {
    // Eski istemciler /favicon.ico ister; statik SVG'ye yönlendir (Docker'da dinamik /icon OG bağımlılığı yok)
    return [{ source: "/favicon.ico", destination: "/favicon.svg" }];
  },
};

export default nextConfig;
