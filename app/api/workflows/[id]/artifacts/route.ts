/**
 * GET /api/workflows/[id]/artifacts — List artifacts for a workflow
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const workflow = db.getWorkflow(params.id);
    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }
    if (workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const artifacts = db.listArtifactsByWorkflow(params.id);
    return jsonResponse({ data: artifacts, total: artifacts.length });
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
