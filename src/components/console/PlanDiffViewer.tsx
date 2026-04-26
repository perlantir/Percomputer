"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils";

interface PlanNode {
  id: string;
  label: string;
  kind: string;
  x: number;
  y: number;
}

interface PlanEdge {
  from: string;
  to: string;
}

interface PlanVersion {
  id: string;
  name: string;
  nodes: PlanNode[];
  edges: PlanEdge[];
  reason: string;
  createdAt: string;
}

const planA: PlanVersion = {
  id: "rev-42",
  name: "v42",
  reason: "Initial plan with sequential LLM calls",
  createdAt: "2024-06-01T10:00:00Z",
  nodes: [
    { id: "n1", label: "parse_input", kind: "guardrail", x: 100, y: 60 },
    { id: "n2", label: "generate_query", kind: "llm", x: 100, y: 160 },
    { id: "n3", label: "search_web", kind: "tool", x: 100, y: 260 },
    { id: "n4", label: "synthesize", kind: "llm", x: 100, y: 360 },
    { id: "n5", label: "validate_output", kind: "guardrail", x: 100, y: 460 },
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3" },
    { from: "n3", to: "n4" },
    { from: "n4", to: "n5" },
  ],
};

const planB: PlanVersion = {
  id: "rev-43",
  name: "v43",
  reason: "Parallelized search and added caching layer",
  createdAt: "2024-06-01T10:15:00Z",
  nodes: [
    { id: "n1", label: "parse_input", kind: "guardrail", x: 100, y: 60 },
    { id: "n2", label: "generate_query", kind: "llm", x: 100, y: 160 },
    { id: "n3a", label: "search_web", kind: "tool", x: 40, y: 260 },
    { id: "n3b", label: "search_kb", kind: "tool", x: 160, y: 260 },
    { id: "n3c", label: "check_cache", kind: "tool", x: 280, y: 260 },
    { id: "n4", label: "synthesize", kind: "llm", x: 100, y: 360 },
    { id: "n5", label: "validate_output", kind: "guardrail", x: 100, y: 460 },
    { id: "n6", label: "log_metrics", kind: "code", x: 220, y: 460 },
  ],
  edges: [
    { from: "n1", to: "n2" },
    { from: "n2", to: "n3a" },
    { from: "n2", to: "n3b" },
    { from: "n2", to: "n3c" },
    { from: "n3a", to: "n4" },
    { from: "n3b", to: "n4" },
    { from: "n3c", to: "n4" },
    { from: "n4", to: "n5" },
    { from: "n5", to: "n6" },
  ],
};

const revisions: PlanVersion[] = [planA, planB];

function computeDiff(left: PlanVersion, right: PlanVersion) {
  const leftIds = new Set(left.nodes.map((n) => n.id));
  const rightIds = new Set(right.nodes.map((n) => n.id));

  const added = right.nodes.filter((n) => !leftIds.has(n.id));
  const removed = left.nodes.filter((n) => !rightIds.has(n.id));
  const changed = right.nodes.filter((n) => {
    const ln = left.nodes.find((x) => x.id === n.id);
    return ln && (ln.label !== n.label || ln.kind !== n.kind);
  });

  return { added, removed, changed };
}

