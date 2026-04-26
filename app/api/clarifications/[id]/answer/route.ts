/**
 * POST /api/clarifications/[id]/answer — Answer a clarification
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, validateRequest, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

const answerSchema = z.object({
  answer: z.string().min(1).max(5000),
});

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const clarification = db.getClarification(params.id);
    if (!clarification) {
      return errorResponse("Clarification not found", 404);
    }

    const workflow = db.getWorkflow(clarification.workflow_id);
    if (!workflow || workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    if (clarification.answered) {
      return errorResponse("Clarification already answered", 409);
    }

    const validated = await validateRequest(req, answerSchema);
    if (!validated.success) return validated.response;

    const { answer } = validated.data;
    const updated = db.answerClarification(params.id, answer);

    // Resume workflow
    db.updateWorkflow(clarification.workflow_id, { status: "running" });

    db.createAuditEvent({
      type: "clarification.answered",
      actor_id: ctx.user.id,
      org_id: ctx.orgId,
      workflow_id: clarification.workflow_id,
      details: { clarification_id: params.id, answer },
    });

    return jsonResponse(updated);
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
