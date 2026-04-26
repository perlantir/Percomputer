/**
 * GET /api/metrics — Prometheus Metrics Endpoint
 * ================================================
 * Exposes application metrics in Prometheus text format.
 *
 * Authentication:
 *   - Access is restricted via METRICS_API_TOKEN bearer token (if set).
 *   - Without METRICS_API_TOKEN, endpoint is publicly readable (dev only).
 *
 * Metrics include:
 *   - http_request_duration_seconds   API request latencies
 *   - http_request_total              Request counts
 *   - http_request_errors_total       Error counts
 *   - agent_workflow_runs_total       Workflow executions
 *   - agent_tasks_total               Task executions
 *   - agent_tokens_consumed_total     Token usage
 *   - agent_cost_credits_total        Cost tracking
 *   - rate_limit_hits_total           Rate-limit events
 *   - db_operation_duration_seconds   DB latency
 *   - nodejs_*                        Node.js runtime metrics
 *   - app_build_info                  Build metadata
 */

import { NextRequest } from "next/server";
import { getMetrics, getMetricsContentType } from "@/src/lib/metrics";

const METRICS_API_TOKEN = process.env.METRICS_API_TOKEN;
const METRICS_ENABLED = process.env.METRICS_ENABLED !== "false";

/**
 * Verify bearer token for metrics access.
 */
function isAuthorized(req: NextRequest): boolean {
  if (!METRICS_API_TOKEN) return true; // No token configured = allow (dev mode)
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return token === METRICS_API_TOKEN;
}

export const runtime = "nodejs"; // prom-client requires Node.js runtime

/**
 * GET handler — return Prometheus-formatted metrics.
 */
export async function GET(req: NextRequest): Promise<Response> {
  if (!METRICS_ENABLED) {
    return new Response("Metrics disabled\n", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (!isAuthorized(req)) {
    return new Response("Unauthorized\n", {
      status: 401,
      headers: {
        "Content-Type": "text/plain",
        "WWW-Authenticate": 'Bearer realm="metrics"',
      },
    });
  }

  try {
    const metrics = await getMetrics();
    return new Response(metrics, {
      status: 200,
      headers: {
        "Content-Type": getMetricsContentType(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Metrics collection failed";
    return new Response(`# Error collecting metrics\n# ${message}\n`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * HEAD handler — lightweight check for monitoring probes.
 */
export async function HEAD(req: NextRequest): Promise<Response> {
  if (!METRICS_ENABLED) {
    return new Response(null, { status: 404 });
  }

  if (!isAuthorized(req)) {
    return new Response(null, {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="metrics"' },
    });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": getMetricsContentType(),
      "X-Prometheus-Meta": "metrics-ready",
    },
  });
}
