/**
 * Simple in-memory mock database using Maps.
 * CRUD operations and query helpers for all entities.
 *
 * All types below are local to this mock layer and intentionally decoupled
 * from the canonical entities.ts types so the demo/backend boundary stays
 * flexible.
 */
import { generateId } from "@/src/mock/generators";

// ── local types ───────────────────────────────────────────────────────────────

interface MockWorkflow {
  id: string;
  objective: string;
  spaceId: string;
  orgId: string;
  ownerId: string;
  status: string;
  budgetCredits: number;
  spentCredits: number;
  deliverableKinds: string[];
  policyOverrides?: Record<string, unknown>;
  currentPlanVersion: number;
  deadline?: string;
  errorMessage?: string;
  dag?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface MockTask {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  status: string;
  dependencies: string[];
  assignedModel?: string;
  actualModel?: string;
  toolsUsed: string[];
  inputTokens: number;
  outputTokens: number;
  costCredits: number;
  depth: number;
  retryCount: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface MockArtifact {
  id: string;
  workflowId: string;
  taskId?: string;
  kind: string;
  name: string;
  mimeType: string;
  size: number;
  contentPreview?: string;
  presignedUrl?: string;
  presignedExpiresAt?: string;
  createdAt: string;
}

interface MockSpace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  orgId: string;
  members: string[];
  memoryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockConnector {
  name: string;
  displayName: string;
  description: string;
  status: string;
  scopes: string[];
  installedAt?: string;
  revokedAt?: string;
  errorMessage?: string;
  iconUrl: string;
  orgId: string;
}

interface MockMemoryEntry {
  id: string;
  kind: string;
  key: string;
  value: string;
  workflowId?: string;
  spaceId?: string;
  userId?: string;
  confidence: number;
  createdAt: string;
  orgId: string;
}

interface MockAuditEvent {
  id: string;
  type: string;
  actorId: string;
  orgId: string;
  workflowId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface MockClarification {
  id: string;
  workflowId: string;
  question: string;
  context?: string;
  answered: boolean;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

interface MockWorkflowEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface MockTeamInvite {
  id: string;
  email: string;
  role: string;
  orgId: string;
  orgName: string;
  invitedById: string;
  invitedByName: string;
  token: string;
  accepted: boolean;
  revoked: boolean;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

interface MockTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  orgId: string;
  joinedAt: string;
  lastActiveAt: string | null;
}

// ── seed data ─────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

const seedWorkflows: MockWorkflow[] = [
  {
    id: "wf-1",
    objective: "Analyze competitor pricing strategies for Q3 2024",
    spaceId: "space-product",
    orgId: "org-1",
    ownerId: "user-1",
    status: "completed",
    budgetCredits: 50,
    spentCredits: 42.3,
    deliverableKinds: ["report", "csv"],
    policyOverrides: { maxDepth: 3, minModelTier: "standard" },
    currentPlanVersion: 1,
    createdAt: "2024-06-10T08:00:00Z",
    updatedAt: "2024-06-10T09:15:00Z",
    startedAt: "2024-06-10T08:00:30Z",
    completedAt: "2024-06-10T09:15:00Z",
  },
  {
    id: "wf-2",
    objective: "Build a React component library for internal dashboards",
    spaceId: "space-eng",
    orgId: "org-1",
    ownerId: "user-2",
    status: "running",
    budgetCredits: 100,
    spentCredits: 18.5,
    deliverableKinds: ["code", "markdown"],
    policyOverrides: { maxDepth: 4, minModelTier: "premium", autoRetry: true },
    currentPlanVersion: 1,
    createdAt: "2024-06-15T10:30:00Z",
    updatedAt: "2024-06-15T11:00:00Z",
    startedAt: "2024-06-15T10:31:00Z",
  },
  {
    id: "wf-3",
    objective: "Research emerging AI safety frameworks and produce summary",
    spaceId: "space-default",
    orgId: "org-1",
    ownerId: "user-1",
    status: "awaiting_clarification",
    budgetCredits: 30,
    spentCredits: 2.1,
    deliverableKinds: ["answer", "markdown"],
    currentPlanVersion: 1,
    createdAt: "2024-06-20T14:00:00Z",
    updatedAt: "2024-06-20T14:05:00Z",
    startedAt: "2024-06-20T14:01:00Z",
  },
  {
    id: "wf-4",
    objective: "Generate quarterly sales report with visualizations",
    spaceId: "space-product",
    orgId: "org-1",
    ownerId: "user-3",
    status: "paused",
    budgetCredits: 75,
    spentCredits: 12.0,
    deliverableKinds: ["report", "image", "csv"],
    deadline: "2024-06-30T23:59:59Z",
    currentPlanVersion: 2,
    createdAt: "2024-06-18T09:00:00Z",
    updatedAt: "2024-06-19T16:00:00Z",
    startedAt: "2024-06-18T09:05:00Z",
  },
  {
    id: "wf-5",
    objective: "Debug production memory leak in Node.js service",
    spaceId: "space-eng",
    orgId: "org-1",
    ownerId: "user-2",
    status: "failed",
    budgetCredits: 40,
    spentCredits: 40,
    deliverableKinds: ["code", "answer"],
    currentPlanVersion: 1,
    createdAt: "2024-06-14T11:00:00Z",
    updatedAt: "2024-06-14T12:30:00Z",
    startedAt: "2024-06-14T11:01:00Z",
    errorMessage: "Budget exceeded during deep analysis phase",
  },
];

const seedTasks: MockTask[] = [
  {
    id: "task-1-1",
    workflowId: "wf-1",
    name: "Search competitor pricing pages",
    description: "Use web search to find current pricing for 5 key competitors",
    status: "completed",
    dependencies: [],
    assignedModel: "gpt-4o",
    actualModel: "gpt-4o",
    toolsUsed: ["web.search", "web.fetch"],
    inputTokens: 1200,
    outputTokens: 3400,
    costCredits: 8.5,
    startedAt: "2024-06-10T08:01:00Z",
    completedAt: "2024-06-10T08:12:00Z",
    depth: 0,
    retryCount: 0,
    createdAt: "2024-06-10T08:00:30Z",
  },
  {
    id: "task-1-2",
    workflowId: "wf-1",
    name: "Extract pricing tables",
    description: "Parse HTML to extract structured pricing data",
    status: "completed",
    dependencies: ["task-1-1"],
    assignedModel: "gpt-4o-mini",
    actualModel: "gpt-4o-mini",
    toolsUsed: ["code.exec"],
    inputTokens: 800,
    outputTokens: 1200,
    costCredits: 2.1,
    startedAt: "2024-06-10T08:13:00Z",
    completedAt: "2024-06-10T08:18:00Z",
    depth: 1,
    retryCount: 0,
    createdAt: "2024-06-10T08:00:30Z",
  },
  {
    id: "task-1-3",
    workflowId: "wf-1",
    name: "Analyze trends and gaps",
    description: "Compare pricing models and identify strategic gaps",
    status: "completed",
    dependencies: ["task-1-2"],
    assignedModel: "claude-3-5-sonnet",
    actualModel: "claude-3-5-sonnet",
    toolsUsed: ["code.exec"],
    inputTokens: 3500,
    outputTokens: 4800,
    costCredits: 18.2,
    startedAt: "2024-06-10T08:20:00Z",
    completedAt: "2024-06-10T09:05:00Z",
    depth: 2,
    retryCount: 0,
    createdAt: "2024-06-10T08:00:30Z",
  },
  {
    id: "task-1-4",
    workflowId: "wf-1",
    name: "Synthesize report",
    description: "Generate final markdown report and CSV artifact",
    status: "completed",
    dependencies: ["task-1-3"],
    assignedModel: "gpt-4o",
    actualModel: "gpt-4o",
    toolsUsed: [],
    inputTokens: 2000,
    outputTokens: 5600,
    costCredits: 13.5,
    startedAt: "2024-06-10T09:06:00Z",
    completedAt: "2024-06-10T09:15:00Z",
    depth: 3,
    retryCount: 0,
    createdAt: "2024-06-10T08:00:30Z",
  },
  {
    id: "task-2-1",
    workflowId: "wf-2",
    name: "Design component API",
    description: "Define props and interfaces for 12 core components",
    status: "completed",
    dependencies: [],
    assignedModel: "claude-3-5-sonnet",
    actualModel: "claude-3-5-sonnet",
    toolsUsed: ["code.exec"],
    inputTokens: 2500,
    outputTokens: 4200,
    costCredits: 15.0,
    startedAt: "2024-06-15T10:31:00Z",
    completedAt: "2024-06-15T10:45:00Z",
    depth: 0,
    retryCount: 0,
    createdAt: "2024-06-15T10:30:30Z",
  },
  {
    id: "task-2-2",
    workflowId: "wf-2",
    name: "Implement Button and Input",
    description: "Build accessible Button and Input with variants",
    status: "running",
    dependencies: ["task-2-1"],
    assignedModel: "gpt-4o",
    actualModel: "gpt-4o",
    toolsUsed: ["code.exec"],
    inputTokens: 1800,
    outputTokens: 2100,
    costCredits: 3.5,
    startedAt: "2024-06-15T10:46:00Z",
    depth: 1,
    retryCount: 0,
    createdAt: "2024-06-15T10:30:30Z",
  },
  {
    id: "task-2-3",
    workflowId: "wf-2",
    name: "Implement Card and Modal",
    description: "Build Card and Modal with animation support",
    status: "pending",
    dependencies: ["task-2-1"],
    assignedModel: "gpt-4o",
    toolsUsed: [],
    inputTokens: 0,
    outputTokens: 0,
    costCredits: 0,
    depth: 1,
    retryCount: 0,
    createdAt: "2024-06-15T10:30:30Z",
  },
  {
    id: "task-5-1",
    workflowId: "wf-5",
    name: "Profile heap memory",
    description: "Run heap snapshots and identify leak patterns",
    status: "failed",
    dependencies: [],
    assignedModel: "gpt-4o",
    actualModel: "gpt-4o",
    toolsUsed: ["code.exec", "browser.fetch"],
    inputTokens: 5000,
    outputTokens: 8000,
    costCredits: 40.0,
    startedAt: "2024-06-14T11:01:00Z",
    completedAt: "2024-06-14T12:30:00Z",
    errorMessage: "Budget exceeded during heap analysis",
    depth: 0,
    retryCount: 1,
    createdAt: "2024-06-14T11:00:30Z",
  },
];

const seedArtifacts: MockArtifact[] = [
  {
    id: "art-1",
    workflowId: "wf-1",
    taskId: "task-1-4",
    kind: "markdown",
    name: "competitor-pricing-analysis.md",
    mimeType: "text/markdown",
    size: 12500,
    contentPreview: "# Competitor Pricing Analysis Q3 2024\n\n## Executive Summary\nThis report compares pricing strategies...",
    createdAt: "2024-06-10T09:15:00Z",
  },
  {
    id: "art-2",
    workflowId: "wf-1",
    taskId: "task-1-2",
    kind: "csv",
    name: "pricing-data.csv",
    mimeType: "text/csv",
    size: 3400,
    contentPreview: "competitor,plan,price,currency,features\nAcme Corp,Basic,29,USD,...",
    createdAt: "2024-06-10T08:18:00Z",
  },
  {
    id: "art-3",
    workflowId: "wf-2",
    taskId: "task-2-1",
    kind: "code",
    name: "component-api.ts",
    mimeType: "application/typescript",
    size: 8900,
    contentPreview: "export interface ButtonProps {\n  variant: 'primary' | 'secondary';\n  ...",
    createdAt: "2024-06-15T10:45:00Z",
  },
  {
    id: "art-4",
    workflowId: "wf-2",
    taskId: "task-2-2",
    kind: "code",
    name: "Button.tsx",
    mimeType: "application/typescript",
    size: 5600,
    contentPreview: "export function Button({ variant, children, ...props }: ButtonProps) {\n  ...",
    createdAt: "2024-06-15T10:50:00Z",
  },
];

const seedSpaces: MockSpace[] = [
  {
    id: "space-default",
    name: "Personal",
    description: "Your default personal workspace",
    ownerId: "user-1",
    orgId: "org-1",
    members: ["user-1"],
    memoryEnabled: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-06-01T09:00:00Z",
  },
  {
    id: "space-eng",
    name: "Engineering",
    description: "Engineering team workflows and research",
    ownerId: "user-1",
    orgId: "org-1",
    members: ["user-1", "user-2"],
    memoryEnabled: true,
    createdAt: "2024-02-01T11:00:00Z",
    updatedAt: "2024-06-10T16:30:00Z",
  },
  {
    id: "space-product",
    name: "Product",
    description: "Product research and competitive analysis",
    ownerId: "user-2",
    orgId: "org-1",
    members: ["user-1", "user-2", "user-3"],
    memoryEnabled: false,
    createdAt: "2024-03-12T13:00:00Z",
    updatedAt: "2024-05-20T10:00:00Z",
  },
];

const seedConnectors: MockConnector[] = [
  {
    name: "slack",
    displayName: "Slack",
    description: "Send workflow results to Slack channels and receive slash commands.",
    status: "installed",
    scopes: ["chat:write", "channels:read"],
    installedAt: "2024-03-15T10:00:00Z",
    iconUrl: "/connectors/slack.svg",
    orgId: "org-1",
  },
  {
    name: "github",
    displayName: "GitHub",
    description: "Read code repositories, open PRs, and create issues from workflow outputs.",
    status: "installed",
    scopes: ["repo", "issues:write"],
    installedAt: "2024-03-20T14:00:00Z",
    iconUrl: "/connectors/github.svg",
    orgId: "org-1",
  },
  {
    name: "linear",
    displayName: "Linear",
    description: "Create and update issues, sync project status with Linear.",
    status: "available",
    scopes: ["issues:write", "projects:read"],
    iconUrl: "/connectors/linear.svg",
    orgId: "org-1",
  },
  {
    name: "notion",
    displayName: "Notion",
    description: "Read and write pages, databases, and wikis in Notion.",
    status: "available",
    scopes: ["page:read", "page:write"],
    iconUrl: "/connectors/notion.svg",
    orgId: "org-1",
  },
  {
    name: "jira",
    displayName: "Jira",
    description: "Create tickets, update sprints, and sync with Jira projects.",
    status: "error",
    scopes: ["read:jira-work", "write:jira-work"],
    installedAt: "2024-04-01T09:00:00Z",
    revokedAt: "2024-05-10T12:00:00Z",
    errorMessage: "OAuth token expired and refresh failed.",
    iconUrl: "/connectors/jira.svg",
    orgId: "org-1",
  },
  {
    name: "gmail",
    displayName: "Gmail",
    description: "Send email summaries and read thread context for workflows.",
    status: "installed",
    scopes: ["gmail.send", "gmail.readonly"],
    installedAt: "2024-04-15T11:00:00Z",
    iconUrl: "/connectors/gmail.svg",
    orgId: "org-1",
  },
  {
    name: "google_drive",
    displayName: "Google Drive",
    description: "Read documents and write generated artifacts to Google Drive.",
    status: "available",
    scopes: ["drive.readonly", "drive.file"],
    iconUrl: "/connectors/google-drive.svg",
    orgId: "org-1",
  },
  {
    name: "confluence",
    displayName: "Confluence",
    description: "Read wiki pages and publish workflow reports to Confluence.",
    status: "available",
    scopes: ["read:content:confluence", "write:content:confluence"],
    iconUrl: "/connectors/confluence.svg",
    orgId: "org-1",
  },
  {
    name: "asana",
    displayName: "Asana",
    description: "Create tasks, update projects, and sync workflow milestones.",
    status: "available",
    scopes: ["default"],
    iconUrl: "/connectors/asana.svg",
    orgId: "org-1",
  },
  {
    name: "trello",
    displayName: "Trello",
    description: "Create cards and update boards from workflow results.",
    status: "available",
    scopes: ["read", "write"],
    iconUrl: "/connectors/trello.svg",
    orgId: "org-1",
  },
];

const seedMemory: MockMemoryEntry[] = [
  {
    id: "mem-1",
    kind: "working",
    key: "wf-1:competitor_list",
    value: '["Acme Corp", "BetaTech", "GammaSoft", "DeltaSys", "EpsilonIO"]',
    workflowId: "wf-1",
    spaceId: "space-product",
    userId: "user-1",
    confidence: 0.95,
    createdAt: "2024-06-10T08:15:00Z",
    orgId: "org-1",
  },
  {
    id: "mem-2",
    kind: "episodic",
    key: "user-1:preferred_report_format",
    value: "Markdown with embedded tables, no PDF preferred",
    userId: "user-1",
    confidence: 0.88,
    createdAt: "2024-05-20T14:00:00Z",
    orgId: "org-1",
  },
  {
    id: "mem-3",
    kind: "semantic",
    key: "pricing:saas_benchmarks_2024",
    value: "Median B2B SaaS pricing is $29/user/month for basic tier, $79 for premium",
    spaceId: "space-product",
    confidence: 0.92,
    createdAt: "2024-06-01T10:00:00Z",
    orgId: "org-1",
  },
  {
    id: "mem-4",
    kind: "user_preference",
    key: "user-2:favorite_model",
    value: "claude-3-5-sonnet",
    userId: "user-2",
    confidence: 0.99,
    createdAt: "2024-04-10T09:00:00Z",
    orgId: "org-1",
  },
  {
    id: "mem-5",
    kind: "working",
    key: "wf-2:component_list",
    value: '["Button", "Input", "Card", "Modal", "Dropdown", "Tabs", "Table", "Toast", "Tooltip", "Badge", "Avatar", "Skeleton"]',
    workflowId: "wf-2",
    spaceId: "space-eng",
    userId: "user-2",
    confidence: 0.97,
    createdAt: "2024-06-15T10:35:00Z",
    orgId: "org-1",
  },
];

const seedAuditEvents: MockAuditEvent[] = [
  {
    id: "audit-1",
    type: "workflow.created",
    actorId: "user-1",
    orgId: "org-1",
    workflowId: "wf-1",
    details: { objective: "Analyze competitor pricing strategies for Q3 2024" },
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0",
    createdAt: "2024-06-10T08:00:00Z",
  },
  {
    id: "audit-2",
    type: "workflow.started",
    actorId: "system",
    orgId: "org-1",
    workflowId: "wf-1",
    details: { planVersion: 1 },
    createdAt: "2024-06-10T08:00:30Z",
  },
  {
    id: "audit-3",
    type: "workflow.completed",
    actorId: "system",
    orgId: "org-1",
    workflowId: "wf-1",
    details: { creditsUsed: 42.3, durationSeconds: 4470 },
    createdAt: "2024-06-10T09:15:00Z",
  },
  {
    id: "audit-4",
    type: "workflow.created",
    actorId: "user-2",
    orgId: "org-1",
    workflowId: "wf-2",
    details: { objective: "Build a React component library" },
    createdAt: "2024-06-15T10:30:00Z",
  },
  {
    id: "audit-5",
    type: "budget.threshold",
    actorId: "system",
    orgId: "org-1",
    workflowId: "wf-5",
    details: { threshold: 40, spent: 40 },
    createdAt: "2024-06-14T12:30:00Z",
  },
];

const seedClarifications: MockClarification[] = [
  {
    id: "clar-1",
    workflowId: "wf-3",
    question: "Should the analysis focus on technical safety or policy/ethical frameworks?",
    context: "The objective mentions 'AI safety frameworks' which is ambiguous between technical safety (robustness, alignment) and policy frameworks (regulation, ethics).",
    answered: false,
    createdAt: "2024-06-20T14:05:00Z",
  },
];

const seedTeamInvites: MockTeamInvite[] = [
  {
    id: "inv-1",
    email: "jordan.lee@acme-research.com",
    role: "member",
    orgId: "org_acme_001",
    orgName: "Acme Research Partners",
    invitedById: "usr_7a3f9e2b1c4d",
    invitedByName: "Sarah Chen",
    token: "tok_invite_jordan_001",
    accepted: false,
    revoked: false,
    createdAt: "2025-01-10T09:00:00Z",
    expiresAt: "2025-02-10T09:00:00Z",
    acceptedAt: null,
  },
  {
    id: "inv-2",
    email: "taylor.morgan@acme-research.com",
    role: "viewer",
    orgId: "org_acme_001",
    orgName: "Acme Research Partners",
    invitedById: "usr_7a3f9e2b1c4d",
    invitedByName: "Sarah Chen",
    token: "tok_invite_taylor_002",
    accepted: false,
    revoked: false,
    createdAt: "2025-01-12T14:30:00Z",
    expiresAt: "2025-02-12T14:30:00Z",
    acceptedAt: null,
  },
];

const seedTeamMembers: MockTeamMember[] = [
  {
    id: "usr_7a3f9e2b1c4d",
    name: "Sarah Chen",
    email: "sarah.chen@acme-research.com",
    role: "admin",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    orgId: "org_acme_001",
    joinedAt: "2024-06-12T09:00:00Z",
    lastActiveAt: "2025-01-15T13:45:00Z",
  },
  {
    id: "usr_b8e5d1a4f7c2",
    name: "Marcus Johnson",
    email: "marcus.johnson@acme-research.com",
    role: "analyst",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    orgId: "org_acme_001",
    joinedAt: "2024-08-03T11:30:00Z",
    lastActiveAt: "2025-01-14T16:20:00Z",
  },
  {
    id: "usr_2f6c8d3e5b9a",
    name: "Alex Patel",
    email: "alex.patel@indie.dev",
    role: "engineer",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    orgId: "org_indie_002",
    joinedAt: "2024-09-20T14:15:00Z",
    lastActiveAt: "2025-01-15T10:10:00Z",
  },
];

// ── MockDB class ──────────────────────────────────────────────────────────────

class MockDB {
  workflows = new Map<string, MockWorkflow>();
  tasks = new Map<string, MockTask>();
  artifacts = new Map<string, MockArtifact>();
  spaces = new Map<string, MockSpace>();
  connectors = new Map<string, MockConnector>();
  memory = new Map<string, MockMemoryEntry>();
  auditEvents = new Map<string, MockAuditEvent>();
  clarifications = new Map<string, MockClarification>();
  workflowEvents = new Map<string, MockWorkflowEvent[]>();
  teamInvites = new Map<string, MockTeamInvite>();
  teamMembers = new Map<string, MockTeamMember>();

  constructor() {
    seedWorkflows.forEach((w) => this.workflows.set(w.id, w));
    seedTasks.forEach((t) => this.tasks.set(t.id, t));
    seedArtifacts.forEach((a) => this.artifacts.set(a.id, a));
    seedSpaces.forEach((s) => this.spaces.set(s.id, s));
    seedConnectors.forEach((c) => this.connectors.set(c.name, c));
    seedMemory.forEach((m) => this.memory.set(m.id, m));
    seedAuditEvents.forEach((a) => this.auditEvents.set(a.id, a));
    seedClarifications.forEach((c) => this.clarifications.set(c.id, c));
    seedTeamInvites.forEach((i) => this.teamInvites.set(i.id, i));
    seedTeamMembers.forEach((m) => this.teamMembers.set(m.id, m));
  }

  // ─── Workflows ───

  getWorkflow(id: string): MockWorkflow | undefined {
    return this.workflows.get(id);
  }

  listWorkflows(opts: {
    status?: string;
    space?: string;
    kind?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    orgId?: string;
  }): { data: MockWorkflow[]; total: number } {
    let items = Array.from(this.workflows.values());

    if (opts.orgId) {
      items = items.filter((w) => w.orgId === opts.orgId);
    }
    if (opts.status) {
      items = items.filter((w) => w.status === opts.status);
    }
    if (opts.space) {
      items = items.filter((w) => w.spaceId === opts.space);
    }
    if (opts.kind) {
      items = items.filter((w) =>
        w.deliverableKinds?.includes(opts.kind ?? "")
      );
    }
    if (opts.from) {
      const fromDate = new Date(opts.from).getTime();
      items = items.filter((w) => new Date(w.createdAt).getTime() >= fromDate);
    }
    if (opts.to) {
      const toDate = new Date(opts.to).getTime();
      items = items.filter((w) => new Date(w.createdAt).getTime() <= toDate);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 20;
    items = items.slice(offset, offset + limit);

    return { data: items, total };
  }

  createWorkflow(workflow: Record<string, unknown>): MockWorkflow {
    const now = new Date().toISOString();
    const newWorkflow: MockWorkflow = {
      ...(workflow as MockWorkflow),
      id: generateId("wf"),
      currentPlanVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(newWorkflow.id, newWorkflow);
    return newWorkflow;
  }

  updateWorkflow(id: string, patch: Record<string, unknown>): MockWorkflow | undefined {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.workflows.set(id, updated);
    return updated;
  }

  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  // ─── Tasks ───

  getTask(id: string): MockTask | undefined {
    return this.tasks.get(id);
  }

  listTasksByWorkflow(workflowId: string): MockTask[] {
    return Array.from(this.tasks.values())
      .filter((t) => t.workflowId === workflowId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createTask(task: Omit<MockTask, "id" | "createdAt">): MockTask {
    const newTask: MockTask = {
      ...task,
      id: generateId("task"),
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  updateTask(id: string, patch: Partial<MockTask>): MockTask | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.tasks.set(id, updated);
    return updated;
  }

  // ─── Artifacts ───

  getArtifact(id: string): MockArtifact | undefined {
    return this.artifacts.get(id);
  }

  listArtifactsByWorkflow(workflowId: string): MockArtifact[] {
    return Array.from(this.artifacts.values())
      .filter((a) => a.workflowId === workflowId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createArtifact(artifact: Omit<MockArtifact, "id" | "createdAt">): MockArtifact {
    const now = new Date().toISOString();
    const newArtifact: MockArtifact = {
      ...artifact,
      id: generateId("art"),
      presignedUrl: `https://mock-cdn.example.com/${generateId("presign")}/${artifact.name}`,
      presignedExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: now,
    };
    this.artifacts.set(newArtifact.id, newArtifact);
    return newArtifact;
  }

  // ─── Spaces ───

  getSpace(id: string): MockSpace | undefined {
    return this.spaces.get(id);
  }

  listSpaces(opts?: { orgId?: string; ownerId?: string }): MockSpace[] {
    let items = Array.from(this.spaces.values());
    if (opts?.orgId) {
      items = items.filter((s) => s.orgId === opts.orgId);
    }
    if (opts?.ownerId) {
      items = items.filter((s) => s.ownerId === opts.ownerId);
    }
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return items;
  }

  createSpace(space: Omit<MockSpace, "id" | "createdAt" | "updatedAt">): MockSpace {
    const now = new Date().toISOString();
    const newSpace: MockSpace = {
      ...space,
      id: generateId("space"),
      createdAt: now,
      updatedAt: now,
    };
    this.spaces.set(newSpace.id, newSpace);
    return newSpace;
  }

  updateSpace(id: string, patch: Partial<MockSpace>): MockSpace | undefined {
    const existing = this.spaces.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.spaces.set(id, updated);
    return updated;
  }

  deleteSpace(id: string): boolean {
    return this.spaces.delete(id);
  }

  // ─── Connectors ───

  getConnector(name: string): MockConnector | undefined {
    return this.connectors.get(name);
  }

  listConnectors(opts?: { orgId?: string }): MockConnector[] {
    let items = Array.from(this.connectors.values());
    if (opts?.orgId) {
      items = items.filter((c) => c.orgId === opts.orgId);
    }
    return items;
  }

  installConnector(name: string): MockConnector | undefined {
    const c = this.connectors.get(name);
    if (!c) return undefined;
    const updated: MockConnector = {
      ...c,
      status: "installed",
      installedAt: new Date().toISOString(),
      revokedAt: undefined,
      errorMessage: undefined,
    };
    this.connectors.set(name, updated);
    return updated;
  }

  revokeConnector(name: string): MockConnector | undefined {
    const c = this.connectors.get(name);
    if (!c) return undefined;
    const updated: MockConnector = {
      ...c,
      status: "revoked",
      revokedAt: new Date().toISOString(),
    };
    this.connectors.set(name, updated);
    return updated;
  }

  // ─── Memory ───

  getMemory(id: string): MockMemoryEntry | undefined {
    return this.memory.get(id);
  }

  listMemory(opts?: {
    kind?: string;
    query?: string;
    spaceId?: string;
    userId?: string;
    workflowId?: string;
    orgId?: string;
    limit?: number;
    offset?: number;
  }): { data: MockMemoryEntry[]; total: number } {
    let items = Array.from(this.memory.values());

    if (opts?.orgId) {
      items = items.filter((m) => m.orgId === opts.orgId);
    }
    if (opts?.kind) {
      items = items.filter((m) => m.kind === opts.kind);
    }
    if (opts?.spaceId) {
      items = items.filter((m) => m.spaceId === opts.spaceId);
    }
    if (opts?.userId) {
      items = items.filter((m) => m.userId === opts.userId);
    }
    if (opts?.workflowId) {
      items = items.filter((m) => m.workflowId === opts.workflowId);
    }
    if (opts?.query) {
      const q = opts.query.toLowerCase();
      items = items.filter(
        (m) =>
          m.key.toLowerCase().includes(q) ||
          m.value.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 50;
    items = items.slice(offset, offset + limit);

    return { data: items, total };
  }

  deleteMemory(id: string): boolean {
    return this.memory.delete(id);
  }

  // ─── Audit ───

  listAudit(opts?: {
    orgId?: string;
    workflowId?: string;
    actorId?: string;
    type?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): { data: MockAuditEvent[]; total: number } {
    let items = Array.from(this.auditEvents.values());

    if (opts?.orgId) {
      items = items.filter((a) => a.orgId === opts.orgId);
    }
    if (opts?.workflowId) {
      items = items.filter((a) => a.workflowId === opts.workflowId);
    }
    if (opts?.actorId) {
      items = items.filter((a) => a.actorId === opts.actorId);
    }
    if (opts?.type) {
      items = items.filter((a) => a.type === opts.type);
    }
    if (opts?.from) {
      const fromDate = new Date(opts.from).getTime();
      items = items.filter((a) => new Date(a.createdAt).getTime() >= fromDate);
    }
    if (opts?.to) {
      const toDate = new Date(opts.to).getTime();
      items = items.filter((a) => new Date(a.createdAt).getTime() <= toDate);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 50;
    items = items.slice(offset, offset + limit);

    return { data: items, total };
  }

  createAuditEvent(event: Omit<MockAuditEvent, "id" | "createdAt">): MockAuditEvent {
    const newEvent: MockAuditEvent = {
      ...event,
      id: generateId("audit"),
      createdAt: new Date().toISOString(),
    };
    this.auditEvents.set(newEvent.id, newEvent);
    return newEvent;
  }

  // ─── Clarifications ───

  getClarification(id: string): MockClarification | undefined {
    return this.clarifications.get(id);
  }

  answerClarification(id: string, answer: string): MockClarification | undefined {
    const c = this.clarifications.get(id);
    if (!c) return undefined;
    const updated: MockClarification = {
      ...c,
      answer,
      answered: true,
      answeredAt: new Date().toISOString(),
    };
    this.clarifications.set(id, updated);
    return updated;
  }

  listClarificationsByWorkflow(workflowId: string): MockClarification[] {
    return Array.from(this.clarifications.values())
      .filter((c) => c.workflowId === workflowId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // ─── Workflow Events (for SSE replay) ───

  appendWorkflowEvent(workflowId: string, event: MockWorkflowEvent) {
    const list = this.workflowEvents.get(workflowId) || [];
    list.push(event);
    this.workflowEvents.set(workflowId, list);
  }

  getWorkflowEvents(workflowId: string, afterId?: string): MockWorkflowEvent[] {
    const list = this.workflowEvents.get(workflowId) || [];
    if (!afterId) return list;
    const idx = list.findIndex((e) => e.id === afterId);
    if (idx === -1) return list;
    return list.slice(idx + 1);
  }
}

  // ─── Team Invites ───

  getInvite(id: string): MockTeamInvite | undefined {
    return this.teamInvites.get(id);
  }

  findInviteByEmail(email: string, orgId: string): MockTeamInvite | undefined {
    return Array.from(this.teamInvites.values()).find(
      (i) => i.email === email && i.orgId === orgId
    );
  }

  findInviteByToken(token: string): MockTeamInvite | undefined {
    return Array.from(this.teamInvites.values()).find((i) => i.token === token);
  }

  listInvites(opts?: { orgId?: string; pendingOnly?: boolean }): MockTeamInvite[] {
    let items = Array.from(this.teamInvites.values());
    if (opts?.orgId) {
      items = items.filter((i) => i.orgId === opts.orgId);
    }
    if (opts?.pendingOnly) {
      items = items.filter((i) => !i.accepted && !i.revoked);
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createInvite(invite: Omit<MockTeamInvite, "id" | "createdAt" | "expiresAt" | "token" | "accepted" | "revoked" | "acceptedAt">): MockTeamInvite {
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 30);

    const token = `invite_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;

    const newInvite: MockTeamInvite = {
      ...invite,
      id: generateId("inv"),
      token,
      accepted: false,
      revoked: false,
      acceptedAt: null,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    this.teamInvites.set(newInvite.id, newInvite);
    return newInvite;
  }

  revokeInvite(id: string): MockTeamInvite | undefined {
    const invite = this.teamInvites.get(id);
    if (!invite) return undefined;
    const updated = { ...invite, revoked: true };
    this.teamInvites.set(id, updated);
    return updated;
  }

  acceptInvite(token: string): MockTeamInvite | undefined {
    const invite = Array.from(this.teamInvites.values()).find((i) => i.token === token);
    if (!invite) return undefined;
    const updated: MockTeamInvite = {
      ...invite,
      accepted: true,
      acceptedAt: new Date().toISOString(),
    };
    this.teamInvites.set(invite.id, updated);
    return updated;
  }

  // ─── Team Members ───

  getMember(id: string): MockTeamMember | undefined {
    return this.teamMembers.get(id);
  }

  listMembers(opts?: { orgId?: string }): MockTeamMember[] {
    let items = Array.from(this.teamMembers.values());
    if (opts?.orgId) {
      items = items.filter((m) => m.orgId === opts.orgId);
    }
    return items.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  }

  addMember(member: Omit<MockTeamMember, "id" | "joinedAt">): MockTeamMember {
    const newMember: MockTeamMember = {
      ...member,
      id: generateId("usr"),
      joinedAt: new Date().toISOString(),
    };
    this.teamMembers.set(newMember.id, newMember);
    return newMember;
  }

  removeMember(id: string): boolean {
    return this.teamMembers.delete(id);
  }
}

export const db = new MockDB();
