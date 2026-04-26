/**
 * GET /api/workflows/[id]/events — SSE event stream
 * Server-Sent Events with proper formatting, reconnection support via Last-Event-ID
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, corsPreflight, getCorsOrigin } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";
import { WorkflowEvent, WorkflowStatus } from "@/src/types";

const EVENT_TYPES = [
  "workflow.planned",
  "workflow.amended",
  "workflow.completed",
  "task.started",
  "task.tokens",
  "task.completed",
  "task.failed",
  "artifact.created",
  "clarification.needed",
  "budget.warn",
  "synthesis.token",
];

function generateWorkflowLifecycleEvents(workflowId: string, afterId?: string): WorkflowEvent[] {
  const workflow = db.getWorkflow(workflowId);
  if (!workflow) return [];

  const stored = db.getWorkflowEvents(workflowId, afterId);
  if (stored.length > 0) return stored;

  // If no stored events, generate realistic demo events
  const events: WorkflowEvent[] = [];
  const now = Date.now();

  if (workflow.status === "queued" || workflow.status === "planning") {
    events.push({
      id: `evt-${workflowId}-plan`,
      event: "workflow.planned",
      workflow_id: workflowId,
      data: { plan_version: 1, task_count: 4, depth: 3 },
      timestamp: new Date(now - 30000).toISOString(),
    });
  }

  if (workflow.status === "running" || workflow.status === "synthesizing") {
    events.push({
      id: `evt-${workflowId}-plan`,
      event: "workflow.planned",
      workflow_id: workflowId,
      data: { plan_version: 1, task_count: 4, depth: 3 },
      timestamp: new Date(now - 60000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-task1-start`,
      event: "task.started",
      workflow_id: workflowId,
      task_id: "task-2-1",
      data: { task_name: "Design component API", model: "claude-3-5-sonnet" },
      timestamp: new Date(now - 55000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-task1-tokens`,
      event: "task.tokens",
      workflow_id: workflowId,
      task_id: "task-2-1",
      data: { input_tokens: 2500, output_tokens: 4200, cost: 15.0 },
      timestamp: new Date(now - 40000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-task1-done`,
      event: "task.completed",
      workflow_id: workflowId,
      task_id: "task-2-1",
      data: { result_summary: "Defined props and interfaces for 12 core components" },
      timestamp: new Date(now - 35000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-art1`,
      event: "artifact.created",
      workflow_id: workflowId,
      task_id: "task-2-1",
      data: { artifact_id: "art-3", kind: "code", name: "component-api.ts" },
      timestamp: new Date(now - 34000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-task2-start`,
      event: "task.started",
      workflow_id: workflowId,
      task_id: "task-2-2",
      data: { task_name: "Implement Button and Input", model: "gpt-4o" },
      timestamp: new Date(now - 30000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-synth`,
      event: "synthesis.token",
      workflow_id: workflowId,
      data: { token: "Based on the component API design, I will now implement ", delta: true },
      timestamp: new Date(now - 20000).toISOString(),
    });
  }

  if (workflow.status === "awaiting_clarification") {
    events.push({
      id: `evt-${workflowId}-clar`,
      event: "clarification.needed",
      workflow_id: workflowId,
      data: {
        clarification_id: "clar-1",
        question: "Should the analysis focus on technical safety or policy/ethical frameworks?",
        context: "The objective mentions 'AI safety frameworks' which is ambiguous...",
      },
      timestamp: new Date(now - 30000).toISOString(),
    });
  }

  if (workflow.status === "completed") {
    events.push({
      id: `evt-${workflowId}-plan`,
      event: "workflow.planned",
      workflow_id: workflowId,
      data: { plan_version: 1, task_count: 4, depth: 3 },
      timestamp: new Date(now - 600000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-done`,
      event: "workflow.completed",
      workflow_id: workflowId,
      data: { credits_used: workflow.spent_credits, duration_seconds: 4470, artifacts: 2 },
      timestamp: new Date(now - 1000).toISOString(),
    });
  }

  if (workflow.status === "failed") {
    events.push({
      id: `evt-${workflowId}-fail`,
      event: "task.failed",
      workflow_id: workflowId,
      task_id: "task-5-1",
      data: { error: workflow.error_message || "Unknown error" },
      timestamp: new Date(now - 1000).toISOString(),
    });
    events.push({
      id: `evt-${workflowId}-budget`,
      event: "budget.warn",
      workflow_id: workflowId,
      data: { threshold: workflow.budget_credits, spent: workflow.spent_credits },
      timestamp: new Date(now - 5000).toISOString(),
    });
  }

  if (workflow.status === "paused") {
    events.push({
      id: `evt-${workflowId}-pause`,
      event: "workflow.amended",
      workflow_id: workflowId,
      data: { reason: "User requested pause", plan_version: workflow.current_plan_version },
      timestamp: new Date(now - 30000).toISOString(),
    });
  }

  // If afterId is provided, filter to only events that occur after it
  if (afterId) {
    const idx = events.findIndex((e) => e.id === afterId);
    if (idx !== -1) {
      return events.slice(idx + 1);
    }
  }

  return events;
}

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const workflow = db.getWorkflow(params.id);
    if (!workflow) {
      return errorResponse("Workflow not found", 404);
    }
    if (workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const lastEventId = req.headers.get("last-event-id") || undefined;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const events = generateWorkflowLifecycleEvents(params.id, lastEventId || undefined);

        // Send any missed events first
        for (const event of events) {
          const payload = JSON.stringify({
            ...event.data,
            workflow_id: event.workflow_id,
            task_id: event.task_id,
            timestamp: event.timestamp,
          });
          const chunk = `id: ${event.id}\nevent: ${event.event}\ndata: ${payload}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        }

        // For running workflows, continue emitting live events
        if (workflow.status === "running" || workflow.status === "planning") {
          let tick = 0;
          const interval = setInterval(() => {
            tick++;
            const eventId = `evt-live-${params.id}-${tick}-${Date.now()}`;

            if (tick === 1) {
              const payload = JSON.stringify({
                workflow_id: params.id,
                token: "Synthesizing intermediate results from completed tasks... ",
                delta: true,
                timestamp: new Date().toISOString(),
              });
              controller.enqueue(encoder.encode(`id: ${eventId}\nevent: synthesis.token\ndata: ${payload}\n\n`));
            } else if (tick === 3) {
              const payload = JSON.stringify({
                workflow_id: params.id,
                input_tokens: 1800 + tick * 100,
                output_tokens: 2100 + tick * 50,
                cost: 3.5 + tick * 0.5,
                timestamp: new Date().toISOString(),
              });
              controller.enqueue(encoder.encode(`id: ${eventId}\nevent: task.tokens\ndata: ${payload}\n\n`));
            } else if (tick >= 6) {
              const payload = JSON.stringify({
                workflow_id: params.id,
                message: "Stream closing — workflow continuing in background",
                timestamp: new Date().toISOString(),
              });
              controller.enqueue(encoder.encode(`id: ${eventId}\nevent: stream.close\ndata: ${payload}\n\n`));
              clearInterval(interval);
              controller.close();
            }
          }, 2000);

          req.signal.addEventListener("abort", () => {
            clearInterval(interval);
            controller.close();
          });
        } else {
          // Non-running workflows: close after sending historical events
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": getCorsOrigin(req),
        "X-Accel-Buffering": "no",
      },
    });
  })
);

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}
