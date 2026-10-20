import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The dev server treats 127.0.0.1 as cross-origin and refuses /_next/hmr.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    // Cache Components turns this on by default. The client then tees the
    // Flight stream and only releases the clone after hydration, which never
    // starts. Leave it off so forms and buttons actually run.
    cachedNavigations: false,
    // Dev-only owner stacks. The client waits on this channel before hydrating,
    // and the channel only fills after the HMR socket connects. When that
    // socket fails, every button stays as static HTML.
    reactDebugChannel: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
