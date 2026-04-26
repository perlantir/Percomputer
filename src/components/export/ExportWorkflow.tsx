"use client";

import * as React from "react";
import { useState } from "react";
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileDown,
  Download,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  downloadWorkflow,
  workflowToMarkdown,
  workflowToJSON,
  tasksToCSV,
  type ExportFormat,
  type ExportableWorkflow,
} from "@/src/lib/export-utils";
import { toast } from "@/src/components/layout/Toaster";

interface ExportWorkflowProps {
  data: ExportableWorkflow;
  children?: React.ReactNode;
  onExport?: (format: ExportFormat) => void;
}

const FORMAT_CONFIG: Record<
  ExportFormat,
  { label: string; icon: React.ReactNode; ext: string; description: string }
> = {
  pdf: {
    label: "PDF Document",
    icon: <FileDown className="h-4 w-4" />,
    ext: ".pdf",
    description: "Formatted report with tables and summary",
  },
  markdown: {
    label: "Markdown",
    icon: <FileText className="h-4 w-4" />,
    ext: ".md",
    description: "Human-readable text with headers and tables",
  },
  json: {
    label: "JSON",
    icon: <FileCode className="h-4 w-4" />,
    ext: ".json",
    description: "Machine-readable structured data",
  },
  csv: {
    label: "CSV (Tasks)",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    ext: ".csv",
    description: "Spreadsheet of task details",
  },
};

export function ExportWorkflow({ data, children, onExport }: ExportWorkflowProps) {
  const [open, setOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("markdown");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState<ExportFormat | null>(null);
  const [previewTab, setPreviewTab] = useState<ExportFormat>("markdown");

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    setCompleted(null);
    try {
      await downloadWorkflow(data, format);
      setCompleted(format);
      onExport?.(format);
      toast.success("Export complete", `Workflow exported as ${FORMAT_CONFIG[format].label}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error("Export failed", msg);
    } finally {
      setLoading(false);
      setTimeout(() => setCompleted(null), 2000);
    }
  };

  const filenameBase = `workflow-${data.workflow.id.slice(-8)}`;

  const getPreview = (format: ExportFormat): string => {
    switch (format) {
      case "markdown":
        return workflowToMarkdown(data);
      case "json":
        return workflowToJSON(data);
      case "csv":
        return tasksToCSV(data.tasks);
      case "pdf":
        return `<!-- PDF preview not available in browser -->
Workflow: ${data.workflow.prompt}
Status: ${data.workflow.status}
Tasks: ${data.tasks.length}
Artifacts: ${data.artifacts.length}`;
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 dark:bg-[var(--bg-surface)]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[var(--text-primary)]">
            Export Workflow
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Download this workflow in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 pb-6">
          {/* Format selector */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(FORMAT_CONFIG) as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setActiveFormat(fmt)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                  activeFormat === fmt
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-3)]"
                )}
                aria-pressed={activeFormat === fmt}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    activeFormat === fmt
                      ? "bg-[var(--accent-primary)] text-[var(--text-inverse)]"
                      : "bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                  )}
                >
                  {FORMAT_CONFIG[fmt].icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {FORMAT_CONFIG[fmt].label}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {FORMAT_CONFIG[fmt].ext}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)]">
            {FORMAT_CONFIG[activeFormat].description}
          </p>

          {/* Preview */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
              <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as ExportFormat)}>
                <TabsList className="h-7 bg-[var(--bg-surface-2)]">
                  <TabsTrigger value="markdown" className="px-2 py-0.5 text-xs">
                    Markdown
                  </TabsTrigger>
                  <TabsTrigger value="json" className="px-2 py-0.5 text-xs">
                    JSON
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="px-2 py-0.5 text-xs">
                    CSV
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="text-xs text-[var(--text-tertiary)]">
                Preview
              </span>
            </div>
            <pre className="max-h-48 overflow-auto p-3 text-xs leading-relaxed text-[var(--text-primary)]">
              <code>{getPreview(previewTab)}</code>
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[var(--text-tertiary)]">
              {data.tasks.length} tasks &middot; {data.artifacts.length} artifacts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-[var(--text-secondary)]"
              >
                Cancel
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="gap-2 border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : completed === activeFormat ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export {FORMAT_CONFIG[activeFormat].label}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                >
                  {(Object.keys(FORMAT_CONFIG) as ExportFormat[]).map((fmt) => (
                    <DropdownMenuItem
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="gap-2 text-[var(--text-primary)] focus:bg-[var(--bg-surface-2)] focus:text-[var(--text-primary)]"
                    >
                      {FORMAT_CONFIG[fmt].icon}
                      {FORMAT_CONFIG[fmt].label}
                      {completed === fmt && (
                        <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
                  <DropdownMenuItem
                    onClick={() => handleExport("pdf")}
                    className="gap-2 text-[var(--text-primary)] focus:bg-[var(--bg-surface-2)] focus:text-[var(--text-primary)]"
                  >
                    <FileDown className="h-4 w-4" />
                    Export All as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
