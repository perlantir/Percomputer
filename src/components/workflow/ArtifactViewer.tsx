"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Table,
  Image,
  Code,
  FileJson,
  Download,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/layout/Toaster";

export type ArtifactKind =
  | "report_md"
  | "dataset_csv"
  | "image_png"
  | "image_jpg"
  | "code_diff"
  | "text_txt"
  | "json";

export interface ArtifactViewerProps {
  name: string;
  kind: ArtifactKind;
  content: string;
  sizeBytes: number;
  permalink?: string;
  downloadUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectLanguage(name: string): string {
  if (name.endsWith(".py")) return "python";
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "typescript";
  if (name.endsWith(".js") || name.endsWith(".jsx")) return "javascript";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".html")) return "html";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".sql")) return "sql";
  if (name.endsWith(".sh")) return "bash";
  return "text";
}

/* ── Markdown Viewer ── */
function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert text-[var(--text-primary)]">
      <div className="whitespace-pre-wrap leading-relaxed font-body">
        {content}
      </div>
    </div>
  );
}

/* ── CSV Table ── */
function CSVTable({ content }: { content: string }) {
  const rows = useMemo(() => {
    const lines = content.trim().split("\n");
    return lines.map((line) => {
      const cells: string[] = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          cells.push(cell.trim());
          cell = "";
        } else {
          cell += ch;
        }
      }
      cells.push(cell.trim());
      return cells;
    });
  }, [content]);

  if (rows.length === 0) return <p className="text-sm text-[var(--text-tertiary)]">Empty CSV</p>;

  const header = rows[0];
  const dataRows = rows.slice(1, 11); // first 10 data rows

  return (
    <div className="overflow-auto rounded-lg border border-[var(--border-subtle)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
            {header.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-2)]/50"
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-[var(--text-primary)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 11 && (
        <div className="px-3 py-2 text-xs text-[var(--text-tertiary)] border-t border-[var(--border-subtle)]">
          + {rows.length - 11} more rows
        </div>
      )}
    </div>
  );
}

/* ── Image Viewer ── */
function ImageViewer({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
        <Image className="h-12 w-12 text-[var(--text-tertiary)]" />
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">
        {name} — Image preview would load here
      </p>
    </div>
  );
}

/* ── Code Viewer ── */
function CodeViewer({ content, name }: { content: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const lang = detectLanguage(name);

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard", "Code copied.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5">
        <span className="text-xs font-mono text-[var(--text-tertiary)]">{lang}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopy} disabled={isCopying}>
            {isCopying ? <Loader2 className="h-3 w-3 animate-spin" /> : copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {isCopying ? "Copying..." : copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <pre className="overflow-auto bg-[var(--bg-canvas)] p-4 text-sm font-mono leading-relaxed">
        <code className="text-[var(--text-primary)]">{content}</code>
      </pre>
    </div>
  );
}

/* ── JSON Viewer ── */
function JSONViewer({ content }: { content: string }) {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content]);

  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard", "JSON copied.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5">
        <span className="text-xs font-mono text-[var(--text-tertiary)]">json</span>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopy} disabled={isCopying}>
          {isCopying ? <Loader2 className="h-3 w-3 animate-spin" /> : copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {isCopying ? "Copying..." : copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-auto bg-[var(--bg-canvas)] p-4 text-sm font-mono leading-relaxed">
        <code className="text-[var(--text-primary)]">{formatted}</code>
      </pre>
    </div>
  );
}

/* ── Main ArtifactViewer ── */
export const ArtifactViewer = React.memo(function ArtifactViewer({
  name,
  kind,
  content,
  sizeBytes,
  permalink,
  downloadUrl,
}: ArtifactViewerProps) {
  const iconMap: Record<ArtifactKind, React.ReactNode> = {
    report_md: <FileText className="h-4 w-4" />,
    dataset_csv: <Table className="h-4 w-4" />,
    image_png: <Image className="h-4 w-4" />,
    image_jpg: <Image className="h-4 w-4" />,
    code_diff: <Code className="h-4 w-4" />,
    text_txt: <FileText className="h-4 w-4" />,
    json: <FileJson className="h-4 w-4" />,
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--bg-surface-2)] text-[var(--accent-primary)]">
          {iconMap[kind]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-[var(--text-primary)]">{name}</div>
          <div className="text-xs text-[var(--text-tertiary)]">
            {formatBytes(sizeBytes)} · {kind}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {permalink && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
              <a href={permalink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
            </Button>
          )}
          {downloadUrl && (
            <Button variant="secondary" size="sm" className="h-8 gap-1 text-xs" asChild>
              <a href={downloadUrl} download>
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[600px] overflow-auto">
        {kind === "report_md" || kind === "text_txt" ? (
          <MarkdownViewer content={content} />
        ) : kind === "dataset_csv" ? (
          <CSVTable content={content} />
        ) : kind === "image_png" || kind === "image_jpg" ? (
          <ImageViewer name={name} />
        ) : kind === "json" ? (
          <JSONViewer content={content} />
        ) : (
          <CodeViewer content={content} name={name} />
        )}
      </div>
    </div>
  );
});
