/**
 * GET /api/workflows/[id] — Workflow detail with current DAG
 * PATCH /api/workflows/[id] — Update workflow (amend, pause, resume)
 * DELETE /api/workflows/[id] — Cancel workflow
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
  errorResponse,
  validateRequest,
  corsPreflight,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

const patchWorkflowSchema = z.object({
  objective: z.string().min(1).max(5000).optional(),
  status: z.enum(["paused", "running", "amending", "cancelled"]).optional(),
  budget_credits: z.number().positive().max(1000).optional(),
  deadline: z.string().datetime().optional().nullable(),
  policy_overrides: z
    .object({
      max_depth: z.number().int().min(1).max(10).optional(),
      min_model_tier: z.enum(["budget", "standard", "premium", "elite"]).optional(),
      auto_retry: z.boolean().optional(),
      human_approval: z.enum(["none", "critical", "all"]).optional(),
      max_parallel: z.number().int().min(1).max(20).optional(),
      timeout_seconds: z.number().int().min(30).max(3600).optional(),
    })
    .optional(),
});

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const workflow = db.getWorkflow(params.id);
    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }
    if (workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const tasks = db.listTasksByWorkflow(params.id);
    const artifacts = db.listArtifactsByWorkflow(params.id);
    const clarifications = db.listClarificationsByWorkflow(params.id);

    return jsonResponse({
      ...workflow,
      tasks,
      artifacts,
      clarifications,
    });
  })
);

export const PATCH = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const workflow = db.getWorkflow(params.id);
    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }
    if (workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const validated = await validateRequest(_req, patchWorkflowSchema);
    if (!validated.success) return validated.response;

    const body = validated.data;
    const updates: Parameters<typeof db.updateWorkflow>[1] = {};

    if (body.objective !== undefined) updates.objective = body.objective;
    if (body.budget_credits !== undefined) updates.budget_credits = body.budget_credits;
    if (body.deadline !== undefined) updates.deadline = body.deadline ?? undefined;
    if (body.policy_overrides !== undefined) {
      updates.policy_overrides = { ...workflow.policy_overrides, ...body.policy_overrides };
    }

    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        queued: ["running", "cancelled"],
        planning: ["cancelled"],
        running: ["paused", "amending", "cancelled"],
        paused: ["running", "amending", "cancelled"],
        amending: ["running", "cancelled"],
        awaiting_clarification: ["running", "cancelled"],
        awaiting_approval: ["running", "cancelled"],
        synthesizing: ["cancelled"],
      };
      const allowed = validTransitions[workflow.status] || [];
      if (!allowed.includes(body.status)) {
        return errorResponse(`Invalid status transition from ${workflow.status} to ${body.status}`, 400);
      }
      updates.status = body.status;
      if (body.status === "cancelled") {
        updates.cancelled_at = new Date().toISOString();
      }
    }

    const updated = db.updateWorkflow(params.id, updates);

    if (body.status) {
      let auditType: any = "workflow.resumed";
      if (body.status === "paused") auditType = "workflow.paused";
      if (body.status === "cancelled") auditType = "workflow.cancelled";
      db.createAuditEvent({
        type: auditType,
        actor_id: ctx.user.id,
        org_id: ctx.orgId,
        workflow_id: params.id,
        details: { status: body.status },
      });
    }

    return jsonResponse(updated);
  })
);

export const DELETE = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const workflow = db.getWorkflow(params.id);
    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }
    if (workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    if (workflow.status === "completed" || workflow.status === "cancelled" || workflow.status === "failed") {
      return errorResponse("Cannot cancel a finished workflow", 400);
    }

    db.updateWorkflow(params.id, { status: "cancelled", cancelled_at: new Date().toISOString() });

    db.createAuditEvent({
      type: "workflow.cancelled",
      actor_id: ctx.user.id,
      org_id: ctx.orgId,
      workflow_id: params.id,
      details: {},
    });

    return jsonResponse({ success: true, id: params.id, status: "cancelled" });
  })
);

export function OPTIONS() {
  return corsPreflight();
}
