"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/src/lib/utils";
import { useConsoleRole, confirmAction } from "@/src/hooks/useConsoleRole";

const currentPolicyYaml = `routing_policy:
  version: "2.1"
  default_strategy: "cost_aware"
  
  tiers:
    premium:
      providers: ["openai", "anthropic"]
      max_cost_per_1k_tokens: 0.05
      min_quality_score: 90
    standard:
      providers: ["google", "mistral"]
      max_cost_per_1k_tokens: 0.02
      min_quality_score: 80
    economy:
      providers: ["deepseek", "groq"]
      max_cost_per_1k_tokens: 0.005
      min_quality_score: 70

  fallback:
    enabled: true
    max_retries: 2
    retry_delay_ms: 500
    
  circuit_breaker:
    failure_threshold: 5
    recovery_timeout_ms: 30000
    half_open_max_calls: 3
    
  canary:
    enabled: true
    percentage: 5
    target_model: "gpt-4o"
`;

const dryRunResults = [
  { dispatchId: "disp-9821", workflow: "wf-search-v2", task: "generate_query", routedTo: "claude-3.5-sonnet", oldRoute: "gpt-4o", match: true, latency: 1420, cost: 5.12 },
  { dispatchId: "disp-9822", workflow: "wf-search-v2", task: "synthesize", routedTo: "gpt-4o", oldRoute: "gpt-4o", match: true, latency: 1200, cost: 4.82 },
  { dispatchId: "disp-9823", workflow: "wf-code-review", task: "review_diff", routedTo: "o3-mini", oldRoute: "claude-3.5-sonnet", match: false, latency: 2100, cost: 6.45 },
  { dispatchId: "disp-9824", workflow: "wf-code-review", task: "suggest_fixes", routedTo: "claude-3.5-sonnet", oldRoute: "claude-3.5-sonnet", match: true, latency: 1380, cost: 5.12 },
  { dispatchId: "disp-9825", workflow: "wf-support-triage", task: "classify", routedTo: "gemini-1.5-pro", oldRoute: "gpt-4o-mini", match: false, latency: 980, cost: 2.31 },
  { dispatchId: "disp-9826", workflow: "wf-support-triage", task: "draft_response", routedTo: "deepseek-chat", oldRoute: "gpt-4o-mini", match: false, latency: 1560, cost: 0.89 },
  { dispatchId: "disp-9827", workflow: "wf-analytics", task: "parse_request", routedTo: "gpt-4o", oldRoute: "gpt-4o", match: true, latency: 1100, cost: 3.20 },
  { dispatchId: "disp-9828", workflow: "wf-analytics", task: "run_query", routedTo: "llama-3.1-70b", oldRoute: "llama-3.1-70b", match: true, latency: 1800, cost: 1.45 },
];

const dryRunSummary = {
  total: 1000,
  changed: 147,
  unchanged: 853,
  estimatedCostDelta: -12.4,
  estimatedLatencyDelta: +3.2,
  qualityImpact: "+1.8%",
};

