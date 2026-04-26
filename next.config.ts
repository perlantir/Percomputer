import type { NextConfig } from "next";

let finalConfig: NextConfig;

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
  rewrites: async () => {
    return [
      { source: "/api/v1/:path*", destination: "/api/:path*" },
      { source: "/api/health", destination: "/api/healthcheck" },
    ];
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

try {
  if (process.env.SENTRY_AUTH_TOKEN) {
    const { withSentryConfig } = require("@sentry/nextjs");
    const sentryWebpackPluginOptions = {
      silent: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      disable: !process.env.SENTRY_AUTH_TOKEN,
    };
    finalConfig = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
  } else {
    finalConfig = nextConfig;
  }
} catch {
  finalConfig = nextConfig;
}

export default finalConfig;
