"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/src/lib/utils";
import SelectWorkflow, { type WorkflowOption } from "@/src/components/compare/SelectWorkflow";
import WorkflowCompare, {
  type CompareArtifact,
  type CompareTask,
} from "@/src/components/compare/WorkflowCompare";
import ArtifactCompare from "@/src/components/compare/ArtifactCompare";
import {
  GitCompare,
  ArrowRightLeft,
  Workflow,
  FileText,
  Code,
} from "lucide-react";

const DiffViewer = dynamic(() => import("@/src/components/compare/DiffViewer"), {
  ssr: false,
});

type CompareMode = "workflow" | "artifact" | "text";

/* ──────────────────────────── Mock Data ──────────────────────────── */

const mockWorkflows: WorkflowOption[] = [
  {
    id: "wf-001",
    name: "Research Assistant v1",
    prompt: "Analyze market trends for Q3 2024 and produce a summary report with visualizations",
    status: "completed",
    createdAt: "2024-06-15T09:30:00Z",
    version: 1,
    spaceName: "Market Research",
  },
  {
    id: "wf-002",
    name: "Research Assistant v2",
    prompt: "Analyze market trends for Q3 2024, produce a summary report with visualizations, and include competitor analysis",
    status: "completed",
    createdAt: "2024-06-15T11:45:00Z",
    version: 2,
    spaceName: "Market Research",
  },
  {
    id: "wf-003",
    name: "Code Review Pipeline",
    prompt: "Review the authentication module for security vulnerabilities and code quality issues",
    status: "failed",
    createdAt: "2024-06-14T14:20:00Z",
    version: 1,
    spaceName: "Engineering",
  },
  {
    id: "wf-004",
    name: "Code Review Pipeline v2",
    prompt: "Review the authentication module for security vulnerabilities, code quality issues, and performance bottlenecks",
    status: "running",
    createdAt: "2024-06-14T16:00:00Z",
    version: 2,
    spaceName: "Engineering",
  },
  {
    id: "wf-005",
    name: "Data Pipeline ETL",
    prompt: "Extract customer data from CRM, transform with validation rules, and load into analytics warehouse",
    status: "completed",
    createdAt: "2024-06-13T08:00:00Z",
    version: 1,
    spaceName: "Data Engineering",
  },
];

const mockTasksLeft: CompareTask[] = [
  { id: "t1", title: "Parse user query", kind: "guardrail", status: "completed", durationMs: 120, inputTokens: 45, outputTokens: 12, creditsUsed: 2, modelId: "gpt-4o-mini" },
  { id: "t2", title: "Generate search query", kind: "llm", status: "completed", durationMs: 890, inputTokens: 120, outputTokens: 45, creditsUsed: 8, modelId: "gpt-4o" },
  { id: "t3", title: "Search web sources", kind: "tool", status: "completed", durationMs: 3400, inputTokens: 0, outputTokens: 0, creditsUsed: 1 },
  { id: "t4", title: "Synthesize results", kind: "llm", status: "completed", durationMs: 1200, inputTokens: 800, outputTokens: 350, creditsUsed: 25, modelId: "gpt-4o" },
  { id: "t5", title: "Validate output", kind: "guardrail", status: "completed", durationMs: 200, inputTokens: 350, outputTokens: 8, creditsUsed: 3, modelId: "gpt-4o-mini" },
];

