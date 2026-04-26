/**
 * Sentry Client-Side Configuration
 * Initializes Sentry for browser error tracking, performance monitoring,
 * and session replay for the Multi-Model Agent Platform.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development";
const SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE;
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || "0.1"
);
const SENTRY_REPLAY_SAMPLE_RATE = parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE || "0.0"
);

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Performance Monitoring
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,

    // Session Replay — only enabled in production with explicit opt-in
    replaysSessionSampleRate: SENTRY_REPLAY_SAMPLE_RATE,
    replaysOnErrorSampleRate: 1.0,

    // Error Filtering — exclude known non-actionable errors
    ignoreErrors: [
      // Network / browser extensions
      "Network Error",
      "Failed to fetch",
      "AbortError",
      "TimeoutError",
      // Common browser extension noise
      "chrome-extension",
      "moz-extension",
      "safari-extension",
      // ResizeObserver loop limit (benign)
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Hydration mismatch (handled by Next.js)
      "Hydration failed",
      "Text content does not match",
    ],

    // Deny URLs that shouldn't be tracked
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // Before-send hook — sanitize PII and filter sensitive data
    beforeSend(event) {
      // Remove potentially sensitive query parameters
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          const sensitiveParams = [
            "token",
            "api_key",
            "apikey",
            "key",
            "secret",
            "password",
            "auth",
            "authorization",
          ];
          sensitiveParams.forEach((param) => url.searchParams.delete(param));
          event.request.url = url.toString();
        } catch {
          /* ignore invalid URLs */
        }
      }

      // Scrub user IP and email from events
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }

      return event;
    },

    // Enable debug in development
    debug: SENTRY_ENVIRONMENT === "development" && process.env.NODE_ENV !== "production",

    // Spotlight integration for local debugging (dev only)
    spotlight: SENTRY_ENVIRONMENT === "development",
  });
}
