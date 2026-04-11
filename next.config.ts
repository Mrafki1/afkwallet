import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core", "playwright"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

// Wrap with Sentry if the package is installed.
// Safe to deploy before installing — falls back to plain nextConfig.
function withSentryIfAvailable(config: NextConfig): NextConfig {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withSentryConfig } = require("@sentry/nextjs");
    return withSentryConfig(config, {
      silent: true,          // suppress build output noise
      disableLogger: true,   // tree-shake Sentry logger in prod bundle
      automaticVercelMonitors: false, // we use our own healthcheck monitors
    }) as NextConfig;
  } catch {
    return config;
  }
}

export default withSentryIfAvailable(nextConfig);
