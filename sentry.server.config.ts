/**
 * Sentry Server-Side Configuration
 * Initializes Sentry for Node.js server error tracking and performance monitoring
 * in the Next.js server runtime (API routes, SSR, RSC).
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || "development";
const SENTRY_RELEASE = process.env.SENTRY_RELEASE;
const SENTRY_TRACES_SAMPLE_RATE = parseFloat(
  process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"
);

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Performance Monitoring
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,

    // Server-side integrations
    integrations: [
      // HTTP call tracing
      Sentry.httpIntegration(),
      // Prisma ORM tracing
      Sentry.prismaIntegration(),
    ],

    // Server-specific error filtering
    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      "AbortError",
      "Network Error",
    ],

    // Before-send hook — scrub sensitive data
    beforeSend(event) {
      // Scrub headers that may contain secrets
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        const sensitiveHeaders = [
          "authorization",
          "cookie",
          "x-api-key",
          "x-auth-token",
          "x-secret",
        ];
        for (const header of sensitiveHeaders) {
          if (headers[header]) {
            headers[header] = "[REDACTED]";
          }
        }
      }

      // Scrub user PII
      if (event.user) {
        delete (event.user as Record<string, unknown>).email;
        delete (event.user as Record<string, unknown>).ip_address;
      }

      return event;
    },

    // Enable debug in development
    debug: SENTRY_ENVIRONMENT === "development",
  });
}
