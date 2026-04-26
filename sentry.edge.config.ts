/**
 * Sentry Edge Runtime Configuration
 * Initializes Sentry for Next.js edge runtime (middleware, edge API routes).
 * This runs in a lightweight V8 isolate — keep integrations minimal.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || "development";
const SENTRY_RELEASE = process.env.SENTRY_RELEASE;
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(
  process.env.SENTRY_TRACES_SAMPLE_RATE || "0.05"
);

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Lower sample rate for edge — typically high-volume
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,

    // Minimal integrations for edge runtime (V8 isolate constraints)
    // No httpIntegration or prismaIntegration — not supported in edge

    // Ignore non-actionable edge errors
    ignoreErrors: [
      "AbortError",
      "FetchError",
      "Network Error",
    ],

    // Scrub sensitive data from edge events
    beforeSend(event) {
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        if (headers["authorization"]) {
          headers["authorization"] = "[REDACTED]";
        }
        if (headers["cookie"]) {
          headers["cookie"] = "[REDACTED]";
        }
      }
      return event;
    },
  });
}
