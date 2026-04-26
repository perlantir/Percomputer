/**
 * Prometheus Metrics Registry
 * ============================
 * Central metrics collector for the Multi-Model Agent Platform.
 * Uses prom-client to collect Node.js + custom application metrics.
 *
 * Metrics exposed:
 *   - http_request_duration_seconds   (Histogram)   API request latencies by method/route/status
 *   - http_request_total              (Counter)     Total API requests by method/route/status
 *   - http_request_errors_total       (Counter)     Total API errors by route/status
 *   - nodejs_*                        (default)     Node.js process/memory/GC metrics
 *   - agent_workflow_runs_total       (Counter)     Workflow executions by status
 *   - agent_tasks_total               (Counter)     Task executions by model/status
 *   - agent_tokens_consumed_total     (Counter)     Token usage by model
 *   - agent_cost_credits_total        (Counter)     Cost credits by model
 *   - active_websocket_connections    (Gauge)       Current WebSocket connections
 *   - rate_limit_hits_total           (Counter)     Rate-limit rejections by endpoint
 */

import client from "prom-client";

// ---------------------------------------------------------------------------
// Registry Setup
// ---------------------------------------------------------------------------

/** Global metrics registry */
export const register = new client.Registry();

/** Attach default Node.js metrics (event loop, memory, CPU, GC) */
client.collectDefaultMetrics({
  register,
  prefix: "nodejs_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ---------------------------------------------------------------------------
// HTTP Request Metrics
// ---------------------------------------------------------------------------

/** HTTP request duration in seconds (histogram) */
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/** Total HTTP requests (counter) */
export const httpRequestTotal = new client.Counter({
  name: "http_request_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/** Total HTTP errors (counter) */
export const httpRequestErrorsTotal = new client.Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors (4xx/5xx)",
  labelNames: ["route", "status_code"],
  registers: [register],
});

// ---------------------------------------------------------------------------
// Application / Business Metrics
// ---------------------------------------------------------------------------

/** Workflow runs total (counter) */
export const workflowRunsTotal = new client.Counter({
  name: "agent_workflow_runs_total",
  help: "Total number of workflow executions",
  labelNames: ["status"],
  registers: [register],
});

/** Task executions total (counter) */
export const agentTasksTotal = new client.Counter({
  name: "agent_tasks_total",
  help: "Total number of agent task executions",
  labelNames: ["model", "status"],
  registers: [register],
});

/** Token consumption total (counter) */
export const agentTokensConsumedTotal = new client.Counter({
  name: "agent_tokens_consumed_total",
  help: "Total number of tokens consumed",
  labelNames: ["model", "token_type"],
  registers: [register],
});

/** Cost credits total (counter) */
export const agentCostCreditsTotal = new client.Counter({
  name: "agent_cost_credits_total",
  help: "Total cost credits consumed",
  labelNames: ["model"],
  registers: [register],
});

/** Active connections gauge (for WebSocket/presence) */
export const activeConnectionsGauge = new client.Gauge({
  name: "active_websocket_connections",
  help: "Number of currently active WebSocket connections",
  registers: [register],
});

/** Rate-limit rejections (counter) */
export const rateLimitHitsTotal = new client.Counter({
  name: "rate_limit_hits_total",
  help: "Total number of rate-limited requests",
  labelNames: ["endpoint"],
  registers: [register],
});

/** DB operation latency (histogram) */
export const dbOperationDuration = new client.Histogram({
  name: "db_operation_duration_seconds",
  help: "Duration of database operations in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a Next.js pathname into a stable route label for metrics.
 * Replaces dynamic segments like [id] with their param name.
 */
export function normalizeRoute(pathname: string): string {
  // Collapse UUIDs and hex IDs
  return pathname
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid")
    .replace(/\/[0-9a-f]{24}/gi, "/:id")
    .replace(/\/w\/[^\/]+/g, "/w/:id")
    .replace(/\/spaces\/[^\/]+/g, "/spaces/:id");
}

/**
 * Record an HTTP request in Prometheus metrics.
 * Call this after the response has been generated.
 */
export function recordHttpRequest(props: {
  method: string;
  pathname: string;
  statusCode: number;
  durationMs: number;
}): void {
  const route = normalizeRoute(props.pathname);
  const durationSec = props.durationMs / 1000;
  const status = String(props.statusCode);

  httpRequestDuration.observe(
    { method: props.method, route, status_code: status },
    durationSec
  );

  httpRequestTotal.inc(
    { method: props.method, route, status_code: status },
    1
  );

  if (props.statusCode >= 400) {
    httpRequestErrorsTotal.inc({ route, status_code: status }, 1);
  }
}

/**
 * Record a rate-limit rejection.
 */
export function recordRateLimitHit(endpoint: string): void {
  rateLimitHitsTotal.inc({ endpoint: normalizeRoute(endpoint) }, 1);
}

/**
 * Record a workflow run.
 */
export function recordWorkflowRun(status: "success" | "error" | "cancelled"): void {
  workflowRunsTotal.inc({ status }, 1);
}

/**
 * Record an agent task execution.
 */
export function recordAgentTask(props: {
  model: string;
  status: "success" | "error" | "timeout";
  inputTokens: number;
  outputTokens: number;
  costCredits: number;
}): void {
  agentTasksTotal.inc({ model: props.model, status: props.status }, 1);
  agentTokensConsumedTotal.inc(
    { model: props.model, token_type: "input" },
    props.inputTokens
  );
  agentTokensConsumedTotal.inc(
    { model: props.model, token_type: "output" },
    props.outputTokens
  );
  agentCostCreditsTotal.inc({ model: props.model }, props.costCredits);
}

/**
 * Record DB operation duration.
 */
export async function recordDbOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const end = dbOperationDuration.startTimer({ operation, table });
  try {
    const result = await fn();
    return result;
  } finally {
    end();
  }
}

/**
 * Update active WebSocket connections gauge.
 */
export function setActiveConnections(count: number): void {
  activeConnectionsGauge.set(count);
}

/**
 * Build info metric (set once at startup).
 */
export function setBuildInfo(props: {
  version: string;
  commit?: string;
  branch?: string;
}): void {
  const buildInfoGauge = new client.Gauge({
    name: "app_build_info",
    help: "Application build information",
    labelNames: ["version", "commit", "branch"],
    registers: [register],
  });
  buildInfoGauge.set(
    {
      version: props.version,
      commit: props.commit || "unknown",
      branch: props.branch || "unknown",
    },
    1
  );
}

/**
 * Format metrics for Prometheus scraping (text/plain).
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Return Content-Type header for Prometheus text format.
 */
export function getMetricsContentType(): string {
  return register.contentType;
}
