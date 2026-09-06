import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
export default {
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
};