export default function PlanDiffViewer() {
  const [leftRev, setLeftRev] = useState<string>("rev-42");
  const [rightRev, setRightRev] = useState<string>("rev-43");

  const left = revisions.find((r) => r.id === leftRev) || revisions[0];
  const right = revisions.find((r) => r.id === rightRev) || revisions[1];
  const diff = computeDiff(left, right);
  const diffNodeIds = new Set([
    ...diff.added.map((n) => n.id),
    ...diff.removed.map((n) => n.id),
    ...diff.changed.map((n) => n.id),
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">Before</span>
          <select
            value={leftRev}
            onChange={(e) => setLeftRev(e.target.value)}
            className="text-[11px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
          >
            {revisions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.createdAt.slice(0, 16)}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[var(--text-tertiary)]">→</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">After</span>
          <select
            value={rightRev}
            onChange={(e) => setRightRev(e.target.value)}
            className="text-[11px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
          >
            {revisions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.createdAt.slice(0, 16)}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <span className="w-2 h-2 rounded-full bg-success" /> Added
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <span className="w-2 h-2 rounded-full bg-danger" /> Removed
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <span className="w-2 h-2 rounded-full bg-warning" /> Changed
          </span>
        </div>
      </div>

      {/* Reason */}
      <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
        <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">Reason: </span>
        <span className="text-[11px] text-[var(--text-secondary)]">{right.reason}</span>
      </div>

      {/* Side by side */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-[var(--border-subtle)] overflow-auto">
          <PlanCanvas plan={left} diffIds={diffNodeIds} mode="before" diff={diff} />
        </div>
        <div className="flex-1 overflow-auto">
          <PlanCanvas plan={right} diffIds={diffNodeIds} mode="after" diff={diff} />
        </div>
      </div>

      {/* Diff summary */}
      <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-4">
        <span className="text-[10px] text-[var(--text-tertiary)]">
          Added: <span className="font-mono text-success">{diff.added.length}</span>
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">
          Removed: <span className="font-mono text-danger">{diff.removed.length}</span>
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">
          Changed: <span className="font-mono text-warning">{diff.changed.length}</span>
        </span>
      </div>
    </div>
  );
}

function PlanCanvas({
  plan,
  diffIds,
  mode,
  diff,
}: {
  plan: PlanVersion;
  diffIds: Set<string>;
  mode: "before" | "after";
  diff: { added: PlanNode[]; removed: PlanNode[]; changed: PlanNode[] };
}) {
  const isAdded = (n: PlanNode) => mode === "after" && diff.added.some((a) => a.id === n.id);
  const isRemoved = (n: PlanNode) => mode === "before" && diff.removed.some((r) => r.id === n.id);
  const isChanged = (n: PlanNode) => diff.changed.some((c) => c.id === n.id);

  const kindColors: Record<string, string> = {
    llm: "#20B8CD",
    tool: "#22c55e",
    guardrail: "#f59e0b",
    code: "#8b5cf6",
  };

  const nodeW = 100;
  const nodeH = 32;

  return (
    <div className="p-4 min-h-full">
      <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-3">
        {plan.name} · {plan.nodes.length} nodes · {plan.edges.length} edges
      </div>
      <svg width={360} height={520}>
        {/* Edges */}
        {plan.edges.map((edge, i) => {
          const fromNode = plan.nodes.find((n) => n.id === edge.from);
          const toNode = plan.nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          const removedEdge = mode === "before" && (diff.removed.some((n) => n.id === edge.from || n.id === edge.to));
          const newEdge = mode === "after" && (diff.added.some((n) => n.id === edge.from || n.id === edge.to));
          return (
            <line
              key={i}
              x1={fromNode.x + nodeW / 2}
              y1={fromNode.y + nodeH}
              x2={toNode.x + nodeW / 2}
              y2={toNode.y}
              stroke={removedEdge ? "var(--danger)" : newEdge ? "var(--success)" : "var(--border-medium)"}
              strokeWidth={removedEdge || newEdge ? 2 : 1}
              strokeDasharray={removedEdge ? "4 2" : undefined}
            />
          );
        })}

        {/* Nodes */}
        {plan.nodes.map((node) => {
          const fill = kindColors[node.kind] || "var(--foreground-tertiary)";
          const stroke = isAdded()
            ? "var(--success)"
            : isRemoved()
            ? "var(--danger)"
            : isChanged()
            ? "var(--warning)"
            : fill;
          const strokeWidth = isAdded() || isRemoved() || isChanged() ? 2.5 : 1;
          const bg = isRemoved()
            ? "rgba(239,68,68,0.06)"
            : isAdded()
            ? "rgba(34,197,94,0.06)"
            : isChanged()
            ? "rgba(245,158,11,0.06)"
            : "var(--bg-surface)";

          return (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={nodeW}
                height={nodeH}
                rx={4}
                fill={bg}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              <text
                x={node.x + nodeW / 2}
                y={node.y + 13}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-primary)"
                fontFamily="monospace"
              >
                {node.label.slice(0, 14)}
              </text>
              <text
                x={node.x + nodeW / 2}
                y={node.y + 26}
                textAnchor="middle"
                fontSize={8}
                fill={fill}
                fontFamily="monospace"
              >
                {node.kind}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
