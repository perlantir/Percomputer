import { NextRequest, NextResponse } from "next/server";
import { recordHttpRequest, recordRateLimitHit } from "@/src/lib/metrics";

// =============================================================================
// Rate Limiting Middleware
// Features: IP-based, per-endpoint limits, sliding window, Redis-backed
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimitConfig {
  /** Max requests within the window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface PerEndpointConfig {
  [pattern: string]: RateLimitConfig;
}

interface RateLimitStore {
  get(key: string): Promise<SlidingWindowEntry | null>;
  set(key: string, entry: SlidingWindowEntry, ttlMs: number): Promise<void>;
}

interface SlidingWindowEntry {
  /** Timestamps of requests in current + previous window (as arrays for precision) */
  timestamps: number[];
  /** Unix ms of the current window start */
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  window: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);
const DEFAULT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "60000",
  10
);

/** Per-endpoint rate limit overrides (most specific match wins) */
const ENDPOINT_LIMITS: PerEndpointConfig = {
  // Auth endpoints — stricter
  "/api/auth/login": { max: 5, windowMs: 60000 },
  "/api/auth/register": { max: 3, windowMs: 3600000 },
  "/api/auth/forgot-password": { max: 3, windowMs: 3600000 },

  // AI/chat endpoints — moderate
  "/api/chat": { max: 30, windowMs: 60000 },
  "/api/completion": { max: 20, windowMs: 60000 },

  // Agent execution — moderate
  "/api/agents/run": { max: 20, windowMs: 60000 },
  "/api/workflows/execute": { max: 15, windowMs: 60000 },

  // Upload — stricter due to resource cost
  "/api/upload": { max: 10, windowMs: 60000 },

  // Admin endpoints — very strict
  "/api/admin": { max: 50, windowMs: 60000 },
};

/** Paths excluded from rate limiting */
const EXCLUDED_PATHS: string[] = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/health",
  "/robots.txt",
  "/sitemap.xml",
  "/api/metrics",
];

// ---------------------------------------------------------------------------
// IP Extraction
// ---------------------------------------------------------------------------

/**
 * Extract client IP from request headers.
 * Checks X-Forwarded-For, X-Real-IP, and falls back to a connection-derived
 * placeholder. Sanitizes to prevent header injection in cache keys.
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP, trim whitespace, remove port if present
    const first = forwarded.split(",")[0].trim();
    return sanitizeIP(first);
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return sanitizeIP(realIP.trim());
  }

  // Fallback: use a connection identifier (less reliable but functional)
  return "unknown";
}

/** Sanitize IP to prevent cache-key injection via forged headers */
function sanitizeIP(ip: string): string {
  // Remove any characters that aren't valid in IP addresses
  // IPv4: digits and dots, IPv6: hex digits, colons, bracketed
  return ip
    .replace(/[^a-fA-F0-9.:[]]/g, "")
    .slice(0, 45); // max IPv6 length with brackets
}

// ---------------------------------------------------------------------------
// Sliding Window Implementation
// ---------------------------------------------------------------------------

/**
 * Sliding Window Log algorithm:
 * Stores timestamps of recent requests. On each check, evicts timestamps
 * outside the window and counts remaining. Provides smooth rate limiting
 * without the burst-at-boundary problem of fixed windows.
 */
class SlidingWindowRateLimiter {
  constructor(private store: RateLimitStore) {}

  /**
   * Check if a request should be allowed under the sliding window.
   * Returns the decision + headers data atomically.
   */
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const entry = await this.store.get(key);

    let timestamps: number[] = [];
    if (entry) {
      // Evict stale entries outside the sliding window
      timestamps = entry.timestamps.filter((ts) => ts > windowStart);
    }

    const currentCount = timestamps.length;
    const allowed = currentCount < config.max;

    if (allowed) {
      timestamps.push(now);
    }

    // TTL = full window since the oldest remaining request could expire
    const oldestRemaining = timestamps.length > 0 ? timestamps[0] : now;
    const ttlMs = Math.max(
      config.windowMs - (now - oldestRemaining) + 1000,
      config.windowMs
    );

    await this.store.set(key, { timestamps, windowStart: now }, ttlMs);

    // If not allowed, remaining is 0; otherwise recalculate after increment
    const remaining = allowed ? Math.max(0, config.max - timestamps.length) : 0;
    const resetTime = Math.ceil((now + config.windowMs) / 1000);

