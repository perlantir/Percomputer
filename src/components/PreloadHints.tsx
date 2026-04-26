'use client';

import { usePathname } from 'next/navigation';

// =============================================================================
// RESOURCE HINTS CONFIGURATION
// =============================================================================

/**
 * External domains used by the app — preconnect early to shave off DNS + TLS
 * negotiation time. Listed in order of visual/functional priority.
 */
const PRECONNECT_DOMAINS = [
  // Self (API routes) — highest priority; establishes same-origin connection
  { href: typeof window !== 'undefined' ? window.location.origin : '', label: 'self' },
  // Image CDN — used heavily for agent/workflow images
  { href: 'https://images.unsplash.com', label: 'unsplash' },
  // DALL-E generated images
  { href: 'https://oaidalleapiprodscus.blob.core.windows.net', label: 'openai-images' },
  // GitHub avatars (team page, connectors)
  { href: 'https://avatars.githubusercontent.com', label: 'github-avatars' },
  // Google avatars (OAuth users)
  { href: 'https://lh3.googleusercontent.com', label: 'google-avatars' },
  // Upstash Redis REST (rate limiting / Edge store) — if configured
  { href: 'https://global-usual-gannet-30861.upstash.io', label: 'upstash', conditional: true },
  // Sentry ingest (error tracking) — if DSN configured
  { href: 'https://o4506835903549440.ingest.sentry.io', label: 'sentry', conditional: true },
];

/**
 * DNS-prefetch for third-party services that are loaded lazily or conditionally.
 * These get a head-start on DNS resolution without the full TLS handshake cost
 * of preconnect.
 */
const DNS_PREFETCH_DOMAINS = [
  // Google OAuth (Sign-In, token refresh)
  'https://accounts.google.com',
  'https://oauth2.googleapis.com',
  // GitHub OAuth
  'https://github.com',
  'https://api.github.com',
  // AI provider APIs (called server-side, but DNS prefetch helps if called client-side)
  'https://api.openai.com',
  'https://api.anthropic.com',
  'https://generativelanguage.googleapis.com',
  // CDN for static assets (if used)
  'https://cdn.jsdelivr.net',
];

/**
 * Critical font files to preload.
 * These fonts are above-the-fold (heading, body, mono) and block initial render.
 * Preloading ensures they're available before first paint, eliminating FOIT.
 *
 * NOTE: When enabling FK Display / FK Grotesk / Berkeley Mono fonts,
 * uncomment the corresponding entries and place woff2 files in /public/fonts/.
 */
const CRITICAL_FONTS: Array<{
  href: string;
  type: string;
  crossorigin?: boolean;
  conditional?: boolean;
}> = [
  // Google Fonts Inter — loaded via next/font/google but preload ensures
  // the CSS fetch starts immediately. Next.js injects this automatically,
  // so we leave it out to avoid double-fetch. If using manual font loading,
  // uncomment below:
  // { href: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf', type: 'font/woff2', crossorigin: true },

  // FK Display — primary display/heading font (uncomment when font files are added)
  // { href: '/fonts/FKDisplay-Regular.woff2', type: 'font/woff2', crossorigin: true },

  // FK Grotesk Neue — body font (uncomment when font files are added)
  // { href: '/fonts/FKGroteskNeue-Regular.woff2', type: 'font/woff2', crossorigin: true },
  // { href: '/fonts/FKGroteskNeue-Medium.woff2', type: 'font/woff2', crossorigin: true },

  // Berkeley Mono — code/monospace font (uncomment when font files are added)
  // { href: '/fonts/BerkeleyMono-Regular.woff2', type: 'font/woff2', crossorigin: true },
];

// =============================================================================
// ROUTE PREFETCHING
// =============================================================================

/**
 * PreloadHints — injects resource hints for faster page loads:
 *
 * 1. <link rel="preconnect">   — early TCP + TLS for critical domains
 * 2. <link rel="dns-prefetch"> — early DNS for secondary domains
 * 3. <link rel="preload">      — critical font files before first paint
 * 4. <link rel="prefetch">     — page chunks for likely next routes
 *
 * These hints tell the browser to prioritize connection setup and resource
 * fetching during idle time, making subsequent navigations feel instant.
 */
const LIKELY_ROUTES: Record<string, string[]> = {
  '/': ['/discover', '/library', '/settings', '/changelog'],
  '/discover': ['/library', '/', '/compare'],
  '/library': ['/discover', '/', '/changelog'],
  '/console': ['/library', '/settings'],
  '/settings': ['/console', '/', '/team'],
  '/connectors': ['/library', '/discover'],
  '/team': ['/settings', '/'],
  '/status': ['/console', '/settings'],
  '/compare': ['/library', '/discover'],
  '/changelog': ['/library', '/'],
  '/landing': ['/discover', '/'],
};

const GLOBAL_HIGH_PRIORITY = ['/'];

export function PreloadHints() {
  const pathname = usePathname();

  /* ── Collect routes to prefetch ── */
  const routesToPrefetch = new Set<string>();

  /* Always prefetch global high-priority routes */
  GLOBAL_HIGH_PRIORITY.forEach((r) => routesToPrefetch.add(r));

  /* Add context-aware likely routes */
  const contextRoutes = LIKELY_ROUTES[pathname] || [];
  contextRoutes.forEach((r) => routesToPrefetch.add(r));

  /* Don't prefetch the current route */
  routesToPrefetch.delete(pathname);

  /* ── Filter out conditional domains without env config ── */
  const activePreconnect = PRECONNECT_DOMAINS.filter((d) => {
    if (d.conditional) {
      // Only include conditional domains if their env vars are present
      if (d.label === 'upstash') {
        return !!process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
      }
      if (d.label === 'sentry') {
        return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
      }
    }
    // Skip empty href (self on SSR)
    return d.href.length > 0;
  });

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          1. PRECONNECT — establish TCP + TLS early for critical domains
          ═══════════════════════════════════════════════════════════════ */}
      {activePreconnect.map(({ href, label }) => (
        <link
          key={`preconnect-${label}`}
          rel="preconnect"
          href={href}
          crossOrigin={href === (typeof window !== 'undefined' ? window.location.origin : '') ? undefined : 'anonymous'}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════════════
          2. DNS-PREFETCH — early DNS for secondary/lazy-loaded domains
          ═══════════════════════════════════════════════════════════════ */}
      {DNS_PREFETCH_DOMAINS.map((href) => (
        <link
          key={`dns-prefetch-${href}`}
          rel="dns-prefetch"
          href={href}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════════════
          3. PRELOAD — critical fonts before first paint
             Uncomment entries above when font files are available in /public/fonts/
          ═══════════════════════════════════════════════════════════════ */}
      {CRITICAL_FONTS.filter((f) => !f.conditional).map((font) => (
        <link
          key={`preload-font-${font.href}`}
          rel="preload"
          href={font.href}
          as="font"
          type={font.type}
          crossOrigin={font.crossorigin ? 'anonymous' : undefined}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════════════
          4. PREFETCH — page chunks for likely next routes
          ═══════════════════════════════════════════════════════════════ */}
      {Array.from(routesToPrefetch).map((href) => (
        <link
          key={`prefetch-${href}`}
          rel="prefetch"
          href={href}
          as="document"
        />
      ))}
    </>
  );
}
