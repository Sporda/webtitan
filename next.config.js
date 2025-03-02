/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "webtitan.cz",
        "www.webtitan.cz",
        "localhost:3000",
        "127.0.0.1",
      ],
    },
  },

  httpAgentOptions: {
    keepAlive: true,
  },

  server: {
    hostname: "0.0.0.0",
    port: 3000,
  },

  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  output: "standalone",

  sassOptions: {
    includePaths: ["./src/styles"],
  },

  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (/** @type {{ test: { test: (arg0: string) => any; }; }} */ rule) =>
        rule.test?.test?.(".svg"),
    );
    config.module.rules.push({
      ...fileLoaderRule,
      test: /\.svg$/i,
      type: "asset/resource",
    });
    return config;
  },

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
};

export default config;