    return {
      allowed,
      limit: config.max,
      remaining,
      resetTime,
      window: config.windowMs,
    };
  }
}

// ---------------------------------------------------------------------------
// Store Implementations
// ---------------------------------------------------------------------------

/** In-memory store for single-instance / dev environments */
class MemoryRateLimitStore implements RateLimitStore {
  private cache = new Map<string, SlidingWindowEntry>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  async get(key: string): Promise<SlidingWindowEntry | null> {
    return this.cache.get(key) || null;
  }

  async set(
    key: string,
    entry: SlidingWindowEntry,
    ttlMs: number
  ): Promise<void> {
    // Clear existing timer
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);

    this.cache.set(key, entry);

    // Schedule cleanup
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttlMs);
    this.timers.set(key, timer);
  }

  /** Get approximate memory footprint for monitoring */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Redis-backed store using Upstash Redis (Edge Runtime compatible).
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 *
 * If Upstash is not available, falls back to in-memory store.
 */
class UpstashRedisRateLimitStore implements RateLimitStore {
  private redis: { get: (k: string) => Promise<unknown>; set: (k: string, v: string, opts?: { ex?: number }) => Promise<unknown> } | null = null;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      this.redis = {
        get: async (key: string) => {
          const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (!res.ok) return null;
          const data = (await res.json()) as { result?: string | null };
          return data.result ?? null;
        },
        set: async (
          key: string,
          value: string,
          opts?: { ex?: number }
        ) => {
          const exParam = opts?.ex ? `?EX=${opts.ex}` : "";
          await fetch(
            `${url}/set/${encodeURIComponent(key)}${exParam}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(value),
              cache: "no-store",
            }
          );
        },
      };
    }
  }

  isAvailable(): boolean {
    return this.redis !== null;
  }

  async get(key: string): Promise<SlidingWindowEntry | null> {
    if (!this.redis) return null;
    const raw = (await this.redis.get(key)) as string | null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SlidingWindowEntry;
    } catch {
      return null;
    }
  }

  async set(
    key: string,
    entry: SlidingWindowEntry,
    ttlMs: number
  ): Promise<void> {
    if (!this.redis) return;
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await this.redis.set(key, JSON.stringify(entry), { ex: ttlSeconds });
  }
}

// ---------------------------------------------------------------------------
// Store Factory
// ---------------------------------------------------------------------------

function createStore(): RateLimitStore {
  // Prefer Upstash Redis (Edge-compatible)
  const upstash = new UpstashRedisRateLimitStore();
  if (upstash.isAvailable()) {
    return upstash;
  }

  // Fallback: in-memory (works in dev / single-instance)
  return new MemoryRateLimitStore();
}

// ---------------------------------------------------------------------------
// Endpoint Matching
// ---------------------------------------------------------------------------

/**
 * Find the most specific rate limit config for a given pathname.
 * Checks exact match first, then prefix match (longest prefix wins).
 */
function getEndpointConfig(pathname: string): RateLimitConfig {
  // Exact match
  if (ENDPOINT_LIMITS[pathname]) {
    return ENDPOINT_LIMITS[pathname];
  }

  // Prefix match — find the longest matching prefix
  let bestMatch: string | null = null;
  for (const pattern of Object.keys(ENDPOINT_LIMITS)) {
    if (pathname.startsWith(pattern)) {
      if (!bestMatch || pattern.length > bestMatch.length) {
        bestMatch = pattern;
      }
    }
  }

  if (bestMatch) {
    return ENDPOINT_LIMITS[bestMatch];
  }

  // Default config
  return { max: DEFAULT_MAX, windowMs: DEFAULT_WINDOW_MS };
}

/** Check if the path should be excluded from rate limiting */
function isExcluded(pathname: string): boolean {
  return EXCLUDED_PATHS.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(prefix + "/") ||
      pathname.startsWith(prefix)
  );
}

// ---------------------------------------------------------------------------
// Response Helpers
// ---------------------------------------------------------------------------

/** Attach standard rate limit headers to the response */
function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetTime));
  response.headers.set("X-RateLimit-Window", String(result.window));
  return response;
}

/** Create a 429 Too Many Requests response */
function createRateLimitExceededResponse(
  result: RateLimitResult
): NextResponse {
  const response = new NextResponse(
    JSON.stringify({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again after ${new Date(
        result.resetTime * 1000
      ).toISOString()}.`,
      retryAfter: Math.ceil(result.window / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(result.window / 1000)),
      },
    }
  );

