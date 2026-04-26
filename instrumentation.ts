/**
 * Next.js 15 Runtime Instrumentation Hook
 * Registers Sentry, Prometheus metrics, and any other runtime instrumentation
 * on server start.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // Register Prometheus build-info metric on startup
    try {
      const { setBuildInfo } = await import("@/src/lib/metrics");
      setBuildInfo({
        version: process.env.APP_VERSION || process.env.npm_package_version || "0.1.0",
        commit: process.env.APP_COMMIT || "unknown",
        branch: process.env.APP_BRANCH || "unknown",
      });
    } catch {
      // Metrics module may not be available if prom-client is not installed
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
