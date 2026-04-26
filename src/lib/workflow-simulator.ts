/**
 * Workflow Execution Simulator
 *
 * Generates realistic workflow lifecycles:
 * 1. Creates plan (DAG of tasks)
 * 2. Simulates task execution with varying delays
 * 3. Produces events: task.started, task.tokens, task.completed, artifact.created
 * 4. Handles failures and retries
 * 5. Generates synthesis tokens
 * 6. Produces final workflow.completed event
 * 7. Configurable speed multiplier
 */

import type {
  WorkflowId,
  TaskId,
  TaskKind,
  TaskStatus,
  ArtifactKind,
  WorkflowStatus,
  ServerSentEvent,
  TaskEvent,
  WorkflowEvent,
  ArtifactEvent,
  BudgetEvent,
  SynthesisTokenEvent,
  ArtifactId,
  PlanRevisionId,
} from '@/src/types';
import type { TaskSpec } from '@/src/types';
import { autoSuggestPlan, getTaskTemplate } from './task-templates';
import { selectModel, simulateLatency, estimateCost } from './model-router';
import { invokeTool, formatToolResult, type ToolResult } from './tool-gateway';

// ─────────────────────────────────────────────────────────────────────────────
// Simulator config
// ─────────────────────────────────────────────────────────────────────────────

export interface SimulatorConfig {
  /** Speed up (>1) or slow down (<1) all delays. */
  speedMultiplier: number;
  /** Probability any individual task fails on first attempt (0–1). */
  taskFailureRate: number;
  /** Probability the overall workflow fails irrecoverably. */
  workflowFailureRate: number;
  /** Number of synthesis tokens to emit. */
  synthesisTokenCount: number;
  /** Whether to emit budget events. */
  emitBudgetEvents: boolean;
  /** Whether tasks produce artifacts. */
  emitArtifacts: boolean;
  /** Delay between events in ms (minimum). */
  minEventDelayMs: number;
  /** Random seed for reproducibility (optional). */
  seed?: number;
}

