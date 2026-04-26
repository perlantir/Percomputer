/**
 * GET /api/clarifications/[id] — Clarification detail
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const clarification = db.getClarification(params.id);
    if (!clarification) {
      return errorResponse("Clarification not found", 404);
    }
    const workflow = db.getWorkflow(clarification.workflow_id);
    if (!workflow || workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }
    return jsonResponse(clarification);
  })
);

export function OPTIONS() {
  return corsPreflight();
}
