import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/**/*"],
  },
  async rewrites() {
    // Tarayıcılar varsayılan olarak /favicon.ico ister; gerçek dosya PNG (public/favicon.png)
    return [{ source: "/favicon.ico", destination: "/favicon.png" }];
  },
};

export default nextConfig;