const DEFAULT_CONFIG: SimulatorConfig = {
  speedMultiplier: 1.0,
  taskFailureRate: 0.08,
  workflowFailureRate: 0.02,
  synthesisTokenCount: 180,
  emitBudgetEvents: true,
  emitArtifacts: true,
  minEventDelayMs: 60,
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal state
// ─────────────────────────────────────────────────────────────────────────────

interface SimTask {
  readonly localId: string;
  readonly title: string;
  readonly kind: TaskKind;
  readonly instruction: string;
  readonly modelId: string;
  readonly modelDisplayName: string;
  status: TaskStatus;
  attemptNumber: number;
  maxAttempts: number;
  startedAt: number | null;
  finishedAt: number | null;
  durationMs: number;
  artifactCount: number;
  /** Upstream localIds this task depends on. */
  readonly dependencies: string[];
}

interface SimState {
  workflowId: WorkflowId;
  prompt: string;
  status: WorkflowStatus;
  tasks: SimTask[];
  taskMap: Map<string, SimTask>;
  edges: { from: string; to: string }[];
  events: ServerSentEvent[];
  budgetCents: number;
  budgetLimitCents: number;
  cancelled: boolean;
  failedTaskId: string | null;
  startTime: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeded random for reproducibility
// ─────────────────────────────────────────────────────────────────────────────

function makeRng(seed?: number) {
  let s = seed ?? Math.floor(Math.random() * 1_000_000);
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event builders
// ─────────────────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Branded ID constructors
// ─────────────────────────────────────────────────────────────────────────────

function toTaskId(id: string): TaskId {
  return id as unknown as TaskId;
}

function toArtifactId(id: string): ArtifactId {
  return id as unknown as ArtifactId;
}

function toPlanRevisionId(id: string): PlanRevisionId {
  return id as unknown as PlanRevisionId;
}

function makeWorkflowQueued(workflowId: WorkflowId, position: number): WorkflowEvent {
  return { type: 'workflow_queued', workflowId, positionInQueue: position, emittedAt: nowIso() };
}

function makeWorkflowPlanning(workflowId: WorkflowId, modelId: string): WorkflowEvent {
  return { type: 'workflow_planning', workflowId, modelId, emittedAt: nowIso() };
}

function makeWorkflowPlanned(workflowId: WorkflowId, revisionId: string, taskCount: number): WorkflowEvent {
  return { type: 'workflow_planned', workflowId, planRevisionId: toPlanRevisionId(revisionId), taskCount, emittedAt: nowIso() };
}

function makeWorkflowCompleted(workflowId: WorkflowId, durationMs: number): WorkflowEvent {
  return { type: 'workflow_completed', workflowId, durationMs, emittedAt: nowIso() };
}

function makeWorkflowFailed(workflowId: WorkflowId, reason: string, failingTaskId: string | null): WorkflowEvent {
  return { type: 'workflow_failed', workflowId, reason, failingTaskId: failingTaskId ? toTaskId(failingTaskId) : null, emittedAt: nowIso() };
}

function makeWorkflowCancelling(workflowId: WorkflowId): WorkflowEvent {
  return { type: 'workflow_cancelling', workflowId, emittedAt: nowIso() };
}

function makeWorkflowCancelled(workflowId: WorkflowId, reason: string): WorkflowEvent {
  return { type: 'workflow_cancelled', workflowId, reason, emittedAt: nowIso() };
}

function makeTaskStatus(
  workflowId: WorkflowId,
  taskId: string,
  status: TaskStatus,
  previous: TaskStatus,
  reason?: string
): TaskEvent {
  return { type: 'task_status', workflowId, taskId: toTaskId(taskId), status, previousStatus: previous, reason: reason ?? null, emittedAt: nowIso() };
}

function makeTaskRunning(
  workflowId: WorkflowId,
  taskId: string,
  modelId: string,
  attemptNumber: number
): TaskEvent {
  return { type: 'task_running', workflowId, taskId: toTaskId(taskId), modelId, attemptNumber, emittedAt: nowIso() };
}

function makeTaskLog(
  workflowId: WorkflowId,
  taskId: string,
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string
): TaskEvent {
  return { type: 'task_log', workflowId, taskId: toTaskId(taskId), level, message, emittedAt: nowIso() };
}

function makeArtifactCreated(
  workflowId: WorkflowId,
  taskId: string,
  artifactId: string,
  kind: ArtifactKind,
  name: string
): ArtifactEvent {
  return { type: 'artifact_created', workflowId, taskId: toTaskId(taskId), artifactId: toArtifactId(artifactId), kind, name, previewUrl: null, emittedAt: nowIso() };
}

function makeBudgetEvent(workflowId: WorkflowId, currentCents: number, budgetCents: number): BudgetEvent {
  const pct = Math.min(100, Math.round((currentCents / budgetCents) * 100));
  return { type: 'budget', workflowId, currentCostCents: currentCents, budgetCents, percentUsed: pct, emittedAt: nowIso() };
}

function makeSynthesisToken(workflowId: WorkflowId, taskId: string, token: string): SynthesisTokenEvent {
  return { type: 'synthesis_token', workflowId, taskId: toTaskId(taskId), token, emittedAt: nowIso() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation engine
// ─────────────────────────────────────────────────────────────────────────────

function id(prefix: string, n: number): string {
  return `${prefix}_${n.toString().padStart(4, '0')}`;
}

/** Build simulation state from a user prompt. */
export function buildSimulation(
  workflowId: WorkflowId,
  prompt: string,
  cfg: Partial<SimulatorConfig> = {}
): SimState {
  const config = { ...DEFAULT_CONFIG, ...cfg };
  const rng = makeRng(config.seed);

  const plan = autoSuggestPlan(prompt);
  const tasks: SimTask[] = plan.tasks.map((t, i) => {
    const model = selectModel({ kind: t.kind, tierHint: t.constraints.preferredTier ?? null });
    return {
      localId: t.localId,
      title: t.title,
      kind: t.kind,
      instruction: t.instruction,
      modelId: model.id,
      modelDisplayName: model.displayName,
      status: 'pending',
      attemptNumber: 0,
      maxAttempts: t.constraints.maxAttempts ?? 3,
      startedAt: null,
      finishedAt: null,
      durationMs: 0,
      artifactCount: 0,
      dependencies: plan.edges.filter((e) => e.toLocalId === t.localId).map((e) => e.fromLocalId),
    };
  });

  return {
    workflowId,
    prompt,
    status: 'queued',
    tasks,
    taskMap: new Map(tasks.map((t) => [t.localId, t])),
    edges: plan.edges.map((e) => ({ from: e.fromLocalId, to: e.toLocalId })),
    events: [],
    budgetCents: 0,
    budgetLimitCents: 500,
    cancelled: false,
    failedTaskId: null,
    startTime: 0,
  };
}

/** Run the full simulation and return all events. */
export async function runSimulation(
  state: SimState,
  onEvent?: (event: ServerSentEvent) => void,
  cfg: Partial<SimulatorConfig> = {}
): Promise<ServerSentEvent[]> {
  const config = { ...DEFAULT_CONFIG, ...cfg };
  const rng = makeRng(config.seed);
  const delay = (ms: number) => sleep(Math.max(config.minEventDelayMs, ms * config.speedMultiplier));

  // ── Phase 0: queued ──
  state.status = 'queued';
  pushEvent(state, makeWorkflowQueued(state.workflowId, 1));
  await delay(300 + rng() * 400);

  // ── Phase 1: planning ──
  state.status = 'planning';
  const plannerModel = selectModel({ kind: 'synthesize', tierHint: 'reasoning' });
  pushEvent(state, makeWorkflowPlanning(state.workflowId, plannerModel.id));
  await delay(800 + rng() * 1200);

  const revisionId = id('rev', 1);
  pushEvent(state, makeWorkflowPlanned(state.workflowId, revisionId, state.tasks.length));
  await delay(400 + rng() * 300);

  // ── Phase 2: running ──
  state.status = 'running';
  state.startTime = Date.now();

  if (config.emitBudgetEvents) {
    pushEvent(state, makeBudgetEvent(state.workflowId, 0, state.budgetLimitCents));
  }

  // Execute tasks in topological order
  const completed = new Set<string>();
  const running = new Set<string>();

  while (completed.size < state.tasks.length && !state.cancelled && !state.failedTaskId) {
    // Find tasks whose dependencies are all satisfied
    const ready = state.tasks.filter(
      (t) =>
        t.status === 'pending' &&
        t.dependencies.every((d) => completed.has(d)) &&
        !running.has(t.localId)
    );

    if (ready.length === 0 && running.size === 0) {
      // Deadlock or all done
      break;
    }

    // Start all ready tasks in parallel
    const runningPromises = ready.map(async (task) => {
      running.add(task.localId);
      await executeTask(task, state, config, rng, delay, onEvent);
      running.delete(task.localId);
      if (task.status === 'succeeded' || task.status === 'failed') {
        completed.add(task.localId);
      }
    });

    if (runningPromises.length > 0) {
      await Promise.all(runningPromises);
    } else {
      // Nothing ready but things are running — wait a tick
      await delay(100);
    }
  }

  // ── Phase 3: synthesis or terminal ──
  if (state.cancelled) {
    pushEvent(state, makeWorkflowCancelled(state.workflowId, 'Cancelled by user'));
    state.status = 'cancelled';
  } else if (state.failedTaskId) {
    const task = state.taskMap.get(state.failedTaskId)!;
    pushEvent(
      state,
      makeWorkflowFailed(
        state.workflowId,
        `Task "${task.title}" failed after ${task.attemptNumber} attempts`,
        state.failedTaskId
      )
    );
    state.status = 'failed';
  } else {
    // Synthesis step
    const synthTask = state.tasks.find((t) => t.kind === 'synthesize') ?? state.tasks[state.tasks.length - 1];
    await emitSynthesis(state, synthTask, config, rng, delay, onEvent);

    const totalMs = Date.now() - state.startTime;
    pushEvent(state, makeWorkflowCompleted(state.workflowId, totalMs));
    state.status = 'succeeded';
  }

  if (config.emitBudgetEvents) {
    pushEvent(state, makeBudgetEvent(state.workflowId, state.budgetCents, state.budgetLimitCents));
  }

  return state.events;
}

/** Execute a single task with retry logic. */
async function executeTask(
  task: SimTask,
  state: SimState,
  config: SimulatorConfig,
  rng: () => number,
  delay: (ms: number) => Promise<void>,
  onEvent?: (event: ServerSentEvent) => void
): Promise<void> {
  const taskId = id('task', Array.from(state.taskMap.values()).indexOf(task) + 1);

  // Check cancellation before starting
  if (state.cancelled) {
    task.status = 'cancelled';
    pushEvent(state, makeTaskStatus(state.workflowId, taskId, 'cancelled', 'pending'));
    return;
  }

  task.status = 'running';
  task.startedAt = Date.now();
  pushEvent(state, makeTaskStatus(state.workflowId, taskId, 'running', 'pending'));
  pushEvent(state, makeTaskRunning(state.workflowId, taskId, task.modelId, 1));
  await delay(200 + rng() * 300);

  // Simulate tool invocations based on task kind
  const tmpl = getTaskTemplate(task.kind);
  const toolCalls = tmpl.defaultTools.filter((t) => t.enabled);

  for (const tool of toolCalls.slice(0, 2)) {
    if (state.cancelled) break;
    pushEvent(
      state,
      makeTaskLog(state.workflowId, taskId, 'info', `Invoking tool: ${tool.name}`)
    );
    await delay(300 + rng() * 500);

    // Actually call the simulated gateway
    const toolResult = await invokeTool(tool.name, { query: task.instruction });
    const formatted = formatToolResult(toolResult, tool.name);
    pushEvent(
      state,
      makeTaskLog(
        state.workflowId,
        taskId,
        toolResult.success ? 'info' : 'warn',
        toolResult.success ? `Tool ${tool.name} completed` : `Tool ${tool.name} error: ${toolResult.error}`
      )
    );
    await delay(150 + rng() * 200);
  }

  // Decide success / failure
  let success = true;
  if (rng() < config.taskFailureRate && task.attemptNumber === 0) {
    success = false;
  }

  // Workflow-level failure override
  if (rng() < config.workflowFailureRate) {
    success = false;
  }

  if (!success && task.attemptNumber + 1 < task.maxAttempts) {
    // Retry
    task.attemptNumber++;
    pushEvent(
      state,
      makeTaskLog(
        state.workflowId,
        taskId,
        'warn',
        `Attempt ${task.attemptNumber} failed, retrying (${task.attemptNumber}/${task.maxAttempts})`
      )
    );
    await delay(600 + rng() * 800);
    // Recursively retry
    return executeTask(task, state, config, rng, delay, onEvent);
  }

  task.finishedAt = Date.now();
  task.durationMs = task.finishedAt - (task.startedAt ?? task.finishedAt);

  if (!success) {
    task.status = 'failed';
    pushEvent(state, makeTaskStatus(state.workflowId, taskId, 'failed', 'running', 'Max retry attempts exceeded'));
    pushEvent(
      state,
      makeTaskLog(state.workflowId, taskId, 'error', `Task failed after ${task.attemptNumber + 1} attempts`)
    );
    state.failedTaskId = task.localId;
    return;
  }

  // Success
  task.status = 'succeeded';
  pushEvent(state, makeTaskStatus(state.workflowId, taskId, 'succeeded', 'running'));

  // Simulate latency / token usage
  const completionTokens = Math.floor(200 + rng() * 800);
  const lat = simulateLatency(task.modelId, completionTokens, config.speedMultiplier);
  const costEst = estimateCost(task.modelId, 1200, completionTokens);
  state.budgetCents += costEst.estimatedCostCents;

  if (config.emitBudgetEvents && state.events.length % 7 === 0) {
    pushEvent(state, makeBudgetEvent(state.workflowId, Math.round(state.budgetCents), state.budgetLimitCents));
  }

  // Artifacts
  if (config.emitArtifacts && tmpl.producesArtifacts && rng() > 0.2) {
    for (const ak of tmpl.typicalArtifactKinds.slice(0, 1)) {
      task.artifactCount++;
      const artId = id('art', task.artifactCount);
      pushEvent(
        state,
        makeArtifactCreated(state.workflowId, taskId, artId, ak, `${task.title}.${artifactExt(ak)}`)
      );
      await delay(100 + rng() * 150);
    }
  }

  pushEvent(
    state,
    makeTaskLog(
      state.workflowId,
      taskId,
      'info',
      `Completed in ${task.durationMs}ms using ${task.modelDisplayName}`
    )
  );
}

/** Emit synthesis tokens for the final output. */
async function emitSynthesis(
  state: SimState,
  task: SimTask,
  config: SimulatorConfig,
  rng: () => number,
  delay: (ms: number) => Promise<void>,
  onEvent?: (event: ServerSentEvent) => void
): Promise<void> {
  const taskId = id('task', Array.from(state.taskMap.values()).indexOf(task) + 1);

  pushEvent(state, makeTaskStatus(state.workflowId, taskId, 'running', 'succeeded'));
  pushEvent(state, makeTaskRunning(state.workflowId, taskId, task.modelId, 1));
  pushEvent(state, makeTaskLog(state.workflowId, taskId, 'info', 'Starting synthesis...'));
  await delay(300 + rng() * 400);

  // Pre-written synthesis chunks for realism
  const chunks = generateSynthesisChunks(state.prompt);
  const tokens = chunkToTokens(chunks, config.synthesisTokenCount);

  for (const token of tokens) {
    if (state.cancelled) break;
    pushEvent(state, makeSynthesisToken(state.workflowId, taskId, token));
    await delay(10 + rng() * 30);
  }

  pushEvent(state, makeTaskStatus(state.workflowId, taskId, 'succeeded', 'running'));
  pushEvent(state, makeTaskLog(state.workflowId, taskId, 'info', `Synthesis complete. ${tokens.length} tokens emitted.`));
}

function generateSynthesisChunks(prompt: string): string[] {
  const p = prompt.toLowerCase();
  if (p.includes('competitor') || p.includes('market')) {
    return [
      '## Executive Summary\n\nBased on our research, ',
      'the competitive landscape shows ',
      'three dominant players controlling ',
      'approximately 62% of the addressable market. ',
      '\n\n### Key Findings\n\n',
      '- **Market leader**: AlphaCorp maintains 28% share with strong enterprise traction.\n',
      '- **Challenger**: BetaLabs grew 34% YoY, focusing on mid-market SMBs.\n',
      '- **Emerging threat**: GammaStart raised $200M Series C in Q4.\n',
      '\n\n### Recommendations\n\n',
      '1. Prioritize enterprise feature parity by Q2.\n',
      '2. Explore strategic partnership with BetaLabs for channel expansion.\n',
      '3. Monitor GammaStart pricing moves closely.\n',
    ];
  }
  if (p.includes('code') || p.includes('api') || p.includes('function')) {
    return [
      '## Implementation\n\n',
      'The solution uses a layered architecture:\n\n',
      '```typescript\n',
      'export async function handleRequest(req: Request) {\n',
      '  const validated = await schema.parseAsync(req.body);\n',
      '  const result = await service.process(validated);\n',
      '  return Response.json(result);\n',
      '}\n',
      '```\n\n',
      '### Key Design Decisions\n\n',
      '- **Validation**: Zod schemas enforce runtime type safety.\n',
      '- **Error handling**: Structured error responses with trace IDs.\n',
      '- **Testing**: 94% unit test coverage, integration tests for critical paths.\n',
    ];
  }
  if (p.includes('csv') || p.includes('data') || p.includes('pandas')) {
    return [
      '## Data Analysis Report\n\n',
      'After loading and cleaning the dataset (`n=142`), ',
      'we observe the following patterns:\n\n',
      '| Metric | Value |\n',
      '|--------|-------|\n',
      '| Mean Revenue | $48,231 |\n',
      '| Std Dev | $12,405 |\n',
      '| Top Region | NA (43%) |\n',
      '\n\n',
      '### Visualizations\n\n',
      'A revenue trend plot shows steady growth from Q1 to Q3, ',
      'with a notable dip in August attributed to seasonal churn.',
    ];
  }
  return [
    '## Analysis\n\n',
    'The research gathered ',
    'four authoritative sources which collectively indicate ',
    'that the optimal approach involves ',
    'a phased rollout with clear success metrics. ',
    '\n\n',
    '### Sources Consulted\n\n',
    '- Anthropic Research on model routing\n',
    '- ArXiv paper on multi-model orchestration\n',
    '- Industry benchmark report Q4 2024\n',
    '\n\n',
    '### Conclusion\n\n',
    'Proceed with the recommended strategy, monitoring KPIs weekly.',
  ];
}

function chunkToTokens(chunks: string[], targetCount: number): string[] {
  // Flatten chunks into individual characters and group into token-like pieces
  const flat = chunks.join('');
  const avgLen = Math.max(1, Math.floor(flat.length / targetCount));
  const tokens: string[] = [];
  for (let i = 0; i < flat.length; i += avgLen) {
    tokens.push(flat.slice(i, i + avgLen));
  }
  // Pad or trim to target
  while (tokens.length < targetCount) {
    tokens.push(' ');
  }
  return tokens.slice(0, targetCount);
}

function artifactExt(kind: ArtifactKind): string {
  switch (kind) {
    case 'report_md':
      return 'md';
    case 'dataset_csv':
      return 'csv';
    case 'image_png':
      return 'png';
    case 'image_jpg':
      return 'jpg';
    case 'code_diff':
      return 'diff';
    case 'text_txt':
      return 'txt';
    case 'json':
      return 'json';
    default:
      return 'bin';
  }
}

function pushEvent(state: SimState, event: ServerSentEvent) {
  state.events.push(event);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel control
// ─────────────────────────────────────────────────────────────────────────────

export function cancelSimulation(state: SimState): void {
  state.cancelled = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience runners
// ─────────────────────────────────────────────────────────────────────────────

/** Run a complete simulated workflow and stream events through a callback. */
export async function simulateWorkflow(
  workflowId: WorkflowId,
  prompt: string,
  onEvent: (event: ServerSentEvent) => void,
  cfg: Partial<SimulatorConfig> = {}
): Promise<ServerSentEvent[]> {
  const state = buildSimulation(workflowId, prompt, cfg);
  return runSimulation(state, onEvent, cfg);
}

/** Create an async iterable of events (useful for SSE mocks). */
export async function* simulateWorkflowStream(
  workflowId: WorkflowId,
  prompt: string,
  cfg: Partial<SimulatorConfig> = {}
): AsyncGenerator<ServerSentEvent, void, unknown> {
  const state = buildSimulation(workflowId, prompt, cfg);
  const config = { ...DEFAULT_CONFIG, ...cfg };

  // Intercept events
  const events: ServerSentEvent[] = [];
  const original = (e: ServerSentEvent) => {
    events.push(e);
  };

  // Run simulation in background and yield as events arrive
  const simPromise = runSimulation(state, original, config);

  let yielded = 0;
  while (yielded < 10000) {
    // safety limit
    if (events.length > yielded) {
      yield events[yielded++];
      continue;
    }
    // Check if simulation is done
    const done = await Promise.race([
      simPromise.then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 50)),
    ]);
    if (done && yielded >= events.length) break;
    await sleep(30);
  }

  // Yield any remaining
  while (yielded < events.length) {
    yield events[yielded++];
  }
}
