import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",

  // Sentry source map upload — enabled when SENTRY_AUTH_TOKEN is set
  // The Sentry plugin handles this automatically via withSentryConfig
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-tabs",
      "@radix-ui/react-accordion",
      "@radix-ui/react-separator",
      "@radix-ui/react-avatar",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-toast",
      "date-fns",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            // Allow Datadog RUM CDN, intake, and session replay
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.datadoghq-browser-agent.com",
              "connect-src 'self' https://*.datadoghq.com https://*.datadoghq.eu https://browser-intake-datadoghq.com https://browser-intake-datadoghq.eu https://*.logs.datadoghq.com https://*.logs.datadoghq.eu wss://*.datadoghq.com",
              "img-src 'self' blob: data: https://*.datadoghq.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
  rewrites: async () => {
    return [
      {
        source: "/api/v1/:path*",
        destination: "/api/:path*",
      },
      {
        source: "/api/health",
        destination: "/api/healthcheck",
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

// Sentry webpack plugin options
// @see https://www.npmjs.com/package/@sentry/webpack-plugin
const sentryWebpackPluginOptions = {
  // Upload source maps only in CI/production builds
  silent: process.env.NODE_ENV === "development",

  // Organization and project set via env vars:
  //   SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
  // DSN set via: SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN

  // Upload source maps for better error stack traces
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Only enable when auth token is present
  disable: !process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
