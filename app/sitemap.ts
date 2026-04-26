import type { MetadataRoute } from 'next';

/**
 * Sitemap.xml — Next.js Metadata Route
 *
 * Dynamically generates sitemap.xml at build time.
 * Includes all public-facing pages with appropriate priorities & change frequencies.
 *
 * For dynamic routes (workflows / spaces), the sitemap lists the route pattern
 * without individual IDs. Search engines will discover individual pages via
 * internal links from the library, discover, and space listing pages.
 *
 * To include individual dynamic pages, fetch them from the DB at build time:
 *   import { prisma } from '@/lib/prisma';
 *   const workflows = await prisma.workflow.findMany({ select: { id: true, updatedAt: true } });
 *   workflows.map(w => ({ url: `${BASE_URL}/w/${w.id}`, lastModified: w.updatedAt, ... }))
 */

const BASE_URL =
  process.env.APP_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

// ── Static public pages ──
const staticPages: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/landing`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/changelog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/compare`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/connectors`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/console`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/discover`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/help`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/library`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/status`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.4,
  },
  {
    url: `${BASE_URL}/status/history`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.3,
  },
];

// ── Dynamic route patterns (index pages that list all items) ──
const dynamicPatterns: MetadataRoute.Sitemap = [
  {
    url: `${BASE_URL}/library`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/discover`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Deduplicate entries (library & discover appear in both arrays)
  const allUrls = [...staticPages, ...dynamicPatterns];
  const seen = new Set<string>();
  return allUrls.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
