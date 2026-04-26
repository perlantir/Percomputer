/**
 * POST /api/run — Run a sub-agent task (simulation)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, validateRequest, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";
import { generateId } from "@/src/mock/generators";
import { recordAgentTask, recordWorkflowRun } from "@/src/lib/metrics";

const runSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  workflow_id: z.string().optional(),
  max_tokens: z.number().int().min(1).max(64000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const validated = await validateRequest(req, runSchema);
    if (!validated.success) return validated.response;

    const { prompt, model = "gpt-4o", tools = [], workflow_id } = validated.data;

    // Workflow ownership check
    if (workflow_id) {
      const workflow = db.getWorkflow(workflow_id);
      if (!workflow) {
        return errorResponse("Workflow not found", 404, undefined, req);
      }
      if (workflow.orgId !== ctx.orgId) {
        return errorResponse("Forbidden — insufficient permissions", 403, undefined, req);
      }
    }

    // Simulate sub-agent execution
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.floor(500 + Math.random() * 1500);
    const cost = (inputTokens / 1000) * 0.005 + (outputTokens / 1000) * 0.015;

    const taskId = generateId("task");
    const result = `Based on your request, I have analyzed the provided context and generated the following output. This is a simulated sub-agent response for prompt starting with: "${prompt.slice(0, 80)}..."`;

    // If linked to workflow, create a task record
    if (workflow_id) {
      db.createTask({
        workflow_id,
        name: `Sub-agent: ${prompt.slice(0, 60)}`,
        description: prompt,
        status: "completed",
        dependencies: [],
        assigned_model: model,
        actual_model: model,
        tools_used: tools,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_credits: cost,
        depth: 1,
        retry_count: 0,
      });

      // Record workflow + task metrics
      recordWorkflowRun("success");
      recordAgentTask({
        model,
        status: "success",
        inputTokens,
        outputTokens,
        costCredits: parseFloat(cost.toFixed(4)),
      });
    }

    return jsonResponse(
      {
        task_id: taskId,
        status: "completed",
        result,
        citations: [],
        tokens_used: { input: inputTokens, output: outputTokens },
        cost_credits: parseFloat(cost.toFixed(4)),
        model_used: model,
        completed_at: new Date().toISOString(),
      },
      200,
      undefined,
      req
    );
  }) as any
);

exp