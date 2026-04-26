/**
 * Datadog Real User Monitoring (RUM) initialization module.
 *
 * Provides typed initialization, global error tracking, user action tracking,
 * and custom view timing for the Next.js App Router.
 *
 * Usage:
 *   import { initDatadogRUM, addRUMError, setRUMUser, addTiming } from "@/src/lib/monitoring/datadog";
 *
 * Env vars required at build time (NEXT_PUBLIC_*):
 *   NEXT_PUBLIC_DD_RUM_APPLICATION_ID  - Datadog RUM application ID
 *   NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN    - Datadog RUM client token
 *   NEXT_PUBLIC_DD_RUM_ENV             - environment tag (prod / staging / dev)
 *   NEXT_PUBLIC_DD_RUM_SERVICE         - service name (default: agent-platform-web)
 *   NEXT_PUBLIC_DD_RUM_VERSION         - app version (default: package.json version)
 *   NEXT_PUBLIC_DD_RUM_SITE            - Datadog site (default: datadoghq.com)
 *   NEXT_PUBLIC_DD_RUM_SAMPLE_RATE     - session sample rate 0-100 (default: 100)
 *   NEXT_PUBLIC_DD_RUM_SESSION_REPLAY  - enable session replay "1" | "0" (default: "0")
 *   NEXT_PUBLIC_DD_RUM_ENABLED         - master switch "true" | "false" (default: "false")
 */

"use client";

import { datadogRum } from "@datadog/browser-rum";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RUMConfig {
  applicationId: string;
  clientToken: string;
  env: string;
  service?: string;
  version?: string;
  site?: string;
  sessionSampleRate?: number;
  sessionReplaySampleRate?: number;
  trackUserInteractions?: boolean;
  trackResources?: boolean;
  trackLongTasks?: boolean;
  defaultPrivacyLevel?: "mask-user-input" | "allow" | "mask";
  enabled?: boolean;
}

export interface RUMUser {
  id: string;
  email?: string;
  name?: string;
  orgId?: string;
  plan?: string;
  [key: string]: string | undefined;
}

export type RUMErrorSource = "source" | "network" | "logger" | "custom";

// ---------------------------------------------------------------------------
// Default constants
// ---------------------------------------------------------------------------

const DEFAULT_SERVICE = "agent-platform-web";
const DEFAULT_SITE = "datadoghq.com";
const DEFAULT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
const DEFAULT_SAMPLE_RATE = 100;
const DEFAULT_REPLAY_SAMPLE_RATE = 0;

// ---------------------------------------------------------------------------
// Helpers: env → typed config
// ---------------------------------------------------------------------------

function getEnvVar(key: string, fallback = ""): string {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key] as string;
  }
  return fallback;
}

function parseEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function parseSampleRate(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : fallback;
}

/**
 * Build RUMConfig from NEXT_PUBLIC_* environment variables.
 * Safe to call on both server and client.
 */
export function buildRUMConfigFromEnv(): RUMConfig | null {
  const applicationId = getEnvVar("NEXT_PUBLIC_DD_RUM_APPLICATION_ID");
  const clientToken = getEnvVar("NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN");
  const env = getEnvVar("NEXT_PUBLIC_DD_RUM_ENV");

  if (!applicationId || !clientToken) {
    return null;
  }

  return {
    applicationId,
    clientToken,
    env: env || "development",
    service: getEnvVar("NEXT_PUBLIC_DD_RUM_SERVICE", DEFAULT_SERVICE),
    version: getEnvVar("NEXT_PUBLIC_DD_RUM_VERSION", DEFAULT_VERSION),
    site: getEnvVar("NEXT_PUBLIC_DD_RUM_SITE", DEFAULT_SITE),
    sessionSampleRate: parseSampleRate(
      getEnvVar("NEXT_PUBLIC_DD_RUM_SAMPLE_RATE"),
      DEFAULT_SAMPLE_RATE,
    ),
    sessionReplaySampleRate: parseSampleRate(
      getEnvVar("NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE"),
      DEFAULT_REPLAY_SAMPLE_RATE,
    ),
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
    enabled: parseEnabled(getEnvVar("NEXT_PUBLIC_DD_RUM_ENABLED")),
  };
}

// ---------------------------------------------------------------------------
// Singleton guard
// ---------------------------------------------------------------------------

let rumInitialized = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize Datadog RUM. Safe to call multiple times — no-ops after first call.
 * Must be called from a client component ("use client").
 */
