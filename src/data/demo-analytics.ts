import { resetSeed, randInt, randFloat, pick } from "../mock/generators";

// ── deterministic seeding ──────────────────────────────────────────────────
resetSeed(2001);

// ── types ──────────────────────────────────────────────────────────────────

export interface DailyUsageRecord {
  date: string;
  workflowsStarted: number;
  workflowsCompleted: number;
  workflowsFailed: number;
  tasksExecuted: number;
  tokensIn: number;
  tokensOut: number;
  creditsSpent: number;
  avgDurationMs: number;
  uniqueModelsUsed: number;
}

export interface ModelUsageSummary {
  modelId: string;
  totalCalls: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCredits: number;
  avgLatencyMs: number;
  color: string;
}

export interface WorkflowUsageSummary {
  workflowId: string;
  workflowName: string;
  spaceId: string;
  tasksCount: number;
  creditsSpent: number;
  durationMs: number;
  tokensTotal: number;
  status: "succeeded" | "failed" | "running" | "partial";
  createdAt: string;
  modelBreakdown: { modelId: string; calls: number; credits: number }[];
}

export interface CostTrendPoint {
  date: string;
  creditsSpent: number;
  cumulativeCredits: number;
  projectedCredits: number;
}

export interface AnalyticsSummary {
  totalWorkflows: number;
  totalTasks: number;
  totalTokens: number;
  totalCredits: number;
  avgWorkflowDurationMs: number;
  successRate: number;
  topModel: string;
  peakDay: string;
}

// ── palette for model charts ────────────────────────────────────────────────

