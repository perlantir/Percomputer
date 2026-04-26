/**
 * Export and format conversion utilities for workflows, artifacts, and tables.
 *
 * Provides deterministic conversion to Markdown, JSON, CSV, and a mock PDF
 * generator.  All functions run client-side and trigger a download via a
 * transient anchor element.
 */

import type { Workflow, Task, TaskEdge, Artifact } from "@/src/types/entities";
import type { ArtifactKind } from "@/src/types/enums";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ExportFormat = "pdf" | "markdown" | "json" | "csv";

export interface ExportableWorkflow {
  workflow: Workflow;
  tasks: Task[];
  edges: TaskEdge[];
  artifacts: Artifact[];
}

export interface ShareLinkOptions {
  /** Entity type to share */
  entityType: "workflow" | "artifact" | "space";
  /** Entity ID */
  entityId: string;
  /** Expiration in hours (1, 24, 168=7d, 720=30d, null=never) */
  expiresInHours: number | null;
  /** Whether the link requires authentication */
  requireAuth: boolean;
  /** Optional password protection */
  password?: string;
}

export interface EmbedOptions {
  workflowId: string;
  width: number;
  height: number;
  theme: "light" | "dark" | "auto";
  showHeader: boolean;
  allowInteraction: boolean;
  borderRadius: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Trigger a file download in the browser. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Escape a string for safe inclusion in CSV. */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a workflow and its tasks into a Markdown report. */
export function workflowToMarkdown(data: ExportableWorkflow): string {
  const { workflow, tasks, edges, artifacts } = data;

  const statusEmoji: Record<string, string> = {
    succeeded: "✅",
    failed: "❌",
    running: "⏳",
    cancelled: "🚫",
    pending: "⏸️",
    idle: "⏸️",
  };

  let md = `# Workflow Report: ${workflow.prompt}\n\n`;
  md += `| Property | Value |\n`;
  md += `|----------|-------|\n`;
  md += `| **ID** | \`${workflow.id}\` |\n`;
  md += `| **Status** | ${statusEmoji[workflow.status] ?? "🔘"} ${workflow.status} |\n`;
  md += `| **Space ID** | \`${workflow.spaceId}\` |\n`;
  md += `| **Created** | ${workflow.createdAt} |\n`;
  md += `| **Started** | ${workflow.startedAt ?? "—"} |\n`;
  md += `| **Finished** | ${workflow.finishedAt ?? "—"} |\n`;
  md += `| **Safety Class** | ${workflow.safetyClass} |\n`;
  if (workflow.statusReason) {
    md += `| **Status Reason** | ${workflow.statusReason} |\n`;
  }
  md += `\n---\n\n`;

  // Tasks
  md += `## Tasks (${tasks.length})\n\n`;
  if (tasks.length === 0) {
    md += `*No tasks recorded.*\n\n`;
  } else {
    md += `| # | Title | Kind | Status | Model | Duration | Tokens | Credits |\n`;
    md += `|---|-------|------|--------|-------|----------|--------|---------|\n`;
    tasks.forEach((t, i) => {
      const model = t.resolvedModelId ?? t.modelAttempts[0] ?? "—";
      const tokens = t.inputTokens + t.outputTokens;
      md += `| ${i + 1} | ${t.title} | ${t.kind} | ${statusEmoji[t.status] ?? ""} ${t.status} | ${model} | ${t.durationMs}ms | ${tokens} | ${t.creditsUsed} |\n`;
    });
    md += `\n`;

    // Task details
    md += `### Task Details\n\n`;
    tasks.forEach((t) => {
      md += `#### ${t.title}\n\n`;
      md += `- **ID:** \`${t.id}\`\n`;
      md += `- **Kind:** ${t.kind}\n`;
      md += `- **Status:** ${t.status}\n`;
      md += `- **DAG Level:** ${t.dagLevel}\n`;
      md += `- **Max Attempts:** ${t.maxAttempts}\n`;
      md += `- **Input Tokens:** ${t.inputTokens}\n`;
      md += `- **Output Tokens:** ${t.outputTokens}\n`;
      md += `- **Credits Used:** ${t.creditsUsed}\n`;
      md += `- **Duration:** ${t.durationMs}ms\n`;
      if (t.statusReason) md += `- **Reason:** ${t.statusReason}\n`;
      if (t.dependencies.length) md += `- **Dependencies:** ${t.dependencies.join(", ")}\n`;
      md += `\n**Instruction:**\n\n\`\`\`\n${t.instruction}\n\`\`\`\n\n`;
    });
  }

  // Edges
  md += `## DAG Edges (${edges.length})\n\n`;
  if (edges.length === 0) {
    md += `*No edges recorded.*\n\n`;
  } else {
    md += `| # | From | To | Type | Data Mapping |\n`;
    md += `|---|------|----|------|--------------|\n`;
    edges.forEach((e, i) => {
      md += `| ${i + 1} | \`${e.fromTaskId}\` | \`${e.toTaskId}\` | ${e.edgeType} | ${e.dataMapping ?? "—"} |\n`;
    });
    md += `\n`;
  }

  // Artifacts
  md += `## Artifacts (${artifacts.length})\n\n`;
  if (artifacts.length === 0) {
    md += `*No artifacts generated.*\n\n`;
  } else {
    md += `| # | Name | Kind | MIME | Size | Created |\n`;
    md += `|---|------|------|------|------|---------|\n`;
    artifacts.forEach((a, i) => {
      const size = a.sizeBytes < 1024
        ? `${a.sizeBytes} B`
        : a.sizeBytes < 1024 * 1024
          ? `${(a.sizeBytes / 1024).toFixed(1)} KB`
          : `${(a.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
      md += `| ${i + 1} | ${a.name} | ${a.kind} | ${a.mimeType} | ${size} | ${a.createdAt} |\n`;
    });
    md += `\n`;
  }

  md += `---\n\n*Exported from Multi-Model Agent Platform*\n`;

  return md;
}

/** Convert an artifact to Markdown. */
export function artifactToMarkdown(artifact: Artifact, content?: string): string {
  let md = `# Artifact: ${artifact.name}\n\n`;
  md += `| Property | Value |\n`;
  md += `|----------|-------|\n`;
  md += `| **ID** | \`${artifact.id}\` |\n`;
  md += `| **Kind** | ${artifact.kind} |\n`;
  md += `| **MIME** | ${artifact.mimeType} |\n`;
  md += `| **Size** | ${artifact.sizeBytes} bytes |\n`;
  md += `| **Created** | ${artifact.createdAt} |\n`;
  md += `| **Workflow** | \`${artifact.workflowId}\` |\n`;
  if (artifact.taskId) md += `| **Task** | \`${artifact.taskId}\` |\n`;
  md += `\n---\n\n`;

  if (content) {
    if (artifact.kind === "code_diff" || artifact.kind === "json") {
      const lang = artifact.kind === "code_diff" ? "diff" : "json";
      md += `## Content\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
    } else {
      md += `## Content\n\n${content}\n\n`;
    }
  }

  md += `---\n\n*Exported from Multi-Model Agent Platform*\n`;
  return md;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a workflow to a pretty-printed JSON blob. */
export function workflowToJSON(data: ExportableWorkflow): string {
  return JSON.stringify(data, null, 2);
}

/** Convert an artifact to JSON. */
export function artifactToJSON(artifact: Artifact, content?: string): string {
  const payload: Record<string, unknown> = { ...artifact };
  if (content !== undefined) payload.content = content;
  return JSON.stringify(payload, null, 2);
}

/** Convert an array of objects to JSON. */
export function objectsToJSON(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows, null, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV
// ─────────────────────────────────────────────────────────────────────────────

/** Convert an array of flat objects to CSV. */
export function objectsToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  let csv = keys.map(csvEscape).join(",") + "\n";
  for (const row of rows) {
    csv += keys.map((k) => csvEscape(row[k])).join(",") + "\n";
  }
  return csv;
}

/** Convert tasks to a CSV table. */
export function tasksToCSV(tasks: Task[]): string {
  const rows = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    kind: t.kind,
    status: t.status,
    dag_level: t.dagLevel,
    model_attempts: t.modelAttempts.join("; "),
    resolved_model: t.resolvedModelId ?? "",
    max_attempts: t.maxAttempts,
    input_tokens: t.inputTokens,
    output_tokens: t.outputTokens,
    credits_used: t.creditsUsed,
    duration_ms: t.durationMs,
    dependencies: t.dependencies.join("; "),
    status_reason: t.statusReason ?? "",
    started_at: t.startedAt ?? "",
    finished_at: t.finishedAt ?? "",
    created_at: t.createdAt,
  }));
  return objectsToCSV(rows);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF (mock)
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a mock PDF blob — in production this would use pdfmake or jspdf. */
export async function generateMockPDF(
  data: ExportableWorkflow | Artifact,
  type: "workflow" | "artifact" = "workflow"
): Promise<Blob> {
  // Build a minimal PDF structure (header + object xref + trailer)
  const now = new Date();
  const dateStr = `D:${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

  const title = type === "workflow" && "prompt" in data ? `Workflow: ${(data as Workflow).prompt}` : `Artifact: ${(data as Artifact).name}`;

  const content = type === "workflow"
    ? workflowToMarkdown(data as ExportableWorkflow)
    : artifactToMarkdown(data as Artifact);

  const text = content
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, "\\n")
    .replace(/#/g, "");

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${100 + text.length} >>
stream
BT /F1 10 Tf 50 750 Td (${text.slice(0, 4000)}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000400 00000 n 
trailer
<< /Size 6 /Root 1 0 R /Info << /Title (${title}) /Creator (Multi-Model Agent Platform) /CreationDate (${dateStr}) >> >>
startxref
500
%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Download dispatch
// ─────────────────────────────────────────────────────────────────────────────

/** Download a workflow in the requested format. */
export async function downloadWorkflow(
  data: ExportableWorkflow,
  format: ExportFormat,
  filenameBase?: string
): Promise<void> {
  const base = filenameBase ?? `workflow-${data.workflow.id.slice(-8)}`;

  switch (format) {
    case "markdown": {
      const md = workflowToMarkdown(data);
      downloadBlob(new Blob([md], { type: "text/markdown" }), `${base}.md`);
      break;
    }
    case "json": {
      const json = workflowToJSON(data);
      downloadBlob(new Blob([json], { type: "application/json" }), `${base}.json`);
      break;
    }
    case "csv": {
      const csv = tasksToCSV(data.tasks);
      downloadBlob(new Blob([csv], { type: "text/csv" }), `${base}-tasks.csv`);
      break;
    }
    case "pdf": {
      const pdf = await generateMockPDF(data, "workflow");
      downloadBlob(pdf, `${base}.pdf`);
      break;
    }
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/** Download an artifact in the requested format. */
export async function downloadArtifact(
  artifact: Artifact,
  format: ExportFormat,
  content?: string,
  filenameBase?: string
): Promise<void> {
  const base = filenameBase ?? `artifact-${artifact.name.replace(/\s+/g, "_")}`;

  switch (format) {
    case "markdown": {
      const md = artifactToMarkdown(artifact, content);
      downloadBlob(new Blob([md], { type: "text/markdown" }), `${base}.md`);
      break;
    }
    case "json": {
      const json = artifactToJSON(artifact, content);
      downloadBlob(new Blob([json], { type: "application/json" }), `${base}.json`);
      break;
    }
    case "csv": {
      if (!content) throw new Error("CSV export requires artifact content");
      let rows: Record<string, unknown>[];
      try {
        rows = JSON.parse(content);
        if (!Array.isArray(rows)) throw new Error("Content is not an array");
      } catch {
        // Fallback: treat each line as a row with a single "value" column
        rows = content.split("\n").filter(Boolean).map((line) => ({ value: line }));
      }
      const csv = objectsToCSV(rows);
      downloadBlob(new Blob([csv], { type: "text/csv" }), `${base}.csv`);
      break;
    }
    case "pdf": {
      const pdf = await generateMockPDF(artifact, "artifact");
      downloadBlob(pdf, `${base}.pdf`);
      break;
    }
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Share links
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a shareable link with optional expiration. */
export function generateShareLink(baseUrl: string, options: ShareLinkOptions): {
  url: string;
  expiresAt: string | null;
  token: string;
} {
  const token = `${options.entityType[0]}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

  const params = new URLSearchParams();
  params.set("t", token);
  if (options.expiresInHours !== null) {
    params.set("exp", String(options.expiresInHours));
  }
  if (options.requireAuth) {
    params.set("auth", "1");
  }

  const url = `${baseUrl}/share/${options.entityType}/${options.entityId}?${params.toString()}`;

  const expiresAt = options.expiresInHours !== null
    ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000).toISOString()
    : null;

  return { url, expiresAt, token };
}

/** Human-readable expiration label. */
export function expirationLabel(hours: number | null): string {
  if (hours === null) return "Never expires";
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours === 1) return "1 hour";
  if (hours < 24) return `${hours} hours`;
  if (hours === 24) return "1 day";
  if (hours < 168) return `${Math.round(hours / 24)} days`;
  if (hours === 168) return "7 days";
  if (hours < 720) return `${Math.round(hours / 24)} days`;
  if (hours === 720) return "30 days";
  return `${Math.round(hours / 720)} months`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Embed code
// ─────────────────────────────────────────────────────────────────────────────

/** Generate an iframe embed HTML snippet. */
export function generateEmbedCode(baseUrl: string, options: EmbedOptions): string {
  const src = new URL(`/embed/workflow/${options.workflowId}`, baseUrl);
  if (options.theme !== "auto") src.searchParams.set("theme", options.theme);
  if (!options.showHeader) src.searchParams.set("header", "0");
  if (!options.allowInteraction) src.searchParams.set("interaction", "0");

  const borderRadius = options.borderRadius;

  return `<iframe
  src="${src.toString()}"
  width="${options.width}"
  height="${options.height}"
  style="border: 1px solid rgba(128,128,128,0.25); border-radius: ${borderRadius}px;"
  allow="fullscreen"
  loading="lazy"
  title="Embedded Workflow"
></iframe>`;
}

/** Generate a script-based embed (responsive) for richer integrations. */
export function generateResponsiveEmbed(baseUrl: string, options: EmbedOptions & { minHeight?: number }): string {
  const src = new URL(`/embed/workflow/${options.workflowId}`, baseUrl);
  if (options.theme !== "auto") src.searchParams.set("theme", options.theme);
  if (!options.showHeader) src.searchParams.set("header", "0");
  if (!options.allowInteraction) src.searchParams.set("interaction", "0");

  const minH = options.minHeight ?? options.height;

  return `<!-- Responsive embed -->
<div id="mma-embed-${options.workflowId.slice(-8)}" style="width:100%; min-height:${minH}px;"></div>
<script>
(function() {
  const container = document.getElementById('mma-embed-${options.workflowId.slice(-8)}');
  const iframe = document.createElement('iframe');
  iframe.src = '${src.toString()}';
  iframe.style.width = '100%';
  iframe.style.height = '${options.height}px';
  iframe.style.border = '1px solid rgba(128,128,128,0.25)';
  iframe.style.borderRadius = '${options.borderRadius}px';
  iframe.allow = 'fullscreen';
  iframe.loading = 'lazy';
  iframe.title = 'Embedded Workflow';
  container.appendChild(iframe);
})();
</script>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clipboard
// ─────────────────────────────────────────────────────────────────────────────

/** Copy text to clipboard with fallback. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers / non-secure contexts
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
