/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/**/*"],
  },
};

export default nextConfig;
