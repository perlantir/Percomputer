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
  AlertCircle,
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  downloadArtifact,
  artifactToMarkdown,
  artifactToJSON,
  objectsToCSV,
  type ExportFormat,
} from "@/src/lib/export-utils";
import { toast } from "@/src/components/layout/Toaster";
import type { Artifact, ArtifactKind } from "@/src/types";

interface ExportArtifactProps {
  artifact: Artifact;
  content?: string;
  children?: React.ReactNode;
  onExport?: (format: ExportFormat) => void;
}

interface FormatMeta {
  label: string;
  icon: React.ReactNode;
  ext: string;
  description: string;
  supported: ArtifactKind[];
}

const FORMAT_META: Record<ExportFormat, FormatMeta> = {
  pdf: {
    label: "PDF",
    icon: <FileDown className="h-4 w-4" />,
    ext: ".pdf",
    description: "Portable document with artifact metadata",
    supported: ["report_md", "dataset_csv", "code_diff", "text_txt", "json"],
  },
  markdown: {
    label: "Markdown",
    icon: <FileText className="h-4 w-4" />,
    ext: ".md",
    description: "Rendered text with artifact metadata",
    supported: ["report_md", "code_diff", "text_txt", "json"],
  },
  json: {
    label: "JSON",
    icon: <FileCode className="h-4 w-4" />,
    ext: ".json",
    description: "Structured artifact data with optional content",
    supported: ["json", "dataset_csv", "report_md", "code_diff", "text_txt"],
  },
  csv: {
    label: "CSV",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    ext: ".csv",
    description: "Tabular data extracted from dataset or JSON",
    supported: ["dataset_csv", "json"],
  },
};

function isFormatSupported(format: ExportFormat, kind: ArtifactKind): boolean {
  return FORMAT_META[format].supported.includes(kind);
}

export function ExportArtifact({
  artifact,
  content,
  children,
  onExport,
}: ExportArtifactProps) {
  const [open, setOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("markdown");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"content" | "meta">("content");

  // Default to first supported format
  const supportedFormats = (Object.keys(FORMAT_META) as ExportFormat[]).filter((f) =>
    isFormatSupported(f, artifact.kind)
  );

  const handleExport = async (format: ExportFormat) => {
    if (!isFormatSupported(format, artifact.kind)) {
      setError(`Format "${format}" is not supported for ${artifact.kind} artifacts.`);
      return;
    }
    setLoading(true);
    setCompleted(null);
    setError(null);
    try {
      await downloadArtifact(artifact, format, content);
      setCompleted(format);
      onExport?.(format);
      toast.success("Export complete", `"${artifact.name}" exported as ${FORMAT_META[format].label}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setError(msg);
      toast.error("Export failed", msg);
    } finally {
      setLoading(false);
      setTimeout(() => setCompleted(null), 2000);
    }
  };

  const getPreview = (): string => {
    if (previewTab === "meta") {
      return [
        `ID:         ${artifact.id}`,
        `Name:       ${artifact.name}`,
        `Kind:       ${artifact.kind}`,
        `MIME:       ${artifact.mimeType}`,
        `Size:       ${artifact.sizeBytes} bytes`,
        `Created:    ${artifact.createdAt}`,
        `Workflow:   ${artifact.workflowId}`,
        `Task:       ${artifact.taskId ?? "—"}`,
        `Checksum:   ${artifact.checksum ?? "—"}`,
        `URL:        ${artifact.storageUrl}`,
      ].join("\n");
    }

    switch (activeFormat) {
      case "markdown":
        return artifactToMarkdown(artifact, content);
      case "json":
        return artifactToJSON(artifact, content);
      case "csv": {
        if (!content) return "No content available for CSV preview.";
        try {
          const rows = JSON.parse(content);
          if (Array.isArray(rows)) return objectsToCSV(rows).slice(0, 2000);
        } catch {
          return objectsToCSV(
            content
              .split("\n")
              .filter(Boolean)
              .map((line) => ({ value: line }))
          ).slice(0, 2000);
        }
        return "";
      }
      case "pdf":
        return `PDF preview not available in browser.\n\nArtifact: ${artifact.name}\nKind: ${artifact.kind}\nSize: ${artifact.sizeBytes} bytes`;
      default:
        return "";
    }
  };

  const firstSupported = supportedFormats[0] ?? "markdown";
  const currentFormat = isFormatSupported(activeFormat, artifact.kind)
    ? activeFormat
    : firstSupported;

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

      <DialogContent className="max-w-xl gap-0 overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 dark:bg-[var(--bg-surface)]">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[var(--text-primary)]">
            Export Artifact
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Download "{artifact.name}" in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 pb-6">
          {/* Format chips */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMAT_META) as ExportFormat[]).map((fmt) => {
              const supported = isFormatSupported(fmt, artifact.kind);
              return (
                <button
                  key={fmt}
                  onClick={() => supported && setActiveFormat(fmt)}
                  disabled={!supported}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    !supported && "cursor-not-allowed opacity-40",
                    currentFormat === fmt && supported
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : supported &&
                          "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
                  )}
                  aria-pressed={currentFormat === fmt}
                  title={supported ? undefined : `Not supported for ${artifact.kind}`}
                >
                  {FORMAT_META[fmt].icon}
                  {FORMAT_META[fmt].label}
                </button>
              );
            })}
          </div>

          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)]">
            {FORMAT_META[currentFormat].description}
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Preview */}
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
              <Tabs
                value={previewTab}
                onValueChange={(v) => setPreviewTab(v as "content" | "meta")}
              >
                <TabsList className="h-7 bg-[var(--bg-surface-2)]">
                  <TabsTrigger value="content" className="px-2 py-0.5 text-xs">
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="meta" className="px-2 py-0.5 text-xs">
                    Metadata
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="text-xs text-[var(--text-tertiary)]">
                Preview
              </span>
            </div>
            <pre className="max-h-56 overflow-auto p-3 text-xs leading-relaxed text-[var(--text-primary)]">
              <code>{getPreview()}</code>
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-[var(--text-secondary)]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={loading || !isFormatSupported(currentFormat, artifact.kind)}
              onClick={() => handleExport(currentFormat)}
              className="gap-2 bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : completed === currentFormat ? (
                <Check className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loading
                ? "Exporting..."
                : completed === currentFormat
                  ? "Downloaded"
                  : `Export ${FORMAT_META[currentFormat].label}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
