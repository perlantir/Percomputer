import { NextRequest, NextResponse } from "next/server";
import { register } from "@/src/lib/metrics";
import { jsonResponse } from "@/src/lib/api-utils";

/**
 * GET /api/metrics
 * Prometheus-compatible metrics endpoint.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.METRICS_API_TOKEN;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        "Content-Type": register.contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return jsonResponse({ error: "Failed to collect metrics" }, 500);
  }
}
