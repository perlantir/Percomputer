"use client";

import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import DiffViewer from "./DiffViewer";
import {
  FileText,
  Image,
  Code,
  BookOpen,
  FileJson,
  FileSpreadsheet,
  ArrowLeftRight,
  Eye,
} from "lucide-react";

export interface ArtifactCompareProps {
  leftArtifact: CompareArtifactDetail;
  rightArtifact: CompareArtifactDetail;
  className?: string;
}

export interface CompareArtifactDetail {
  id: string;
  name: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
  createdAt: string;
  checksum: string | null;
  metadata?: Record<string, unknown>;
}

export default function ArtifactCompare({
  leftArtifact,
  rightArtifact,
  className,
}: ArtifactCompareProps) {
  const [activeTab, setActiveTab] = useState<"diff" | "preview-left" | "preview-right">("diff");

  const contentType = detectContentType(leftArtifact.mimeType, leftArtifact.name);

  const isIdentical = leftArtifact.checksum && rightArtifact.checksum
    ? leftArtifact.checksum === rightArtifact.checksum
    : leftArtifact.content === rightArtifact.content;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-1 mb-3">
        <ArrowLeftRight className="w-5 h-5 text-[var(--accent-primary)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Artifact Comparison
        </h2>
        {isIdentical && (
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 font-medium">
            Identical
          </span>
        )}
      </div>

      {/* Artifact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <ArtifactCard artifact={leftArtifact} side="left" />
        <ArtifactCard artifact={rightArtifact} side="right" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] mb-3">
        <TabButton
          active={activeTab === "diff"}
          onClick={() => setActiveTab("diff")}
          icon={<Code className="w-3.5 h-3.5" />}
          label="Diff"
        />
        <TabButton
          active={activeTab === "preview-left"}
          onClick={() => setActiveTab("preview-left")}
          icon={<Eye className="w-3.5 h-3.5" />}
          label={`Preview: ${leftArtifact.name}`}
        />
        <TabButton
          active={activeTab === "preview-right"}
          onClick={() => setActiveTab("preview-right")}
          icon={<Eye className="w-3.5 h-3.5" />}
          label={`Preview: ${rightArtifact.name}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "diff" && (
          <DiffViewer
            oldText={leftArtifact.content}
            newText={rightArtifact.content}
            oldLabel={leftArtifact.name}
            newLabel={rightArtifact.name}
            contentType={contentType}
            defaultViewMode="side-by-side"
            className="h-full"
            collapsible
          />
        )}
        {activeTab === "preview-left" && (
          <ArtifactPreview artifact={leftArtifact} contentType={contentType} />
        )}
        {activeTab === "preview-right" && (
          <ArtifactPreview artifact={rightArtifact} contentType={contentType} />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────── Sub-components ──────────────────────────── */

function ArtifactCard({
  artifact,
  side,
}: {
  artifact: CompareArtifactDetail;
  side: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        side === "left"
          ? "border-[var(--danger)]/20 bg-[var(--danger)]/4"
          : "border-[var(--success)]/20 bg-[var(--success)]/4"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <ArtifactIcon mimeType={artifact.mimeType} name={artifact.name} />
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
            {artifact.name}
          </h3>
        </div>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-mono",
            side === "left"
              ? "bg-[var(--danger)]/10 text-[var(--danger)]"
              : "bg-[var(--success)]/10 text-[var(--success)]"
          )}
        >
          {side === "left" ? "Before" : "After"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--text-tertiary)]">
        <span className="font-mono">{formatBytes(artifact.sizeBytes)}</span>
        <span className="font-mono">{artifact.mimeType}</span>
        {artifact.checksum && (
          <span className="font-mono truncate max-w-[120px]" title={artifact.checksum}>
            {artifact.checksum.slice(0, 8)}…
          </span>
        )}
      </div>
    </div>
  );
}

function ArtifactPreview({
  artifact,
  contentType,
}: {
  artifact: CompareArtifactDetail;
  contentType: "code" | "markdown" | "plain";
}) {
  return (
    <div className="h-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">
            Preview
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
          {artifact.name}
        </span>
      </div>
      <div className="p-4">
        {contentType === "markdown" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-[13px] text-[var(--text-primary)] leading-relaxed">
              {artifact.content}
            </pre>
          </div>
        ) : contentType === "code" ? (
          <pre className="whitespace-pre-wrap font-mono text-[12px] text-[var(--text-primary)] leading-relaxed">
            {artifact.content}
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-[12px] text-[var(--text-secondary)] leading-relaxed">
            {artifact.content}
          </pre>
        )}
      </div>
    </div>
  );
}

function TabButton({
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
        "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px",
        active
          ? "text-[var(--accent-primary)] border-[var(--accent-primary)]"
          : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
      )}
    >
      {icon}
      <span className="hidden sm:inline truncate max-w-[160px]">{label}</span>
    </button>
  );
}

function ArtifactIcon({ mimeType, name }: { mimeType: string; name: string }) {
  if (mimeType.startsWith("image/")) return <Image className="w-4 h-4 text-[var(--accent-secondary)]" />;
  if (mimeType.includes("json")) return <FileJson className="w-4 h-4 text-[var(--accent-tertiary)]" />;
  if (mimeType.includes("csv") || mimeType.includes("sheet"))
    return <FileSpreadsheet className="w-4 h-4 text-[var(--success)]" />;
  if (mimeType.includes("markdown") || name.endsWith(".md"))
    return <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />;
  if (mimeType.includes("html") || mimeType.includes("javascript") || mimeType.includes("typescript"))
    return <Code className="w-4 h-4 text-[var(--syntax-function)]" />;
  return <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />;
}

/* ──────────────────────────── Utilities ──────────────────────────── */

function detectContentType(mimeType: string, name: string): "code" | "markdown" | "plain" {
  if (mimeType.includes("markdown") || name.endsWith(".md")) return "markdown";
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("python") ||
    mimeType.includes("java") ||
    mimeType.includes("xml") ||
    mimeType.includes("yaml") ||
    mimeType.includes("sql")
  )
    return "code";
  return "plain";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
