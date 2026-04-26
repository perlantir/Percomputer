/**
 * Shared Sentry Utility Module (Safe Wrapper)
 * Falls back to console-based logging when Sentry is not configured.
 */
let Sentry: any = null;
try {
  Sentry = require("@sentry/nextjs");
} catch {
  /* Sentry not installed — console fallback active */
}

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

const isEnabled = !!Sentry && !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export function captureError(error: Error, extras?: Record<string, unknown>): string | null {
  if (isEnabled && Sentry?.captureException) {
    return Sentry.captureException(error, { extra: extras });
  }
  console.error("[Sentry Fallback] Error:", error, extras || "");
  return null;
}

export function setUserContext(user: UserContext | null): void {
  if (isEnabled && Sentry?.setUser) {
    Sentry.setUser(user ? { id: user.id, username: user.username } : null);
  }
}

export async function withTransaction<T>(ctx: TransactionContext, fn: () => Promise<T>): Promise<T> {
  if (!isEnabled) return fn();
  return Sentry?.startTransaction ? Sentry.startTransaction(ctx).finish() || fn() : fn();
}

export function withChildSpan<T>(op: string, description: string, fn: () => T): T {
  if (!isEnabled) return fn();
  return fn();
}

export function addBreadcrumb(message: string, category?: string, level?: string): void {
  if (isEnabled && Sentry?.addBreadcrumb) {
    Sentry.addBreadcrumb({ message, category, level });
  } else {
    console.log(`[Breadcrumb] ${category || "app"}: ${message}`);
  }
}

export function setFeatureFlags(flags: Record<string, boolean>): void {
  if (isEnabled && Sentry?.setTag) {
    Object.entries(flags).forEach(([key, value]) => Sentry.setTag(key, String(value)));
  }
}

export function isSentryEnabled(): boolean {
  return isEnabled;
}

export function getSentryStatus(): { enabled: boolean; dsn: boolean; env: string } {
  return {
    enabled: isEnabled,
    dsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    env: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "unset",
  };
}