export default function RoutingPolicyEditor() {
  const [yaml, setYaml] = useState(currentPolicyYaml);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({
    valid: true,
    errors: [],
  });
  const [canaryPct, setCanaryPct] = useState(5);
  const [showDiff, setShowDiff] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useConsoleRole();

  const validate = useCallback(
    (text: string) => {
      const errors: string[] = [];
      if (!text.includes("routing_policy:")) errors.push("Missing root key 'routing_policy'");
      if (!text.includes("version:")) errors.push("Missing version field");
      if (!text.includes("tiers:")) errors.push("Missing tiers section");
      if (text.includes("\t")) errors.push("Contains tabs — use spaces");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (line.includes(":") && !line.match(/^\s*#/)) {
          const beforeColon = line.split(":")[0];
          if (beforeColon && beforeColon.match(/[A-Z]/)) {
            errors.push(`Line ${i + 1}: keys should be snake_case`);
          }
        }
      });
      setValidation({ valid: errors.length === 0, errors });
    },
    []
  );

  const handleYamlChange = (text: string) => {
    setYaml(text);
    validate(text);
  };

  const handleSave = () => {
    if (!isAdmin) return;
    if (!confirmAction("Save routing policy? This will affect live traffic dispatching.")) {
      return;
    }
    setSaving(true);
    setTimeout(() => setSaving(false), 1200);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <button
          onClick={handleSave}
          disabled={!validation.valid || saving || !isAdmin}
          className={cn(
            "px-3 py-1 text-[11px] font-medium rounded-md transition-colors",
            validation.valid && !saving && isAdmin
              ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]/90"
              : "bg-[var(--text-tertiary)]/20 text-[var(--text-tertiary)] cursor-not-allowed"
          )}
        >
          {saving ? "Saving…" : "Save Policy"}
        </button>
        <button className="px-3 py-1 text-[11px] font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
          Rollback
        </button>
        <button
          onClick={() => setShowDiff(!showDiff)}
          className={cn(
            "px-3 py-1 text-[11px] font-medium rounded-md border transition-colors",
            showDiff
              ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30"
              : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          )}
        >
          Diff
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">Canary</span>
          <input
            type="range"
            min={0}
            max={100}
            value={canaryPct}
            onChange={(e) => setCanaryPct(Number(e.target.value))}
            className="w-24 accent-[var(--accent-primary)] h-1"
          />
          <span className="text-[11px] font-mono text-[var(--text-secondary)] w-8">{canaryPct}%</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {showDiff && (
            <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
              <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)] mb-1">
                Diff vs Current
              </div>
              <DiffView oldYaml={currentPolicyYaml} newYaml={yaml} />
            </div>
          )}
          <div className="flex-1 flex">
            <textarea
              value={yaml}
              onChange={(e) => handleYamlChange(e.target.value)}
              className="flex-1 p-3 text-[11px] font-mono leading-relaxed bg-[var(--bg-surface)] text-[var(--text-primary)] resize-none focus:outline-none border-r border-[var(--border-subtle)]"
              spellCheck={false}
            />
            {/* Validation panel */}
            <div className="w-56 flex-shrink-0 bg-[var(--bg-canvas)] border-l border-[var(--border-subtle)] flex flex-col">
              <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">
                  Validation
                </div>
              </div>
              <div className="p-3 space-y-2">
                {validation.valid ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-success">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Schema valid
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-danger">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    {validation.errors.length} errors
                  </div>
                )}
                {validation.errors.map((err, i) => (
                  <div key={i} className="text-[10px] text-danger bg-danger/10 rounded px-1.5 py-1">
                    {err}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dry-run panel */}
        <div className="w-80 flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <div className="text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">
              Dry Run · Last 1000 Dispatches
            </div>
          </div>
          <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Total: <span className="font-mono text-[var(--text-secondary)]">{dryRunSummary.total}</span>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Changed: <span className="font-mono text-warning">{dryRunSummary.changed}</span>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Cost Δ: <span className="font-mono text-success">{dryRunSummary.estimatedCostDelta}%</span>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Latency Δ: <span className="font-mono text-warning">{dryRunSummary.estimatedLatencyDelta}%</span>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)] col-span-2">
              Quality: <span className="font-mono text-success">{dryRunSummary.qualityImpact}</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="divide-y divide-border-subtle">
              {dryRunResults.map((r) => (
                <div key={r.dispatchId} className="px-3 py-2 hover:bg-[var(--bg-hover)]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">{r.dispatchId}</span>
                    <span
                      className={cn(
                        "text-[9px] px-1 py-0 rounded",
                        r.match ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                      )}
                    >
                      {r.match ? "same" : "changed"}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    {r.workflow} / <span className="text-[var(--text-secondary)]">{r.task}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                    <span className="text-[var(--text-tertiary)] line-through">{r.oldRoute}</span>
                    <span className="text-[var(--text-tertiary)]">→</span>
                    <span className="font-mono text-[var(--accent-primary)]">{r.routedTo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffView({ oldYaml, newYaml }: { oldYaml: string; newYaml: string }) {
  const oldLines = oldYaml.split("\n");
  const newLines = newYaml.split("\n");
  const maxLen = Math.max(oldLines.length, newLines.length);

  const lines = Array.from({ length: maxLen }, (_, i) => {
    const oldLine = oldLines[i] || "";
    const newLine = newLines[i] || "";
    if (oldLine === newLine) return { type: "same" as const, text: oldLine };
    if (!oldLine && newLine) return { type: "add" as const, text: newLine };
    if (oldLine && !newLine) return { type: "remove" as const, text: oldLine };
    return { type: "change" as const, oldText: oldLine, newText: newLine };
  });

  return (
    <div className="font-mono text-[10px] leading-4 max-h-32 overflow-auto border border-[var(--border-subtle)] rounded bg-[var(--bg-surface)] p-1.5">
      {lines.map((line, i) => {
        if (line.type === "same")
          return (
            <div key={i} className="text-[var(--text-secondary)] px-1">
              <span className="text-[var(--text-tertiary)] w-5 inline-block text-right mr-2">{i + 1}</span>
              {line.text || " "}
            </div>
          );
        if (line.type === "add")
          return (
            <div key={i} className="bg-success/10 text-success px-1">
              <span className="text-success w-5 inline-block text-right mr-2">+{i + 1}</span>
              {line.text}
            </div>
          );
        if (line.type === "remove")
          return (
            <div key={i} className="bg-danger/10 text-danger px-1">
              <span className="text-danger w-5 inline-block text-right mr-2">-{i + 1}</span>
              {line.text}
            </div>
          );
        return (
          <div key={i}>
            <div className="bg-danger/10 text-danger px-1">
              <span className="text-danger w-5 inline-block text-right mr-2">-{i + 1}</span>
              {line.oldText}
            </div>
            <div className="bg-success/10 text-success px-1">
              <span className="text-success w-5 inline-block text-right mr-2">+{i + 1}</span>
              {line.newText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
