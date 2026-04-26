import { uuid, iso, ago, addMs, randInt, randFloat } from "./generators";

export type SSEEventType =
  | "workflow.planned"
  | "workflow.amended"
  | "workflow.completed"
  | "workflow.failed"
  | "task.started"
  | "task.tokens"
  | "task.completed"
  | "task.failed"
  | "synthesis.token"
  | "budget.warn"
  | "budget.exceeded"
  | "source.discovered"
  | "artifact.created"
  | "memory.stored";

export interface SSEEvent {
  id: string;
  type: SSEEventType;
  timestamp: string;
  workflowId: string;
  taskId?: string;
  payload: Record<string, unknown>;
}

function makeEvent(
  workflowId: string,
  type: SSEEventType,
  timestamp: Date,
  payload: Record<string, unknown>,
  taskId?: string
): SSEEvent {
  return {
    id: uuid(),
    type,
    timestamp: iso(timestamp),
    workflowId,
    taskId,
    payload,
  };
}

/**
 * Generate a realistic SSE event sequence for a workflow lifecycle.
 */
export function generateWorkflowSSEEvents(
  workflowId: string,
  taskIds: string[],
  startTime: Date = ago(2)
): SSEEvent[] {
  const events: SSEEvent[] = [];
  let cursor = startTime;

  // 1. workflow.planned
  events.push(
    makeEvent(workflowId, "workflow.planned", cursor, {
      version: 1,
      taskCount: taskIds.length,
      estimatedCredits: randFloat(20, 80, 1),
      planSummary: `Planned ${taskIds.length} tasks in DAG`,
    })
  );
  cursor = addMs(cursor, randInt(200, 800));

  // 2. Budget warning early if high estimate
  if (randFloat(0, 1) > 0.6) {
    events.push(
      makeEvent(workflowId, "budget.warn", cursor, {
        budgetCredits: 50,
        spentCredits: 35,
        remainingCredits: 15,
        message: "Budget 70% consumed after planning phase.",
      })
    );
    cursor = addMs(cursor, randInt(100, 300));
  }

  // 3. Task lifecycle for each task
  for (let i = 0; i < taskIds.length; i++) {
    const taskId = taskIds[i];
    const taskDuration = randInt(2000, 180_000);
    const tokensIn = randInt(500, 8000);
    const tokensOut = randInt(200, 4000);

    // task.started
    events.push(
      makeEvent(workflowId, "task.started", cursor, {
        taskId,
        taskIndex: i,
        assignedModel: pickModel(),
        message: `Task ${i + 1}/${taskIds.length} started`,
      },
      taskId)
    );
    cursor = addMs(cursor, randInt(100, 500));

    // synthesis.token (streamed chunks, only for synthesis tasks or randomly)
    if (i === taskIds.length - 1 || randFloat(0, 1) > 0.5) {
      const chunkCount = randInt(3, 12);
      for (let c = 0; c < chunkCount; c++) {
        events.push(
          makeEvent(workflowId, "synthesis.token", cursor, {
            taskId,
            chunkIndex: c,
            totalChunks: chunkCount,
            text: loremChunk(randInt(5, 15)),
          },
          taskId)
        );
        cursor = addMs(cursor, randInt(50, 300));
      }
    }

    // task.tokens
    events.push(
      makeEvent(workflowId, "task.tokens", cursor, {
        taskId,
        inputTokens: tokensIn,
        outputTokens: tokensOut,
        totalTokens: tokensIn + tokensOut,
      },
      taskId)
    );
    cursor = addMs(cursor, taskDuration);

    // source.discovered (randomly)
    if (randFloat(0, 1) > 0.4) {
      const sourceCount = randInt(1, 4);
      for (let s = 0; s < sourceCount; s++) {
        events.push(
          makeEvent(workflowId, "source.discovered", cursor, {
            taskId,
            sourceId: uuid(),
            domain: pickDomain(),
            title: `Source ${s + 1} for task ${i + 1}`,
            url: `https://${pickDomain()}/article-${randInt(1000, 9999)}`,
          },
          taskId)
        );
        cursor = addMs(cursor, randInt(50, 200));
      }
    }

    // task.completed or task.failed (90% success rate)
    const success = randFloat(0, 1) < 0.92;
    events.push(
      makeEvent(
        workflowId,
        success ? "task.completed" : "task.failed",
        cursor,
        {
          taskId,
          durationMs: taskDuration,
          creditsUsed: randFloat(0.5, 3.5, 2),
          ...(success
            ? { status: "succeeded" }
            : { status: "failed", error: "LLM timeout after 120s", retryable: true }),
        },
        taskId
      )
    );
    cursor = addMs(cursor, randInt(200, 1000));

    // artifact.created (randomly)
    if (success && randFloat(0, 1) > 0.5) {
      events.push(
        makeEvent(workflowId, "artifact.created", cursor, {
          taskId,
          artifactId: uuid(),
          name: `artifact_${i + 1}.md`,
          type: "text/markdown",
          sizeBytes: randInt(1024, 5_000_000),
        },
        taskId)
      );
      cursor = addMs(cursor, randInt(100, 400));
    }

    // workflow.amended between tasks (occasionally)
    if (i < taskIds.length - 1 && randFloat(0, 1) > 0.75) {
      events.push(
        makeEvent(workflowId, "workflow.amended", cursor, {
          version: 2,
          reason: "Additional research required on emerging topic",
          addedTasks: 1,
          removedTasks: 0,
        })
      );
      cursor = addMs(cursor, randInt(300, 1000));
    }

    // budget.warn between tasks
    if (i === Math.floor(taskIds.length / 2)) {
      events.push(
        makeEvent(workflowId, "budget.warn", cursor, {
          budgetCredits: 50,
          spentCredits: 42,
          remainingCredits: 8,
          message: "Budget 84% consumed at midpoint.",
        })
      );
      cursor = addMs(cursor, randInt(100, 300));
    }
  }

  // 4. workflow.completed or workflow.failed
  const allSucceeded = events.filter((e) => e.type === "task.failed").length === 0;
  events.push(
    makeEvent(
      workflowId,
      allSucceeded ? "workflow.completed" : "workflow.failed",
      cursor,
      {
        totalTasks: taskIds.length,
        completedTasks: taskIds.length,
        failedTasks: events.filter((e) => e.type === "task.failed").length,
        totalCredits: randFloat(25, 75, 2),
        totalDurationMs: cursor.getTime() - startTime.getTime(),
        finalStatus: allSucceeded ? "succeeded" : "partial_failure",
      }
    )
  );

  // 5. memory.stored (episodic memory)
  events.push(
    makeEvent(workflowId, "memory.stored", addMs(cursor, randInt(100, 500)), {
      memoryId: uuid(),
      type: "episodic",
      content: `Extracted key insight from workflow ${workflowId}`,
      tokensUsed: randInt(500, 3000),
    })
  );

  return events;
}

