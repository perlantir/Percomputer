/**
 * Shared Sentry Utility Module
 * Reusable helpers for error tracking, performance monitoring, and
 * user context management across the Multi-Model Agent Platform.
 *
 * Usage:
 *   import { captureError, setUserContext, withTransaction } from "@/lib/sentry";
 */

import * as Sentry from "@sentry/nextjs";

// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

export interface UserContext {
  id: string;
  username?: string;
  role?: string;
  team?: string;
}

export interface TransactionContext {
  name: string;
  op: string;
  tags?: Record<string, string>;
  data?: Record<string, unknown>;
}

// ------------------------------------------------------------------------------
// Error Capture
// ------------------------------------------------------------------------------

/**
 * Capture an exception with additional context.
 * Use this instead of raw Sentry.captureException for consistent tagging.
 */
export function captureError(
  error: unknown,
  context?: {
    tags?: Record<string, string | number | boolean>;
    extras?: Record<string, unknown>;
    user?: UserContext;
  }
): string | null {
  if (!isSentryEnabled()) return null;

  return Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, String(value));
      });
    }
    if (context?.extras) {
      Object.entries(context.extras).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        username: context.user.username,
        // Never send email to Sentry — PII policy
      });
    }

    const err =
      error instanceof Error
        ? error
        : new Error(typeof error === "string" ? error : JSON.stringify(error));

    return Sentry.captureException(err);
  });
}

/**
 * Capture a message (non-error) to Sentry.
 * Useful for tracking significant business events or warnings.
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: { tags?: Record<string, string>; extras?: Record<string, unknown> }
): string | null {
  if (!isSentryEnabled()) return null;

  return Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    return Sentry.captureMessage(message, level);
  });
}

// ------------------------------------------------------------------------------
// User Context
// ------------------------------------------------------------------------------

/**
 * Set the current user context for all subsequent Sentry events.
 * Call this after successful authentication.
 */
export function setUserContext(user: UserContext): void {
  if (!isSentryEnabled()) return;

  Sentry.setUser({
    id: user.id,
    username: user.username,
    // Intentionally omit email and IP — PII minimization
  });

  // Set role/team as tags for filtering in Sentry UI
  if (user.role) Sentry.setTag("user.role", user.role);
  if (user.team) Sentry.setTag("user.team", user.team);
}

/**
 * Clear the current user context. Call this on logout.
 */
export function clearUserContext(): void {
  if (!isSentryEnabled()) return;
  Sentry.setUser(null);
  Sentry.setTag("user.role", "");
  Sentry.setTag("user.team", "");
}

// ------------------------------------------------------------------------------
// Performance — Transactions & Spans
// ------------------------------------------------------------------------------

/**
 * Wrap a function with a Sentry transaction for performance monitoring.
 *
 * Usage:
 *   const result = await withTransaction(
 *     { name: "api.generate-response", op: "http.server" },
 *     async (span) => {
 *       // ... your async work
 *       return result;
 *     }
 *   );
 */
export async function withTransaction<T>(
  ctx: TransactionContext,
  fn: (span?: Sentry.Span) => Promise<T>
): Promise<T> {
  if (!isSentryEnabled()) return fn();

  return Sentry.startSpan(ctx, async (span) => {
    if (ctx.tags) {
      Object.entries(ctx.tags).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }
    if (ctx.data) {
      Object.entries(ctx.data).forEach(([key, value]) => {
        span.setAttribute(`data.${key}`, JSON.stringify(value));
      });
    }

    try {
      const result = await fn(span);
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({ code: 2 }); // ERROR
      span.recordException(error as Error);
      throw error;
    }
  });
}

/**
 * Create a child span within the current active span.
 * Useful for breaking down large transactions into segments.
 */
export async function withChildSpan<T>(
  op: string,
  description: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isSentryEnabled()) return fn();

  return Sentry.startSpan(
    { op, description },
    async () => fn()
  );
}

// ------------------------------------------------------------------------------
// Breadcrumbs
// ------------------------------------------------------------------------------

/**
 * Add a breadcrumb to the current scope.
 * Breadcrumbs provide a trail of events leading up to an error.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, unknown>
): void {
  if (!isSentryEnabled()) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// ------------------------------------------------------------------------------
// Feature Flag Context
// ------------------------------------------------------------------------------

/**
 * Set feature flag context on the current scope.
 * Helps correlate errors with enabled features.
 */
export function setFeatureFlags(
  flags: Record<string, boolean | string>
): void {
  if (!isSentryEnabled()) return;

  const scope = Sentry.getCurrentScope();
  Object.entries(flags).forEach(([key, value]) => {
    scope.setTag(`feature.${key}`, String(value));
  });
}

// ------------------------------------------------------------------------------
// Health Check
// ------------------------------------------------------------------------------

/**
 * Check if Sentry is enabled and configured.
 */
export function isSentryEnabled(): boolean {
  return Boolean(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  );
}

/**
 * Get a simple health status object for monitoring dashboards.
 */
export function getSentryStatus(): {
  enabled: boolean;
  dsnConfigured: boolean;
  environment: string;
} {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment =
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    "unknown";

  return {
    enabled: Boolean(dsn),
    dsnConfigured: Boolean(dsn),
    environment,
  };
}
