/**
 * GET /api/workflows/[id]/ws — WebSocket-style interactive control endpoint
 * Simulated with HTTP long-polling for static demo.
 * Handles: clarification answers, approval gates, mid-run amendments,
 * cancellation, model overrides.
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

const wsMessageSchema = z.object({
  action: z.enum([
    "clarification.answer",
    "approval.grant",
    "approval.deny",
    "workflow.amend",
    "workflow.cancel",
    "model.override",
    "ping",
  ]),
  payload: z.record(z.any()),
});

export const POST = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const workflow = db.getWorkflow(params.id);
    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }
    if (workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const validated = await validateRequest(_req, wsMessageSchema);
    if (!validated.success) return validated.response;

    const { action, payload } = validated.data;

    switch (action) {
      case "clarification.answer": {
        const { clarification_id, answer } = payload;
        if (!clarification_id || !answer) {
          return errorResponse("Missing clarification_id or answer", 400);
        }
        const updated = db.answerClarification(clarification_id as string, answer as string);
        if (!updated) {
          return errorResponse("Clarification not found", 404);
        }
        db.updateWorkflow(params.id, { status: "running" });
        db.createAuditEvent({
          type: "clarification.answered",
          actor_id: ctx.user.id,
          org_id: ctx.orgId,
          workflow_id: params.id,
          details: { clarification_id, answer },
        });
        return jsonResponse({
          type: "ack",
          action: "clarification.answer",
          data: { clarification_id, answered: true },
        });
      }

      case "approval.grant": {
        const { gate_id } = payload;
        db.createAuditEvent({
          type: "approval.granted",
          actor_id: ctx.user.id,
          org_id: ctx.orgId,
          workflow_id: params.id,
          details: { gate_id },
        });
        return jsonResponse({
          type: "ack",
          action: "approval.grant",
          data: { gate_id, granted: true },
        });
      }

      case "approval.deny": {
        const { gate_id, reason } = payload;
        db.createAuditEvent({
          type: "approval.denied",
          actor_id: ctx.user.id,
          org_id: ctx.orgId,
          workflow_id: params.id,
          details: { gate_id, reason },
        });
        return jsonResponse({
          type: "ack",
          action: "approval.deny",
          data: { gate_id, granted: false, reason },
        });
      }

      case "workflow.amend": {
        const { objective_patch, policy_overrides } = payload;
        db.updateWorkflow(params.id, {
          objective: objective_patch ? `${workflow.objective} [amended: ${objective_patch}]` : workflow.objective,
          policy_overrides: policy_overrides
            ? { ...workflow.policy_overrides, ...(policy_overrides as any) }
            : workflow.policy_overrides,
          status: "amending",
          current_plan_version: workflow.current_plan_version + 1,
        });
        return jsonResponse({
          type: "ack",
          action: "workflow.amend",
          data: { workflow_id: params.id, plan_version: workflow.current_plan_version + 1 },
        });
      }

      case "workflow.cancel": {
        db.updateWorkflow(params.id, { status: "cancelled", cancelled_at: new Date().toISOString() });
        db.createAuditEvent({
          type: "workflow.cancelled",
          actor_id: ctx.user.id,
          org_id: ctx.orgId,
          workflow_id: params.id,
          details: { reason: payload.reason || "User cancelled via control channel" },
        });
        return jsonResponse({
          type: "ack",
          action: "workflow.cancel",
          data: { workflow_id: params.id, status: "cancelled" },
        });
      }

      case "model.override": {
        const { task_id, model_id } = payload;
        if (!task_id || !model_id) {
          return errorResponse("Missing task_id or model_id", 400);
        }
        const task = db.getTask(task_id as string);
        if (!task || task.workflow_id !== params.id) {
          return errorResponse("Task not found in this workflow", 404);
        }
        db.updateTask(task_id as string, { assigned_model: model_id as string });
        return jsonResponse({
          type: "ack",
          action: "model.override",
          data: { task_id, model_id },
        });
      }

      case "ping": {
        return jsonResponse({
          type: "pong",
          timestamp: new Date().toISOString(),
          workflow_id: params.id,
          workflow_status: workflow.status,
        });
      }

      default:
        return errorResponse("Unknown action", 400);
    }
  }) as any
);

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const workflow = db.getWorkflow(params.id);
    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }
    if (workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    // Poll for pending items
    const pendingClarifications = db
      .listClarificationsByWorkflow(params.id)
      .filter((c) => !c.answered);

    return jsonResponse({
      type: "poll",
      workflow_id: params.id,
      workflow_status: workflow.status,
      pending_clarifications: pendingClarifications,
      pending_approvals: [],
      timestamp: new Date().toISOString(),
    });
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