// ── helpers ─────────────────────────────────────────────────────────────────

const MODEL_POOL = [
  "claude-opus-4.7",
  "claude-sonnet-4.6",
  "gpt-5.2",
  "gpt-5.1",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "codestral-22b",
  "deepseek-coder",
];

const DOMAIN_POOL = [
  "bloomberg.com",
  "reuters.com",
  "ft.com",
  "sec.gov",
  "arxiv.org",
  "github.com",
  "techcrunch.com",
  "crunchbase.com",
  "glassnode.com",
  "coinmetrics.io",
];

function pickModel(): string {
  return MODEL_POOL[Math.floor(Math.random() * MODEL_POOL.length)];
}

function pickDomain(): string {
  return DOMAIN_POOL[Math.floor(Math.random() * DOMAIN_POOL.length)];
}

const LOREM =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");

function loremChunk(n: number): string {
  const words: string[] = [];
  for (let i = 0; i < n; i++) {
    words.push(LOREM[i % LOREM.length]);
  }
  return words.join(" ") + ".";
}

/**
 * Pre-generated event sequences for demo workflows.
 */
export const DEMO_SSE_EVENT_SEQUENCES: Record<string, SSEEvent[]> = {};

// Generate event sequences for all 15 workflows lazily via helper
export function ensureEventsForWorkflow(workflowId: string, taskCount: number): SSEEvent[] {
  if (!DEMO_SSE_EVENT_SEQUENCES[workflowId]) {
    const taskIds = Array.from({ length: taskCount }, () => uuid());
    DEMO_SSE_EVENT_SEQUENCES[workflowId] = generateWorkflowSSEEvents(workflowId, taskIds, ago(randFloat(1, 30)));
  }
  return DEMO_SSE_EVENT_SEQUENCES[workflowId];
}
