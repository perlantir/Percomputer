/**
 * POST /api/workflows — Create and start a workflow
 * GET /api/workflows — List workflows with pagination
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
  errorResponse,
  validateRequest,
  parseQueryParams,
  safeParseInt,
  corsPreflight,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";
import { generateWorkflowDAG, generateId } from "@/src/mock/generators";

const createWorkflowSchema = z.object({
  objective: z.string().min(1).max(5000),
  space_id: z.string().min(1),
  budget_credits: z.number().positive().max(1000).optional(),
  deadline: z.string().datetime().optional(),
  deliverable_kinds: z.array(z.enum(["answer", "code", "report", "csv", "image", "pdf", "json", "markdown"])).optional(),
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
  context: z
    .object({
      message_history: z
        .array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
            timestamp: z.string().optional(),
          })
        )
        .optional(),
      attachments: z
        .array(
          z.object({
            id: z.string(),
            kind: z.enum(["text", "code", "csv", "image", "pdf", "json", "markdown", "link"]),
            name: z.string(),
            url: z.string(),
            size: z.number(),
          })
        )
        .optional(),
      prior_workflow_id: z.string().optional(),
    })
    .optional(),
});

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const validated = await validateRequest(req, createWorkflowSchema);
    if (!validated.success) return validated.response;

    const body = validated.data;
    const space = db.getSpace(body.space_id);
    if (!space) {
      return errorResponse("Space not found", 404);
    }

    const workflow = db.createWorkflow({
      objective: body.objective,
      space_id: body.space_id,
      org_id: ctx.orgId,
      owner_id: ctx.user.id,
      status: "queued",
      budget_credits: body.budget_credits ?? 50,
      spent_credits: 0,
      deadline: body.deadline,
      deliverable_kinds: body.deliverable_kinds ?? ["answer"],
      policy_overrides: body.policy_overrides,
      context: body.context,
    });

    // Seed initial plan task
    const planTask = db.createTask({
      workflow_id: workflow.id,
      name: "Plan workflow execution",
      description: "Generate initial DAG and assign models to sub-tasks",
      status: "pending",
      dependencies: [],
      tools_used: [],
      input_tokens: 0,
      output_tokens: 0,
      cost_credits: 0,
      depth: 0,
      retry_count: 0,
    });

    // Generate mock DAG
    const dag = generateWorkflowDAG(workflow.id, [planTask]);
    db.updateWorkflow(workflow.id, { dag, status: "planning" });

    db.createAuditEvent({
      type: "workflow.created",
      actor_id: ctx.user.id,
      org_id: ctx.orgId,
      workflow_id: workflow.id,
      details: { objective: body.objective, space_id: body.space_id },
      ip_address: "127.0.0.1",
      user_agent: "Mozilla/5.0",
    });

    const updated = db.getWorkflow(workflow.id)!;
    return jsonResponse(updated, 201);
  })
);

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const params = parseQueryParams(req);
    const limit = safeParseInt(params.limit, 20);
    const offset = safeParseInt(params.offset, 0);
    const { data, total } = db.listWorkflows({
      status: params.status,
      space: params.space,
      kind: params.kind,
      from: params.from,
      to: params.to,
      limit,
      offset,
      orgId: ctx.orgId,
    });

    return jsonResponse({
      data,
      total,
      limit,
      offset,
    });
  })
);

export function OPTIONS() {
  return corsPreflight();
}