const MODEL_COLORS = [
  "#20B8CD",
  "#8b5cf6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

const MODEL_IDS = [
  "claude-opus-4.7",
  "claude-sonnet-4.6",
  "gpt-5.2",
  "gpt-5.1",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "codestral-22b",
  "deepseek-coder",
  "llama-3.1-70b",
  "mistral-large-2",
];

const WORKFLOW_NAMES = [
  "Lithium Miners Research",
  "Tesla vs BYD Analysis",
  "SEC Scraper Build",
  "IPCC Summary",
  "Competitive Deck",
  "CSV Deduplication",
  "Quantum Funding",
  "React Auth Tests",
  "Regulatory Monitor",
  "LinkedIn Extract",
  "SaaS Dashboard",
  "PM Tools Compare",
  "Sentiment Pipeline",
  "Bitcoin On-Chain",
  "Series B Memo",
];

// ── helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date("2025-01-15T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

function seededRand(): number {
  return randFloat(0, 1, 4);
}

// ── generate 30 days of daily usage ─────────────────────────────────────────

const DAILY_USAGE: DailyUsageRecord[] = [];

for (let i = 29; i >= 0; i--) {
  const baseWorkflows = randInt(1, 8);
  const failRate = randFloat(0.02, 0.12, 2);
  const workflowsStarted = baseWorkflows;
  const workflowsFailed = Math.round(baseWorkflows * failRate);
  const workflowsCompleted = workflowsStarted - workflowsFailed;
  const tasksPerWorkflow = randInt(4, 14);
  const tasksExecuted = workflowsStarted * tasksPerWorkflow;
  const tokensIn = tasksExecuted * randInt(1200, 3500);
  const tokensOut = tasksExecuted * randInt(600, 2200);
  const creditsSpent = randFloat(tasksExecuted * 0.4, tasksExecuted * 2.1, 2);
  const avgDurationMs = randInt(180_000, 1_200_000);
  const uniqueModelsUsed = randInt(2, 6);

  DAILY_USAGE.push({
    date: daysAgo(i),
    workflowsStarted,
    workflowsCompleted,
    workflowsFailed,
    tasksExecuted,
    tokensIn,
    tokensOut,
    creditsSpent,
    avgDurationMs,
    uniqueModelsUsed,
  });
}

// ── generate model breakdown ───────────────────────────────────────────────

const MODEL_BREAKDOWN: ModelUsageSummary[] = [];
const modelCount = 8;

for (let i = 0; i < modelCount; i++) {
  const modelId = MODEL_IDS[i];
  const totalCalls = randInt(50, 450);
  const totalTokensIn = totalCalls * randInt(800, 3200);
  const totalTokensOut = totalCalls * randInt(400, 2100);
  const totalCredits = randFloat(totalCalls * 0.3, totalCalls * 1.1, 2);
  const avgLatencyMs = randInt(200, 2800);

  MODEL_BREAKDOWN.push({
    modelId,
    totalCalls,
    totalTokensIn,
    totalTokensOut,
    totalCredits,
    avgLatencyMs,
    color: MODEL_COLORS[i % MODEL_COLORS.length],
  });
}

// Sort by credits descending
MODEL_BREAKDOWN.sort((a, b) => b.totalCredits - a.totalCredits);

// ── generate top workflows ──────────────────────────────────────────────────

const TOP_WORKFLOWS: WorkflowUsageSummary[] = [];

for (let i = 0; i < 12; i++) {
  const wfName = WORKFLOW_NAMES[i % WORKFLOW_NAMES.length];
  const tasksCount = randInt(3, 15);
  const creditsSpent = randFloat(tasksCount * 0.5, tasksCount * 2.8, 2);
  const durationMs = randInt(120_000, 2_400_000);
  const tokensTotal = tasksCount * randInt(1800, 4800);
  const status = pick(["succeeded", "succeeded", "succeeded", "failed", "partial", "running"]) as WorkflowUsageSummary["status"];
  const createdAt = daysAgo(randInt(0, 28));
  const modelCount = randInt(1, 4);
  const modelBreakdown: { modelId: string; calls: number; credits: number }[] = [];
  for (let m = 0; m < modelCount; m++) {
    const calls = randInt(2, 30);
    modelBreakdown.push({
      modelId: pick(MODEL_IDS),
      calls,
      credits: randFloat(calls * 0.3, calls * 1.2, 2),
    });
  }

  TOP_WORKFLOWS.push({
    workflowId: `wf_${i + 1}`,
    workflowName: wfName,
    spaceId: `spc_${pick(["research", "engineering", "competitive_intel", "personal"])}`,
    tasksCount,
    creditsSpent,
    durationMs,
    tokensTotal,
    status,
    createdAt,
    modelBreakdown,
  });
}

// Sort by credits spent descending
TOP_WORKFLOWS.sort((a, b) => b.creditsSpent - a.creditsSpent);

// ── generate cost trend ────────────────────────────────────────────────────

const COST_TREND: CostTrendPoint[] = [];
let cumulative = 0;
const dailyAvg = DAILY_USAGE.reduce((s, d) => s + d.creditsSpent, 0) / DAILY_USAGE.length;

for (let i = 29; i >= 0; i--) {
  const day = DAILY_USAGE[29 - i];
  cumulative += day.creditsSpent;
  const projected = cumulative + dailyAvg * (i + 1);
  COST_TREND.push({
    date: day.date,
    creditsSpent: day.creditsSpent,
    cumulativeCredits: Number(cumulative.toFixed(2)),
    projectedCredits: Number(projected.toFixed(2)),
  });
}

// ── compute summary ────────────────────────────────────────────────────────

function computeSummary(): AnalyticsSummary {
  const totalWorkflows = DAILY_USAGE.reduce((s, d) => s + d.workflowsStarted, 0);
  const totalTasks = DAILY_USAGE.reduce((s, d) => s + d.tasksExecuted, 0);
  const totalTokens = DAILY_USAGE.reduce((s, d) => s + d.tokensIn + d.tokensOut, 0);
  const totalCredits = DAILY_USAGE.reduce((s, d) => s + d.creditsSpent, 0);
  const totalCompleted = DAILY_USAGE.reduce((s, d) => s + d.workflowsCompleted, 0);
  const totalStarted = DAILY_USAGE.reduce((s, d) => s + d.workflowsStarted, 0);
  const successRate = totalStarted > 0 ? Number(((totalCompleted / totalStarted) * 100).toFixed(1)) : 0;
  const avgWorkflowDurationMs = Math.round(
    DAILY_USAGE.reduce((s, d) => s + d.avgDurationMs, 0) / DAILY_USAGE.length
  );
  const peakDay = DAILY_USAGE.reduce((max, d) => (d.creditsSpent > max.creditsSpent ? d : max), DAILY_USAGE[0]);
  const topModel = MODEL_BREAKDOWN[0]?.modelId ?? "unknown";

  return {
    totalWorkflows,
    totalTasks,
    totalTokens,
    totalCredits: Number(totalCredits.toFixed(2)),
    avgWorkflowDurationMs,
    successRate,
    topModel,
    peakDay: peakDay.date,
  };
}

// ── exports ────────────────────────────────────────────────────────────────

export const DEMO_DAILY_USAGE: DailyUsageRecord[] = DAILY_USAGE;
export const DEMO_MODEL_BREAKDOWN: ModelUsageSummary[] = MODEL_BREAKDOWN;
export const DEMO_TOP_WORKFLOWS: WorkflowUsageSummary[] = TOP_WORKFLOWS;
export const DEMO_COST_TREND: CostTrendPoint[] = COST_TREND;
export const DEMO_ANALYTICS_SUMMARY: AnalyticsSummary = computeSummary();

// helper lookups
export function getDailyUsageByDate(date: string): DailyUsageRecord | undefined {
  return DAILY_USAGE.find((d) => d.date === date);
}

export function getModelUsageById(modelId: string): ModelUsageSummary | undefined {
  return MODEL_BREAKDOWN.find((m) => m.modelId === modelId);
}

export function getWorkflowUsageById(workflowId: string): WorkflowUsageSummary | undefined {
  return TOP_WORKFLOWS.find((w) => w.workflowId === workflowId);
}
