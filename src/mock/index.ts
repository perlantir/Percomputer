/**
 * Mock data & simulation utilities for development and testing.
 */

import type { Agent, Workflow, Artifact, MemoryEntry, Connector, Space, UsageMetric } from "@/src/types";

/* ── re-exports from sibling modules ── */
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
  type TaskKind,
} from "./generators";

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
} from "./llm-responses";

export {
  mockSearch,
  allMockQueries,
  type MockSearchResult,
  type MockSearchResponse,
} from "./search-results";

export {
  generateWorkflowSSEEvents,
  ensureEventsForWorkflow,
  DEMO_SSE_EVENT_SEQUENCES,
  type SSEEvent,
  type SSEEventType,
} from "./sse-events";

export const mockAgents: Agent[] = [
  {
    id: "agent-research-01",
    name: "Research Agent",
    description: "Conducts deep web research and synthesizes findings.",
    model: "openai",
    systemPrompt: "You are an expert research assistant. Synthesize information concisely.",
    tools: ["web_search", "citation_lookup"],
    temperature: 0.3,
    maxTokens: 4000,
    createdAt: "2024-11-01T10:00:00Z",
    updatedAt: "2024-11-15T14:30:00Z",
  },
  {
    id: "agent-code-02",
    name: "Code Review Agent",
    description: "Reviews code for bugs, style, and security issues.",
    model: "anthropic",
    systemPrompt: "You are a senior software engineer. Review code thoroughly.",
    tools: ["linter", "security_scanner"],
    temperature: 0.1,
    maxTokens: 2000,
    createdAt: "2024-11-05T08:00:00Z",
    updatedAt: "2024-11-20T09:00:00Z",
  },
  {
    id: "agent-write-03",
    name: "Creative Writer",
    description: "Generates creative copy, blog posts, and marketing material.",
    model: "mistral",
    systemPrompt: "You are a creative writer with a witty voice.",
    tools: ["tone_analyzer"],
    temperature: 0.8,
    maxTokens: 3500,
    createdAt: "2024-11-10T12:00:00Z",
    updatedAt: "2024-11-18T16:00:00Z",
  },
];

export const mockWorkflows: Workflow[] = [
  {
    id: "wf-001",
    name: "Weekly Market Report",
    description: "Automated financial research and report generation.",
    status: "completed",
    nodes: [],
    edges: [],
    spaceId: "space-01",
    createdAt: "2024-11-01T09:00:00Z",
    updatedAt: "2024-11-07T17:00:00Z",
  },
  {
    id: "wf-002",
    name: "Code Quality Pipeline",
    description: "Reviews PRs and runs automated checks.",
    status: "running",
    nodes: [],
    edges: [],
    spaceId: "space-02",
    createdAt: "2024-11-10T11:00:00Z",
    updatedAt: "2024-11-21T13:45:00Z",
  },
  {
    id: "wf-003",
    name: "Content Calendar Builder",
    description: "Generates a month's worth of social media content.",
    status: "draft",
    nodes: [],
    edges: [],
    spaceId: null,
    createdAt: "2024-11-20T10:00:00Z",
    updatedAt: "2024-11-20T10:00:00Z",
  },
];

export const mockArtifacts: Artifact[] = [
  {
    id: "art-001",
    workflowId: "wf-001",
    type: "text",
    title: "Executive Summary",
    content: "The S&P 500 gained 2.3% this week driven by tech earnings...",
    mimeType: "text/markdown",
    createdAt: "2024-11-07T16:00:00Z",
  },
  {
    id: "art-002",
    workflowId: "wf-002",
    type: "code",
    title: "Refactored Auth Module",
    content: "```ts\nexport function verifyToken(token: string) { ... }\n```",
    mimeType: "text/markdown",
    createdAt: "2024-11-21T13:30:00Z",
  },
];

export const mockMemories: MemoryEntry[] = [
  {
    id: "mem-001",
    workflowId: "wf-001",
    key: "last_query",
    value: "S&P 500 performance November 2024",
    scope: "session",
    createdAt: "2024-11-07T15:00:00Z",
    expiresAt: "2024-11-08T15:00:00Z",
  },
];

export const mockConnectors: Connector[] = [
  {
    id: "conn-001",
    name: "Slack Bot",
    type: "slack",
    config: { channel: "#ai-alerts" },
    status: "connected",
    lastUsedAt: "2024-11-21T12:00:00Z",
  },
  {
    id: "conn-002",
    name: "GitHub Integration",
    type: "github",
    config: { repo: "org/project" },
    status: "connected",
    lastUsedAt: "2024-11-20T09:00:00Z",
  },
  {
    id: "conn-003",
    name: "Notion Database",
    type: "notion",
    config: { pageId: "abc123" },
    status: "disconnected",
    lastUsedAt: null,
  },
];

export const mockSpaces: Space[] = [
  {
    id: "space-01",
    name: "Finance Team",
    description: "All financial research and reporting workflows.",
    icon: "landmark",
    workflowIds: ["wf-001"],
    createdAt: "2024-10-01T08:00:00Z",
    updatedAt: "2024-11-15T10:00:00Z",
  },
  {
    id: "space-02",
    name: "Engineering",
    description: "Code review, deployment, and monitoring workflows.",
    icon: "code",
    workflowIds: ["wf-002"],
    createdAt: "2024-10-05T08:00:00Z",
    updatedAt: "2024-11-20T09:00:00Z",
  },
];

export const mockUsage: UsageMetric[] = [
  {
    id: "use-001",
    workflowId: "wf-001",
    model: "openai",
    tokensIn: 1200,
    tokensOut: 3400,
    costUsd: 0.0234,
    latencyMs: 1240,
    timestamp: "2024-11-07T16:00:00Z",
  },
  {
    id: "use-002",
    workflowId: "wf-002",
    model: "anthropic",
    tokensIn: 800,
    tokensOut: 1200,
    costUsd: 0.018,
    latencyMs: 980,
    timestamp: "2024-11-21T13:45:00Z",
  },
];
