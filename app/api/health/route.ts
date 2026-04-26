/**
 * GET /api/health — Health check
 */
import { NextRequest } from "next/server";
import { jsonResponse, corsPreflight, withErrorHandler } from "@/src/lib/api-utils";
const mockHealth = {
  status: "healthy",
  version: "1.2.3",
  uptime_seconds: 86400,
  timestamp: "2024-06-20T10:00:00Z",
  checks: {
    database: { status: "healthy", latency_ms: 12 },
    queue: { status: "healthy", latency_ms: 45 },
    llm_api: { status: "healthy", latency_ms: 234 },
    storage: { status: "healthy", latency_ms: 8 },
    search_index: { status: "healthy", latency_ms: 18 },
  },
};

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const health = {
    ...mockHealth,
    uptime_seconds: mockHealth.uptime_seconds + Math.floor((Date.now() - new Date(mockHealth.timestamp).getTime()) / 1000),
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(health);
});

export function OPTIONS() {
  return corsPreflight();
}
