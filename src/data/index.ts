// ═══════════════════════════════════════════════════════════════════════════════
// Multi-Model Agent Orchestration Platform — Complete Mock Data Layer
// ═══════════════════════════════════════════════════════════════════════════════

// ── demo data collections ────────────────────────────────────────────────────
export {
  DEMO_MODELS,
  getModelById,
  type ModelCard,
} from "./demo-models";

export {
  DEMO_USERS,
  getUserById,
  getUsersByOrg,
  type DemoUser,
} from "./demo-users";

export {
  DEMO_SPACES,
  getSpaceById,
  type DemoSpace,
} from "./demo-spaces";

export {
  DEMO_CONNECTORS,
  getConnectorById,
  getConnectorsByOrg,
  type DemoConnector,
  type ConnectorStatus,
} from "./demo-connectors";

export {
  DEMO_MEMORY,
  getMemoryByWorkflowId,
  getMemoryByUserId,
  type MemoryEntry,
} from "./demo-memory";

export {
  DEMO_WORKFLOWS,
  getWorkflowById,
  getWorkflowsBySpace,
  getWorkflowsByUser,
  getAllTasks,
  getAllArtifacts,
  getAllSources,
  getAllEdges,
  countRecords,
  type DemoWorkflow,
  type Workflow,
  type Task,
  type TaskEdge,
  type TaskKind,
  type TaskStatus,
  type PlanRevision,
} from "./demo-workflows";

export {
  DEMO_DAILY_USAGE,
  DEMO_MODEL_BREAKDOWN,
  DEMO_TOP_WORKFLOWS,
  DEMO_COST_TREND,
  DEMO_ANALYTICS_SUMMARY,
  getDailyUsageByDate,
  getModelUsageById,
  getWorkflowUsageById,
  type DailyUsageRecord,
  type ModelUsageSummary,
  type WorkflowUsageSummary,
  type CostTrendPoint,
  type AnalyticsSummary,
} from "./demo-analytics";

export {
  DEMO_NOTIFICATIONS,
} from "./demo-notifications";

export {
  WORKFLOW_TEMPLATES,
  CATEGORY_META,
  getTemplatesByCategory,
  getAllCategories,
  searchTemplates,
  getTemplateById,
  type WorkflowTemplate,
  type TemplateCategory,
} from "./templates";

export {
  demoModels,
  demoTools,
} from "./models";

// ── mock generators & utilities ──────────────────────────────────────────────
export {
  resetSeed,
  uuid,
  shortId,
  ago,
  between,
  addMs,
  iso,
  pick,
  pickN,
  randInt,
  randFloat,
  domain,
  faviconUrl,
  taskSpec,
  makeSources,
  makeArtifacts,
  makeModelUsage,
  lorem,
  sentence,
  paragraph,
  budget,
  randomObjective,
  allObjectives,
  type SourceCard,
  type ArtifactMeta,
  type ModelUsage,
} from "../mock/generators";

// ── mock LLM responses ───────────────────────────────────────────────────────
export {
  mockOrchestratorPlan,
  mockResearchResponse,
  mockCodeResponse,
  mockSynthesisResponse,
  type PlanDAG,
  type PlanNode,
  type CitedResponse,
  type CodeResponse,
  type SynthesisResponse,
} from "../mock/llm-responses";

// ── mock search results ──────────────────────────────────────────────────────
export {
  mockSearch,
  allMockQueries,
  type MockSearchResult,
  type MockSearchResponse,
} from "../mock/search-results";

// ── mock SSE events ─────────────────────────────────────────────────────────
export {
  generateWorkflowSSEEvents,
  ensureEventsForWorkflow,
  DEMO_SSE_EVENT_SEQUENCES,
  type SSEEvent,
  type SSEEventType,
} from "../mock/sse-events";

// ── aggregate statistics ─────────────────────────────────────────────────────
export function getDemoStats(): {
  workflows: number;
  tasks: number;
  taskEdges: number;
  artifacts: number;
  sources: number;
  users: number;
  orgs: number;
  spaces: number;
  connectors: number;
  memoryEntries: number;
  models: number;
  totalCreditsSpent: number;
  totalTokensProcessed: number;
} {
  const allTasks = DEMO_WORKFLOWS.flatMap((w: any) => w.tasks);
  const allEdges = DEMO_WORKFLOWS.flatMap((w: any) => w.edges);
  const allArtifacts = DEMO_WORKFLOWS.flatMap((w: any) => w.artifacts);
  const allSources = DEMO_WORKFLOWS.flatMap((w: any) => w.sources);

  const totalCreditsSpent = DEMO_WORKFLOWS.reduce(
    (sum: number, w: any) => sum + w.workflow.spentCredits,
    0
  );

  const totalTokensProcessed = allTasks.reduce(
    (sum: number, t: any) => sum + t.inputTokens + t.outputTokens,
    0
  );

  const orgIds = new Set(DEMO_USERS.map((u: any) => u.orgId));

  return {
    workflows: DEMO_WORKFLOWS.length,
    tasks: allTasks.length,
    taskEdges: allEdges.length,
    artifacts: allArtifacts.length,
    sources: allSources.length,
    users: DEMO_USERS.length,
    orgs: orgIds.size,
    spaces: DEMO_SPACES.length,
    connectors: DEMO_CONNECTORS.length,
    memoryEntries: DEMO_MEMORY.length,
    models: DEMO_MODELS.length,
    totalCreditsSpent: Number(totalCreditsSpent.toFixed(2)),
    totalTokensProcessed,
  };
}

// ── quick re-export for convenience ─────────────────────────────────────────
export const ALL_DEMO_DATA = {
  get stats() {
    return getDemoStats();
  },
};
