import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    // Old AI-centric service slugs → their nearest new service page.
    return [
      { source: '/services/ai-implementation', destination: '/services/websites-platforms', permanent: true },
      { source: '/services/ai-automation', destination: '/services/business-automation', permanent: true },
      { source: '/services/ai-solutions-architect', destination: '/services/fractional-cto', permanent: true },
      { source: '/services/prompt-engineering', destination: '/services/chatbots-ai-assistants', permanent: true },
    ];
  },
};

export default nextConfig;