const mockTasksRight: CompareTask[] = [
  { id: "t1", title: "Parse user query", kind: "guardrail", status: "completed", durationMs: 115, inputTokens: 45, outputTokens: 12, creditsUsed: 2, modelId: "gpt-4o-mini" },
  { id: "t2", title: "Generate search query", kind: "llm", status: "completed", durationMs: 920, inputTokens: 150, outputTokens: 48, creditsUsed: 9, modelId: "gpt-4o" },
  { id: "t3a", title: "Search web sources", kind: "tool", status: "completed", durationMs: 3200, inputTokens: 0, outputTokens: 0, creditsUsed: 1 },
  { id: "t3b", title: "Search knowledge base", kind: "tool", status: "completed", durationMs: 1800, inputTokens: 0, outputTokens: 0, creditsUsed: 0 },
  { id: "t3c", title: "Check cache", kind: "tool", status: "completed", durationMs: 45, inputTokens: 0, outputTokens: 0, creditsUsed: 0 },
  { id: "t4", title: "Synthesize results", kind: "llm", status: "completed", durationMs: 1450, inputTokens: 950, outputTokens: 420, creditsUsed: 30, modelId: "claude-3-5-sonnet" },
  { id: "t5", title: "Validate output", kind: "guardrail", status: "completed", durationMs: 190, inputTokens: 420, outputTokens: 8, creditsUsed: 3, modelId: "gpt-4o-mini" },
  { id: "t6", title: "Log metrics", kind: "code", status: "completed", durationMs: 80, inputTokens: 0, outputTokens: 0, creditsUsed: 0 },
];

const mockArtifactsLeft: CompareArtifact[] = [
  { id: "a1", name: "report.md", kind: "markdown", sizeBytes: 4520, mimeType: "text/markdown", createdAt: "2024-06-15T09:35:00Z" },
  { id: "a2", name: "chart.png", kind: "image", sizeBytes: 128000, mimeType: "image/png", createdAt: "2024-06-15T09:36:00Z" },
];

const mockArtifactsRight: CompareArtifact[] = [
  { id: "a1", name: "report.md", kind: "markdown", sizeBytes: 8940, mimeType: "text/markdown", createdAt: "2024-06-15T11:50:00Z" },
  { id: "a2", name: "chart.png", kind: "image", sizeBytes: 145000, mimeType: "image/png", createdAt: "2024-06-15T11:51:00Z" },
  { id: "a3", name: "competitor-analysis.json", kind: "json", sizeBytes: 12400, mimeType: "application/json", createdAt: "2024-06-15T11:52:00Z" },
];

const mockArtifactLeft = {
  id: "art-l",
  name: "config.yaml",
  kind: "yaml",
  mimeType: "application/yaml",
  sizeBytes: 2400,
  content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-config
  namespace: production
data:
  MAX_WORKERS: "4"
  TIMEOUT_MS: "30000"
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
features:
  enableWebSearch: true
  enableCache: false
  enableMetrics: true`,
  createdAt: "2024-06-14T10:00:00Z",
  checksum: "a1b2c3d4",
};

const mockArtifactRight = {
  id: "art-r",
  name: "config.yaml",
  kind: "yaml",
  mimeType: "application/yaml",
  sizeBytes: 2680,
  content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-config
  namespace: production
data:
  MAX_WORKERS: "8"
  TIMEOUT_MS: "60000"
  LOG_LEVEL: "debug"
  CACHE_TTL: "7200"
  RATE_LIMIT: "100"
features:
  enableWebSearch: true
  enableCache: true
  enableMetrics: true
  enableTracing: true`,
  createdAt: "2024-06-14T14:00:00Z",
  checksum: "e5f6g7h8",
};

const mockTextOld = `# Project Overview

The agent platform uses a DAG-based orchestration system.
Tasks are executed in topological order with retry logic.

## Architecture
- Planner: breaks down prompts into task graphs
- Executor: runs tasks with model routing
- Synthesizer: combines outputs into final answers

## Roadmap
1. Multi-model support
2. Cost optimization
3. Safety guardrails
`;

const mockTextNew = `# Project Overview

The agent platform uses a DAG-based orchestration system.
Tasks are executed in topological order with retry logic and caching.

## Architecture
- Planner: breaks down prompts into task graphs with constraint checking
- Executor: runs tasks with intelligent model routing and fallback
- Synthesizer: combines outputs into coherent final answers
- Monitor: tracks token usage and latency in real-time

## Roadmap
1. Multi-model support
2. Cost optimization with budget caps
3. Safety guardrails and content filtering
4. Custom tool integration
`;

