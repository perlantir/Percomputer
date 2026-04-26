"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import type { FileAttachment } from "@/src/types/frontend";
import {
  FileText,
  Image,
  FileCode,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  FileArchive,
  File,
  X,
  UploadCloud,
} from "lucide-react";

export interface AttachmentPreviewProps {
  attachments: FileAttachment[];
  onRemove: (id: string) => void;
  onAddFiles?: (files: FileList) => void;
  isDragOver?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-4 w-4" />;
  if (mimeType.startsWith("audio/")) return <FileAudio className="h-4 w-4" />;
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4" />;
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return <FileArchive className="h-4 w-4" />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return <FileSpreadsheet className="h-4 w-4" />;
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("typescript") ||
    mimeType.includes("python") ||
    mimeType.includes("java")
  )
    return <FileCode className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function AttachmentPreview({
  attachments,
  onRemove,
  onAddFiles,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: AttachmentPreviewProps) {
  const hasAttachments = attachments.length > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Drag-and-drop zone */}
      {onAddFiles && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-xs font-medium transition-all duration-fast ease-out",
            isDragOver
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
          )}
          aria-label="Drag and drop files here"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Drop files here or click to attach</span>
        </div>
      )}

      {/* File list */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className={cn(
                "group inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-2.5 py-1.5 text-xs transition-all duration-fast ease-out",
                "hover:border-[var(--border-default)] hover:shadow-low"
              )}
              title={att.name}
            >
              {/* File type icon */}
              <span className="shrink-0 text-[var(--accent-primary)]">
                {getFileIcon(att.mimeType)}
              </span>

              {/* File name */}
              <span className="max-w-[10rem] truncate text-[var(--text-primary)]">
                {att.name}
              </span>

              {/* Size */}
              <span className="shrink-0 text-[var(--text-tertiary)]">
                {formatSize(att.sizeBytes)}
              </span>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                className={cn(
                  "ml-0.5 inline-flex rounded p-0.5 text-[var(--text-tertiary)] opacity-0 transition-all duration-fast ease-out",
                  "group-hover:opacity-100",
                  "hover:bg-[var(--bg-surface-3)] hover:text-[var(--text-primary)]",
                  "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]"
                )}
                aria-label={`Remove ${att.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
