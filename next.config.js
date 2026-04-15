const path = require("path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias.tailwindcss = path.join(__dirname, "node_modules/tailwindcss");
    return config;
  },
};

module.exports = nextConfig;
