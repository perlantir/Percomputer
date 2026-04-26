"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { ConsoleTable, StatusPill } from "./ConsoleTable";
import { useDebounceValue } from "@/src/hooks/useInterval";
import { useConsoleRole } from "@/src/hooks/useConsoleRole";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Network } from "lucide-react";

/* ──────────────────────────── demo data ──────────────────────────── */

interface TaskAttempt {
  id: string;
  model: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  latencyMs: number;
  error?: string;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  latencyMs: number;
  status: string;
}

interface Span {
  id: string;
  name: string;
  durationMs: number;
  status: string;
  traceLink: string;
}

interface WorkflowTask {
  id: string;
  label: string;
  kind: string;
  status: string;
  model?: string;
  description?: string;
  attempts: TaskAttempt[];
  toolCalls: ToolCall[];
  spans: Span[];
  prompt?: string;
  completion?: string;
  containsPII: boolean;
  traceId: string;
}

const demoTasks: WorkflowTask[] = Array.from({ length: 24 }, (_, i) => {
  const statuses = ["completed", "completed", "completed", "running", "failed", "pending"];
  const kinds = ["llm", "tool", "guardrail", "code", "embed", "search"];
  const models = ["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro", "o3-mini", "deepseek-chat"];
  const status = statuses[i % statuses.length];
  const kind = kinds[i % kinds.length];
  const model = kind === "llm" ? models[i % models.length] : undefined;
  const hasPII = i % 7 === 0;

  const attempts: TaskAttempt[] = Array.from(
    { length: status === "failed" ? 3 : 1 },
    (_, a) => ({
      id: `att-${i}-${a}`,
      model: model || "n/a",
      status: a === 2 && status === "failed" ? "failed" : "completed",
      startedAt: new Date(Date.now() - 1000 * 60 * (i + a + 1)).toISOString(),
      finishedAt:
        a === 2 && status === "failed"
          ? undefined
          : new Date(Date.now() - 1000 * 60 * (i + a)).toISOString(),
      tokensIn: 1200 + i * 100 + a * 50,
      tokensOut: 400 + i * 30 + a * 20,
      costCents: 3.2 + i * 0.4 + a * 0.8,
      latencyMs: 1200 + i * 200 + a * 500,
      error:
        a === 2 && status === "failed" ? "Rate limit exceeded (429)" : undefined,
    })
  );

  const toolCalls: ToolCall[] =
    kind === "tool"
      ? [
          {
            id: `tc-${i}`,
            name: `tool_${i % 4}`,
            arguments: { query: `search term ${i}`, limit: 10 },
            result: { hits: 3, items: ["a", "b", "c"] },
            latencyMs: 340,
            status: "completed",
          },
        ]
      : [];

  const spans: Span[] = [
    {
      id: `span-${i}-a`,
      name: "inference",
      durationMs: 1200 + i * 50,
      status: "ok",
      traceLink: `#/traces/trace-${i}-a`,
    },
    {
      id: `span-${i}-b`,
      name: "tokenize",
      durationMs: 12,
      status: "ok",
      traceLink: `#/traces/trace-${i}-b`,
    },
  ];

  return {
    id: `task-${i}`,
    label: `${kind}__${["generate", "parse", "validate", "transform", "summarize", "route"][i % 6]}_${i}`,
    kind,
    status,
    model,
    description: `Task ${i} performing ${kind} operation in workflow pipeline`,
    attempts,
    toolCalls,
    spans,
    prompt: hasPII
      ? `User asked about their SSN ending in 1234 and account #9876543210. Please verify identity.`
      : `Analyze the following data and produce a summary of key findings.`,
    completion: `Analysis complete. Found ${i + 1} relevant items.`,
    containsPII: hasPII,
    traceId: `trace-${i}-${Date.now()}`,
  };
});

/* ──────────────────────────── components ──────────────────────────── */

