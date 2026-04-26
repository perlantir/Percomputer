import type { MetadataRoute } from 'next';

/**
 * Robots.txt — Next.js Metadata Route
 *
 * Dynamically generates robots.txt at build time.
 * APP_URL can be set via the NEXTAUTH_URL or APP_URL env var.
 */

const BASE_URL =
  process.env.APP_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Default rule: crawl public pages, skip auth/admin/api ──
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/home',
          '/settings',
          '/settings/',
          '/team',
          '/invite',
          '/spaces/',
          '/w/',
          '/_next/',
          '/*.json$',
          '/*.txt$',
        ],
      },

      // ── More restrictive rule for AI crawlers ──
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/landing', '/changelog', '/help'],
        disallow: ['/console', '/compare', '/connectors', '/discover', '/library'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