  addRateLimitHeaders(response, result);
  return response;
}

// ---------------------------------------------------------------------------
// Singleton Limiter Instance
// ---------------------------------------------------------------------------

const store = createStore();
const limiter = new SlidingWindowRateLimiter(store);

// ---------------------------------------------------------------------------
// CSP (Content Security Policy) Helpers
// ---------------------------------------------------------------------------

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

function buildCSPPolicy(nonce: string): string {
  const reportUri = process.env.CSP_REPORT_URI || "/api/csp-report";

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src":
      "'self' 'nonce-" +
      nonce +
      "' 'strict-dynamic'" +
      (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
    "style-src": "'self' 'nonce-" + nonce + "' 'unsafe-inline'",
    "img-src":
      "'self' blob: data: https://images.unsplash.com https://oaidalleapiprodscus.blob.core.windows.net https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
    "font-src": "'self' data:",
    "connect-src":
      "'self' /api /api/v1 https://images.unsplash.com https://oaidalleapiprodscus.blob.core.windows.net https://avatars.githubusercontent.com https://lh3.googleusercontent.com" +
      (process.env.NODE_ENV === "development" ? " ws://localhost:*" : ""),
    "frame-src": "'none'",
    "frame-ancestors": "'none'",
    "form-action": "'self'",
    "base-uri": "'self'",
    ...(process.env.NODE_ENV === "production"
      ? { "upgrade-insecure-requests": "" }
      : {}),
    "report-uri": reportUri,
  };

  return Object.entries(directives)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
}

function addCSPHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const pathname = request.nextUrl.pathname;

  // Skip CSP for API routes, static assets, and internal paths
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/)
  ) {
    return response;
  }

  const nonce = generateNonce();
  const cspPolicy = buildCSPPolicy(nonce);
  const reportOnly = process.env.CSP_REPORT_ONLY === "true";

  const headerName = reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

  response.headers.set(headerName, cspPolicy);
  response.headers.set("X-CSP-Nonce", nonce);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

// ---------------------------------------------------------------------------
// Next.js Middleware
// ---------------------------------------------------------------------------

/**
 * Request timing tracker — maps request IDs to start timestamps.
 * WeakMap ensures entries are GC-ed when the request object is no longer referenced.
 */
const requestStartTimes = new WeakMap<NextRequest, number>();

export async function middleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const requestStart = Date.now();
  requestStartTimes.set(request, requestStart);

  // Skip processing for excluded paths (static assets, etc.)
  if (isExcluded(pathname)) {
    return NextResponse.next();
  }

  // --- CSP Headers: apply to ALL non-API, non-static routes ---
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/static/")
  ) {
    const response = NextResponse.next();
    return addCSPHeaders(request, response);
  }

  // --- Rate Limiting + Security Headers: only for API routes ---
  if (pathname.startsWith("/api/")) {
    // Extract client IP
    const clientIP = getClientIP(request);
    const config = getEndpointConfig(pathname);

    // Build a cache key that includes endpoint + IP for per-endpoint isolation
    const rateLimitKey = `ratelimit:${pathname.split("/").slice(0, 4).join(":")}:${clientIP}`;

    // Check rate limit
    const result = await limiter.check(rateLimitKey, config);

    if (!result.allowed) {
      recordRateLimitHit(pathname);

      // Record rate-limited request in metrics
      const durationMs = Date.now() - requestStart;
      recordHttpRequest({
        method: request.method,
        pathname,
        statusCode: 429,
        durationMs,
      });

      return createRateLimitExceededResponse(result);
    }

    // Allow request and attach rate limit + security headers
    const response = NextResponse.next();
    addRateLimitHeaders(response, result);
    // Add baseline security headers to all API responses (CSP skipped for APIs)
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );

    // Record successful API request in Prometheus metrics
    const durationMs = Date.now() - requestStart;
    recordHttpRequest({
      method: request.method,
      pathname,
      statusCode: response.status,
      durationMs,
    });

    return response;
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher Config
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
