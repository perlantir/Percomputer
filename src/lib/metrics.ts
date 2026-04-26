/**
 * Prometheus Metrics Registry (Safe Wrapper)
 * Falls back to in-memory counters when prom-client is not installed.
 */
let client: any = null;
try {
  client = require("prom-client");
} catch {
  /* prom-client not installed — using in-memory fallback */
}

const isEnabled = !!client;
const fallbackCounters: Map<string, number> = new Map();
const fallbackHistograms: Map<string, number[]> = new Map();

export const register = isEnabled
  ? client.register
  : {
      metrics: async () => {
        const lines: string[] = [];
        fallbackCounters.forEach((value, key) => {
          lines.push(`# TYPE ${key} counter`);
          lines.push(`${key} ${value}`);
        });
        fallbackHistograms.forEach((values, key) => {
          lines.push(`# TYPE ${key} histogram`);
          lines.push(`${key}_sum ${values.reduce((a, b) => a + b, 0)}`);
          lines.push(`${key}_count ${values.length}`);
        });
        return lines.join("\n");
      },
      contentType: "text/plain; version=0.0.4; charset=utf-8",
      clear: () => {
        fallbackCounters.clear();
        fallbackHistograms.clear();
      },
    };

export function createCounter(name: string, help: string, labelNames?: string[]) {
  if (isEnabled) {
    return new client.Counter({ name, help, labelNames: labelNames || [] });
  }
  const key = name;
  return {
    inc: (_labels?: Record<string, string>, value?: number) => {
      fallbackCounters.set(key, (fallbackCounters.get(key) || 0) + (value || 1));
    },
    labels: () => ({
      inc: (value?: number) => {
        fallbackCounters.set(key, (fallbackCounters.get(key) || 0) + (value || 1));
      },
    }),
  };
}

export function createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]) {
  if (isEnabled) {
    return new client.Histogram({ name, help, labelNames: labelNames || [], buckets });
  }
  const key = name;
  return {
    observe: (labelsOrValue: any, value?: number) => {
      const val = typeof labelsOrValue === "number" ? labelsOrValue : value || 0;
      const arr = fallbackHistograms.get(key) || [];
      arr.push(val);
      fallbackHistograms.set(key, arr);
    },
    labels: () => ({
      observe: (value: number) => {
        const arr = fallbackHistograms.get(key) || [];
        arr.push(value);
        fallbackHistograms.set(key, arr);
      },
    }),
  };
}

export function createGauge(name: string, help: string, labelNames?: string[]) {
  if (isEnabled) {
    return new client.Gauge({ name, help, labelNames: labelNames || [] });
  }
  const key = name;
  let value = 0;
  return {
    set: (_labelsOrValue: any, val?: number) => {
      value = typeof _labelsOrValue === "number" ? _labelsOrValue : val || 0;
      fallbackCounters.set(key, value);
    },
    inc: (amount = 1) => {
      value += amount;
      fallbackCounters.set(key, value);
    },
    dec: (amount = 1) => {
      value -= amount;
      fallbackCounters.set(key, value);
    },
  };
}

export const httpRequestDuration = createHistogram(
  "http_request_duration_seconds",
  "HTTP request duration in seconds",
  ["method", "route", "status_code"],
  [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
);

export const httpRequestTotal = createCounter("http_request_total", "Total HTTP requests", ["method", "route", "status_code"]);
export const httpRequestErrorsTotal = createCounter("http_request_errors_total", "Total HTTP request errors", ["route", "status_code"]);
export const agentWorkflowRunsTotal = createCounter("agent_workflow_runs_total", "Total workflow runs", ["status"]);
export const agentTasksTotal = createCounter("agent_tasks_total", "Total agent tasks executed", ["model", "status"]);
export const agentTokensConsumedTotal = createCounter("agent_tokens_consumed_total", "Total tokens consumed", ["model", "token_type"]);
export const agentCostCreditsTotal = createCounter("agent_cost_credits_total", "Total cost in credits", ["model"]);
export const rateLimitHitsTotal = createCounter("rate_limit_hits_total", "Rate limit hits", ["endpoint"]);
export const dbOperationDuration = createHistogram("db_operation_duration_seconds", "Database operation duration", ["operation", "table"], [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]);
export const activeWebsocketConnections = createGauge("active_websocket_connections", "Currently active WebSocket connections");

export function isMetricsEnabled(): boolean {
  return isEnabled;
}
