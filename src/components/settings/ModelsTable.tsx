"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/src/lib/utils";
import {
  DEMO_MODELS,
  type ModelCard,
} from "@/src/data/demo-models";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/src/components/ui/table";
import { Switch } from "@/src/components/ui/switch";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Cpu,
} from "lucide-react";
import { EmptyState } from "@/src/components/ui/empty-state";

type SortKey = "name" | "tier" | "successRate" | "avgLatencyMs" | "costPer1kInput" | "totalCalls";
type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

function fetchModels(): Promise<ModelCard[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(DEMO_MODELS), 200);
  });
}

const HEADER_LABELS: Record<SortKey, string> = {
  name: "Model",
  tier: "Tier",
  successRate: "Success Rate",
  avgLatencyMs: "Avg Latency",
  costPer1kInput: "Cost / 1k",
  totalCalls: "Total Calls",
};

export function ModelsTable() {
  const [sort, setSort] = useState<SortState>({ key: "totalCalls", dir: "desc" });
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    DEMO_MODELS.forEach((m) => { map[m.id] = true; });
    return map;
  });

  const { data: models, isLoading } = useQuery({
    queryKey: ["settings-models"],
    queryFn: fetchModels,
    initialData: DEMO_MODELS,
  });

  const toggleSort = (key: SortKey) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const sorted = [...(models ?? [])].sort((a, b) => {
    const aVal = a[sort.key];
    const bVal = b[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * dir;
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * dir;
    }
    return 0;
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sort.key !== column) return <ArrowUpDown className="ml-1 h-3 w-3 text-foreground-tertiary" />;
    return sort.dir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-accent-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-accent-primary" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-skeleton rounded-md" />
        ))}
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <EmptyState
        variant="no-data"
        icon={Cpu}
        title="No models configured"
        description="Models will appear here once they are configured."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface shadow-low overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {(Object.keys(HEADER_LABELS) as SortKey[]).map((key) => (
                <TableHead key={key} className="cursor-pointer select-none" onClick={() => toggleSort(key)}>
                  <span className="inline-flex items-center">
                    {HEADER_LABELS[key]}
                    <SortIcon column={key} />
                  </span>
                </TableHead>
              ))}
              <TableHead className="text-right">Override</TableHead>
              <TableHead className="text-right">Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground-primary">{model.name}</span>
                    <span className="text-2xs text-foreground-tertiary">{model.provider}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-2xs font-medium capitalize text-foreground-secondary">
                    {model.tier}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "text-sm font-medium",
                    model.successRate >= 0.99 ? "text-[var(--semantic-success)]" :
                    model.successRate >= 0.95 ? "text-foreground-secondary" :
                    "text-[var(--semantic-warning)]"
                  )}>
                    {(model.successRate * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground-secondary">{model.avgLatencyMs.toLocaleString()} ms</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground-secondary">${model.costPer1kInput.toFixed(4)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground-secondary">{model.totalCalls.toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-right">
                  <select
                    value={overrides[model.id] ?? "default"}
                    onChange={(e) =>
                      setOverrides((prev) => ({ ...prev, [model.id]: e.target.value }))
                    }
                    className="rounded-md border border-border-default bg-surface-2 px-2 py-1 text-xs text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  >
                    <option value="default">Default</option>
                    <option value="orchestrator">Orchestrator</option>
                    <option value="reasoning">Reasoning</option>
                    <option value="balanced">Balanced</option>
                    <option value="small">Small</option>
                    <option value="specialist">Specialist</option>
                  </select>
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={enabledMap[model.id] ?? true}
                    onCheckedChange={(checked) =>
                      setEnabledMap((prev) => ({ ...prev, [model.id]: checked }))
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