export default function WorkflowInspector() {
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [piiUnredacted, setPiiUnredacted] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [kindFilter, setKindFilter] = useState<string[]>([]);
  const [modelFilter, setModelFilter] = useState<string[]>([]);
  const [dagMode, setDagMode] = useState<"dag" | "table">("table");
  const { isAdmin } = useConsoleRole();

  const debouncedSearch = useDebounceValue(search, 200);

  const filtered = demoTasks.filter((t) => {
    if (debouncedSearch && !t.label.includes(debouncedSearch) && !t.id.includes(debouncedSearch)) return false;
    if (statusFilter.length && !statusFilter.includes(t.status)) return false;
    if (kindFilter.length && !kindFilter.includes(t.kind)) return false;
    if (modelFilter.length && (!t.model || !modelFilter.includes(t.model))) return false;
    return true;
  });

  const onRowClick = useCallback((row: WorkflowTask) => {
    setSelectedTask(row);
    setShowDrawer(true);
  }, []);

  const togglePii = (taskId: string) => {
    if (!isAdmin) return;
    setPiiUnredacted((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      if (next[taskId]) {
        // Record consent click
        console.log(`[AUDIT] PII unredacted for task ${taskId} at ${new Date().toISOString()}`);
      }
      return next;
    });
  };

  const allStatuses = Array.from(new Set(demoTasks.map((t) => t.status)));
  const allKinds = Array.from(new Set(demoTasks.map((t) => t.kind)));
  const allModels = Array.from(new Set(demoTasks.map((t) => t.model).filter(Boolean)));

  const toggleFilter = (val: string, arr: string[], set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const columns = [
    { key: "id", header: "ID", width: 80, sortable: true },
    { key: "label", header: "Task", width: 180, sortable: true },
    {
      key: "kind",
      header: "Kind",
      width: 70,
      sortable: true,
      render: (row: WorkflowTask) => (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] font-mono">
          {row.kind}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: 80,
      sortable: true,
      render: (row: WorkflowTask) => <StatusPill status={row.status} />,
    },
    {
      key: "model",
      header: "Model",
      width: 130,
      sortable: true,
      render: (row: WorkflowTask) => (
        <span className="font-mono text-[var(--text-secondary)]">{row.model || "—"}</span>
      ),
    },
    {
      key: "attempts",
      header: "Att.",
      width: 40,
      align: "right" as const,
      render: (row: WorkflowTask) => (
        <span className="font-mono">{row.attempts.length}</span>
      ),
    },
    {
      key: "toolCalls",
      header: "Tools",
      width: 45,
      align: "right" as const,
      render: (row: WorkflowTask) => (
        <span className="font-mono">{row.toolCalls.length}</span>
      ),
    },
    {
      key: "containsPII",
      header: "PII",
      width: 50,
      render: (row: WorkflowTask) =>
        row.containsPII ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/25">
            yes
          </span>
        ) : (
          <span className="text-[var(--text-tertiary)]">—</span>
        ),
    },
    {
      key: "traceId",
      header: "Trace",
      width: 110,
      render: (row: WorkflowTask) => (
        <span className="font-mono text-[10px] text-[var(--accent-primary)] truncate">
          {row.traceId.slice(0, 16)}…
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-md">
          <button
            onClick={() => setDagMode("dag")}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-l-md transition-colors",
              dagMode === "dag" ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            DAG
          </button>
          <button
            onClick={() => setDagMode("table")}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-r-md transition-colors",
              dagMode === "table" ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            Table
          </button>
        </div>

        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 text-[11px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-md w-44 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        />

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => toggleFilter(s, statusFilter, setStatusFilter)}
              className={cn(
                "px-1.5 py-0.5 text-[10px] rounded border transition-colors",
                statusFilter.includes(s)
                  ? "bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
                  : "bg-transparent border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Kind filter */}
        <div className="flex items-center gap-1">
          {allKinds.map((k) => (
            <button
              key={k}
              onClick={() => toggleFilter(k, kindFilter, setKindFilter)}
              className={cn(
                "px-1.5 py-0.5 text-[10px] rounded border transition-colors font-mono",
                kindFilter.includes(k)
                  ? "bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
                  : "bg-transparent border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {dagMode === "dag" ? (
            <DAGPlaceholder tasks={filtered} onNodeClick={onRowClick} />
          ) : (
            <ConsoleTable
              columns={columns}
              data={filtered}
              onRowClick={onRowClick}
              selectedRowId={selectedTask?.id}
              rowIdKey="id"
              maxHeight={800}
            />
          )}
        </div>

        {/* Side drawer */}
        {showDrawer && selectedTask && (
          <TaskDrawer
            task={selectedTask}
            unredacted={!!piiUnredacted[selectedTask.id]}
            onTogglePii={() => togglePii(selectedTask.id)}
            onClose={() => setShowDrawer(false)}
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── DAG Placeholder ──────────────────────────── */

function DAGPlaceholder({
  tasks,
  onNodeClick,
}: {
  tasks: WorkflowTask[];
  onNodeClick: (t: WorkflowTask) => void;
}) {
  // Simple SVG DAG representation
  const nodeW = 120;
  const nodeH = 40;
  const gapX = 40;
  const gapY = 30;
  const cols = 4;

  if (tasks.length === 0) {
    return (
      <EmptyState
        variant="search"
        icon={Network}
        title="No tasks match filters"
        description="Try adjusting your search or filter criteria to see tasks."
      />
    );
  }

  return (
    <div className="p-6 overflow-auto">
      <svg width={cols * (nodeW + gapX) + 40} height={Math.ceil(tasks.length / cols) * (nodeH + gapY) + 40}>
        {tasks.map((task, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = 20 + col * (nodeW + gapX);
          const y = 20 + row * (nodeH + gapY);
          const colorMap: Record<string, string> = {
            completed: "var(--success)",
            running: "var(--info)",
            failed: "var(--danger)",
            pending: "var(--warning)",
          };
          const fill = colorMap[task.status] || "var(--foreground-tertiary)";

          return (
            <g key={task.id} onClick={() => onNodeClick(task)} className="cursor-pointer">
              {/* Connection lines */}
              {col > 0 && (
                <line
                  x1={x - gapX}
                  y1={y + nodeH / 2}
                  x2={x}
                  y2={y + nodeH / 2}
                  stroke="var(--border-subtle)"
                  strokeWidth={1}
                />
              )}
              {row > 0 && col === 0 && (
                <line
                  x1={20 + (cols - 1) * (nodeW + gapX) + nodeW / 2}
                  y1={20 + (row - 1) * (nodeH + gapY) + nodeH}
                  x2={x + nodeW / 2}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeWidth={1}
                />
              )}
              {/* Node */}
              <rect
                x={x}
                y={y}
                width={nodeW}
                height={nodeH}
                rx={6}
                fill="var(--bg-surface)"
                stroke={fill}
                strokeWidth={2}
                className="hover:brightness-95"
              />
              <text x={x + 8} y={y + 16} fontSize={10} fill="var(--text-primary)" fontFamily="monospace">
                {task.label.slice(0, 18)}
              </text>
              <text x={x + 8} y={y + 30} fontSize={9} fill={fill} fontFamily="monospace">
                {task.status}
              </text>
              <circle cx={x + nodeW - 12} cy={y + nodeH / 2} r={4} fill={fill} opacity={0.5} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ──────────────────────────── Task Drawer ──────────────────────────── */

function TaskDrawer({
  task,
  unredacted,
  onTogglePii,
  onClose,
}: {
  task: WorkflowTask;
  unredacted: boolean;
  onTogglePii: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"prompt" | "completion" | "attempts" | "tools" | "spans">("prompt");
  const { isAdmin } = useConsoleRole();

  const redact = (text: string) => {
    if (!task.containsPII) return text;
    if (unredacted) return text;
    return text.replace(/\d{3}-?\d{2}-?\d{4}/g, "[SSN-REDACTED]").replace(/\d{10,}/g, "[ACCT-REDACTED]");
  };

  return (
    <div className="w-[480px] flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-subtle)]">
        <div>
          <div className="text-[11px] font-semibold text-[var(--text-primary)]">{task.label}</div>
          <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">{task.id}</div>
        </div>
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs p-1">
          ✕
        </button>
      </div>

      {/* Meta */}
      <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center gap-3">
        <StatusPill status={task.status} />
        {task.model && (
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">{task.model}</span>
        )}
        {task.containsPII && (
          <button
            onClick={onTogglePii}
            disabled={!isAdmin}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded border transition-colors",
              unredacted
                ? "bg-danger/15 text-danger border-danger/25"
                : "bg-warning/15 text-warning border-warning/25",
              !isAdmin && "opacity-50 cursor-not-allowed"
            )}
          >
            {unredacted ? "🔓 Unredacted (logged)" : "🔒 PII Redacted"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)]">
        {(["prompt", "completion", "attempts", "tools", "spans"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium transition-colors border-b-2 -mb-px",
              tab === t
                ? "text-[var(--accent-primary)] border-[var(--accent-primary)]"
                : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "attempts" && <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">({task.attempts.length})</span>}
            {t === "tools" && <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">({task.toolCalls.length})</span>}
            {t === "spans" && <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">({task.spans.length})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {tab === "prompt" && (
          <pre className="text-[11px] font-mono bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-md p-2.5 whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
            {redact(task.prompt || "—")}
          </pre>
        )}
        {tab === "completion" && (
          <pre className="text-[11px] font-mono bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-md p-2.5 whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
            {redact(task.completion || "—")}
          </pre>
        )}
        {tab === "attempts" && (
          <div className="space-y-2">
            {task.attempts.map((att) => (
              <div key={att.id} className="border border-[var(--border-subtle)] rounded-md p-2.5 bg-[var(--bg-canvas)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">{att.id}</span>
                  <StatusPill status={att.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-[var(--text-tertiary)]">
                  <div>
                    <span className="text-[var(--text-tertiary)]">tokens:</span>{" "}
                    <span className="font-mono text-[var(--text-secondary)]">
                      {att.tokensIn + att.tokensOut}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">cost:</span>{" "}
                    <span className="font-mono text-[var(--text-secondary)]">{att.costCents.toFixed(2)}¢</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">latency:</span>{" "}
                    <span className="font-mono text-[var(--text-secondary)]">{att.latencyMs}ms</span>
                  </div>
                </div>
                {att.error && (
                  <div className="mt-1.5 text-[10px] text-danger bg-danger/10 rounded px-1.5 py-1">
                    {att.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {tab === "tools" && (
          <div className="space-y-2">
            {task.toolCalls.length === 0 ? (
              <div className="text-[var(--text-tertiary)] text-[11px]">No tool calls</div>
            ) : (
              task.toolCalls.map((tc) => (
                <div key={tc.id} className="border border-[var(--border-subtle)] rounded-md p-2.5 bg-[var(--bg-canvas)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">{tc.name}</span>
                    <StatusPill status={tc.status} />
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mb-1">
                    latency: <span className="font-mono text-[var(--text-secondary)]">{tc.latencyMs}ms</span>
                  </div>
                  <div className="text-[10px] mb-1">
                    <span className="text-[var(--text-tertiary)]">args:</span>
                    <pre className="mt-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded p-1.5 font-mono text-[var(--text-secondary)]">
                      {JSON.stringify(tc.arguments, null, 1)}
                    </pre>
                  </div>
                  {tc.result && (
                    <div className="text-[10px]">
                      <span className="text-[var(--text-tertiary)]">result:</span>
                      <pre className="mt-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded p-1.5 font-mono text-success">
                        {JSON.stringify(tc.result, null, 1)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {tab === "spans" && (
          <div className="space-y-2">
            {task.spans.map((span) => (
              <div key={span.id} className="border border-[var(--border-subtle)] rounded-md p-2.5 bg-[var(--bg-canvas)] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[var(--text-primary)]">{span.name}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {span.durationMs}ms · {span.status}
                  </div>
                </div>
                <a
                  href={span.traceLink}
                  className="text-[10px] text-[var(--accent-primary)] hover:underline font-mono"
                  target="_blank"
                  rel="noreferrer"
                >
                  trace →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
