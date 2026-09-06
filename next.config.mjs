import { createRequire } from "node:module";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
export default (phase) => ({
  // Keep builds from overwriting the running development server's chunks.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  typedRoutes: false,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["sharp"],
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["react-dom/server.edge"] = require.resolve("react-dom/server.browser");
    return config;
  },
});