/* ──────────────────────────── Page ──────────────────────────── */

export default function ComparePage() {
  const [mode, setMode] = useState<CompareMode>("workflow");
  const [leftWorkflowId, setLeftWorkflowId] = useState<string>("wf-001");
  const [rightWorkflowId, setRightWorkflowId] = useState<string>("wf-002");

  const leftWorkflow = mockWorkflows.find((w) => w.id === leftWorkflowId)!;
  const rightWorkflow = mockWorkflows.find((w) => w.id === rightWorkflowId)!;

  const swapWorkflows = () => {
    setLeftWorkflowId(rightWorkflowId);
    setRightWorkflowId(leftWorkflowId);
  };

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 30% at 50% 0%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 60%)`,
        }}
      />

      {/* Page header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <GitCompare className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
                  Compare
                </h1>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  Diff workflows, artifacts, and text
                </p>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="sm:ml-auto flex items-center bg-[var(--bg-surface-2)] rounded-lg border border-[var(--border-subtle)] p-0.5">
              <ModeTab
                active={mode === "workflow"}
                onClick={() => setMode("workflow")}
                icon={<Workflow className="w-3.5 h-3.5" />}
                label="Workflow"
              />
              <ModeTab
                active={mode === "artifact"}
                onClick={() => setMode("artifact")}
                icon={<FileText className="w-3.5 h-3.5" />}
                label="Artifact"
              />
              <ModeTab
                active={mode === "text"}
                onClick={() => setMode("text")}
                icon={<Code className="w-3.5 h-3.5" />}
                label="Text"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 overflow-hidden">
        {/* Subtle gradient background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 30% at 50% 0%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 60%)`,
          }}
        />
        {/* Workflow selectors — shown for workflow & artifact modes */}
        {(mode === "workflow" || mode === "artifact") && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
              <div className="flex-1">
                <SelectWorkflow
                  workflows={mockWorkflows}
                  selectedId={leftWorkflowId}
                  onSelect={setLeftWorkflowId}
                  label="Base (Before)"
                  side="left"
                  disabledIds={[rightWorkflowId]}
                />
              </div>

              <button
                onClick={swapWorkflows}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] hover:border-[var(--border-default)] transition-all text-[var(--text-tertiary)] hover:text-[var(--text-primary)] self-center md:self-end"
                aria-label="Swap workflows"
                title="Swap workflows"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Swap</span>
              </button>

              <div className="flex-1">
                <SelectWorkflow
                  workflows={mockWorkflows}
                  selectedId={rightWorkflowId}
                  onSelect={setRightWorkflowId}
                  label="Compare (After)"
                  side="right"
                  disabledIds={[leftWorkflowId]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="min-h-[500px]">
          {mode === "workflow" && (
            <WorkflowCompare
              leftWorkflow={leftWorkflow}
              rightWorkflow={rightWorkflow}
              leftTasks={mockTasksLeft}
              rightTasks={mockTasksRight}
              leftArtifacts={mockArtifactsLeft}
              rightArtifacts={mockArtifactsRight}
            />
          )}

          {mode === "artifact" && (
            <ArtifactCompare
              leftArtifact={mockArtifactLeft}
              rightArtifact={mockArtifactRight}
            />
          )}

          {mode === "text" && (
            <div className="flex flex-col h-[calc(100dvh-16rem)]">
              <DiffViewer
                oldText={mockTextOld}
                newText={mockTextNew}
                oldLabel="Original"
                newLabel="Revised"
                contentType="markdown"
                defaultViewMode="side-by-side"
                className="h-full"
                collapsible
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ──────────────────────────── Sub-components ──────────────────────────── */

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
        active
          ? "bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-subtle)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
