import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@powerlytic/ui", "@powerlytic/types", "@powerlytic/authz"]
};

export default nextConfig;
