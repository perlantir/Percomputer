/**
 * Datadog RUM Monitoring (Safe Wrapper)
 * Falls back to no-op when Datadog is not configured.
 */
let datadogRum: any = null;
try {
  datadogRum = require("@datadog/browser-rum");
} catch {
  /* Datadog RUM not installed */
}

const isEnabled =
  !!datadogRum &&
  process.env.NEXT_PUBLIC_DD_RUM_ENABLED === "true" &&
  !!process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID &&
  !!process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN;

export function initDatadogRUM(): void {
  if (!isEnabled || !datadogRum?.datadogRum) return;
  datadogRum.datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID!,
    clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN!,
    site: process.env.NEXT_PUBLIC_DD_RUM_SITE || "datadoghq.com",
    service: "computer-platform",
    env: process.env.NEXT_PUBLIC_DD_RUM_ENV || "production",
    sessionSampleRate: parseInt(process.env.NEXT_PUBLIC_DD_RUM_SAMPLE_RATE || "100"),
    sessionReplaySampleRate: parseInt(process.env.NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE || "0"),
    defaultPrivacyLevel: "mask-user-input",
  });
}

export function addRUMAction(name: string, context?: Record<string, unknown>): void {
  if (isEnabled && datadogRum?.datadogRum?.addAction) {
    datadogRum.datadogRum.addAction(name, context);
  }
}

export function addRUMError(error: Error, context?: Record<string, unknown>): void {
  if (isEnabled && datadogRum?.datadogRum?.addError) {
    datadogRum.datadogRum.addError(error, context);
  } else {
    console.error("[RUM Fallback]", error, context);
  }
}

export function setRUMUser(user: { id: string; name?: string; email?: string }): void {
  if (isEnabled && datadogRum?.datadogRum?.setUser) {
    datadogRum.datadogRum.setUser(user);
  }
}

export function addTiming(name: string, duration: number): void {
  if (isEnabled && datadogRum?.datadogRum?.addTiming) {
    datadogRum.datadogRum.addTiming(name, duration);
  }
}

export function startRUMView(name: string): void {
  if (isEnabled && datadogRum?.datadogRum?.startView) {
    datadogRum.datadogRum.startView(name);
  }
}

export function isDatadogEnabled(): boolean {
  return isEnabled;
}