export function initDatadogRUM(config?: Partial<RUMConfig>): void {
  if (typeof window === "undefined") return;
  if (rumInitialized) return;

  const envConfig = buildRUMConfigFromEnv();
  const resolved: RUMConfig | null = envConfig
    ? { ...envConfig, ...config }
    : config
      ? ({ ...buildFallbackConfig(config), ...config } as RUMConfig)
      : null;

  if (!resolved) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Datadog RUM] Skipped init — no config provided and env vars missing.",
    );
    return;
  }

  if (resolved.enabled === false) {
    // eslint-disable-next-line no-console
    console.log("[Datadog RUM] Skipped init — disabled via config.");
    return;
  }

  try {
    datadogRum.init({
      applicationId: resolved.applicationId,
      clientToken: resolved.clientToken,
      site: resolved.site ?? DEFAULT_SITE,
      service: resolved.service ?? DEFAULT_SERVICE,
      env: resolved.env,
      version: resolved.version ?? DEFAULT_VERSION,
      sessionSampleRate: resolved.sessionSampleRate ?? DEFAULT_SAMPLE_RATE,
      sessionReplaySampleRate:
        resolved.sessionReplaySampleRate ?? DEFAULT_REPLAY_SAMPLE_RATE,
      trackUserInteractions: resolved.trackUserInteractions ?? true,
      trackResources: resolved.trackResources ?? true,
      trackLongTasks: resolved.trackLongTasks ?? true,
      defaultPrivacyLevel: resolved.defaultPrivacyLevel ?? "mask-user-input",
      // Next.js-specific: start on route transitions
      allowedTracingUrls: [],
    });

    rumInitialized = true;
    // eslint-disable-next-line no-console
    console.log(
      `[Datadog RUM] Initialized (${resolved.env} / ${resolved.version}).`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Datadog RUM] Init failed:", err);
  }
}

/**
 * Manually record a view change (useful for SPA route transitions).
 */
export function startRUMView(viewName: string): void {
  if (!rumInitialized) return;
  try {
    datadogRum.startView(viewName);
  } catch {
    /* silently ignore if RUM not ready */
  }
}

/**
 * Attach user context to RUM sessions.
 */
export function setRUMUser(user: RUMUser): void {
  if (!rumInitialized) return;
  try {
    datadogRum.setUser({
      id: user.id,
      email: user.email,
      name: user.name,
      org_id: user.orgId,
      plan: user.plan,
      ...user,
    });
  } catch {
    /* silently ignore */
  }
}

/**
 * Clear user context on logout.
 */
export function clearRUMUser(): void {
  if (!rumInitialized) return;
  try {
    datadogRum.clearUser();
  } catch {
    /* silently ignore */
  }
}

/**
 * Record a custom action (e.g. "submit_prompt", "switch_model").
 */
export function addRUMAction(name: string, context?: Record<string, unknown>): void {
  if (!rumInitialized) return;
  try {
    datadogRum.addAction(name, context);
  } catch {
    /* silently ignore */
  }
}

/**
 * Record an error manually (e.g. from a caught exception).
 */
export function addRUMError(
  error: Error | string,
  context?: Record<string, unknown>,
  source: RUMErrorSource = "custom",
): void {
  if (!rumInitialized) return;
  try {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    datadogRum.addError(errorObj, { source, ...context });
  } catch {
    /* silently ignore */
  }
}

/**
 * Add a custom timing metric (e.g. "time_to_first_response").
 */
export function addTiming(name: string, time?: number): void {
  if (!rumInitialized) return;
  try {
    datadogRum.addTiming(name, time);
  } catch {
    /* silently ignore */
  }
}

/**
 * Add custom global context that will be attached to every RUM event.
 */
export function addRUMGlobalContext(context: Record<string, unknown>): void {
  if (!rumInitialized) return;
  try {
    datadogRum.setGlobalContextProperty("custom", context);
  } catch {
    /* silently ignore */
  }
}

/**
 * Check whether RUM has been successfully initialized.
 */
export function isRUMInitialized(): boolean {
  return rumInitialized;
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function buildFallbackConfig(
  partial: Partial<RUMConfig>,
): Partial<RUMConfig> {
  return {
    service: DEFAULT_SERVICE,
    site: DEFAULT_SITE,
    version: DEFAULT_VERSION,
    sessionSampleRate: DEFAULT_SAMPLE_RATE,
    sessionReplaySampleRate: DEFAULT_REPLAY_SAMPLE_RATE,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
    ...partial,
  };
}
