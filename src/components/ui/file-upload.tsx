"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileCheck,
  AlertCircle,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "./button";

/* ──────────────────────────────────────────────
   File Upload Types
   ────────────────────────────────────────────── */

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export interface FileTypeConfig {
  mimeTypes: string[];
  extensions: string[];
  label: string;
  icon: React.ElementType;
  color: string;
}

export interface FileUploadProps {
  /** Accepted file types (e.g. [".jpg", ".png"]) or MIME types (e.g. ["image/*"]) */
  accept?: string[];
  /** Max file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Max number of files (default: unlimited) */
  maxFiles?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Existing files to display */
  files?: UploadFile[];
  /** Callback when files are added */
  onFilesAdd?: (files: UploadFile[]) => void;
  /** Callback when a file is removed */
  onFileRemove?: (id: string) => void;
  /** Callback when upload is triggered for a file */
  onUpload?: (file: UploadFile) => void;
  /** Callback when retry is requested */
  onRetry?: (id: string) => void;
  /** Whether to auto-start upload on drop */
  autoUpload?: boolean;
  /** Additional className for the dropzone */
  className?: string;
  /** Compact mode (smaller, for inline use) */
  compact?: boolean;
  /** Custom dropzone text */
  dropzoneText?: string;
  /** Show file type icons */
  showIcons?: boolean;
  /** Allow file reordering via drag */
  allowReorder?: boolean;
  /** Callback when file order changes */
  onReorder?: (files: UploadFile[]) => void;
}

/* ──────────────────────────────────────────────
   File Type Registry
   ────────────────────────────────────────────── */

const FILE_TYPE_REGISTRY: FileTypeConfig[] = [
  {
    mimeTypes: ["image/"],
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"],
    label: "Image",
    icon: FileImage,
    color: "var(--semantic-info, #3b82f6)",
  },
  {
    mimeTypes: ["video/"],
    extensions: [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"],
    label: "Video",
    icon: FileVideo,
    color: "var(--semantic-warning, #f59e0b)",
  },
  {
    mimeTypes: ["audio/"],
    extensions: [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".wma"],
    label: "Audio",
    icon: FileAudio,
    color: "var(--semantic-warning, #f59e0b)",
  },
  {
    mimeTypes: [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: [".txt", ".pdf", ".doc", ".docx"],
    label: "Document",
    icon: FileText,
    color: "var(--semantic-info, #3b82f6)",
  },
  {
    mimeTypes: [
      "text/html",
      "text/css",
      "text/javascript",
      "application/javascript",
      "application/json",
      "application/xml",
      "text/x-python",
      "text/x-java",
    ],
    extensions: [".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".json", ".xml", ".py", ".java", ".cpp", ".c", ".go", ".rs", ".php"],
    label: "Code",
    icon: FileCode,
    color: "var(--semantic-success, #10b981)",
  },
  {
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ],
    extensions: [".xls", ".xlsx", ".csv"],
    label: "Spreadsheet",
    icon: FileSpreadsheet,
    color: "var(--semantic-success, #10b981)",
  },
  {
    mimeTypes: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-tar",
      "application/x-7z-compressed",
      "application/gzip",
    ],
    extensions: [".zip", ".rar", ".tar", ".gz", ".7z"],
    label: "Archive",
    icon: FileArchive,
    color: "var(--text-muted, #6b7280)",
  },
];

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function getFileTypeConfig(file: File): FileTypeConfig {
  for (const config of FILE_TYPE_REGISTRY) {
    if (config.mimeTypes.some((mt) => file.type.startsWith(mt))) return config;
    if (
      config.extensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    )
      return config;
  }
  return {
    mimeTypes: [],
    extensions: [],
    label: "File",
    icon: FileText,
    color: "var(--text-muted, #6b7280)",
  };
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function matchesAccept(file: File, accept?: string[]): boolean {
  if (!accept || accept.length === 0) return true;
  return accept.some((pattern) => {
    const trimmed = pattern.trim().toLowerCase();
    if (trimmed.startsWith(".")) {
      return file.name.toLowerCase().endsWith(trimmed);
    }
    if (trimmed.endsWith("/*")) {
      return file.type.startsWith(trimmed.replace("/*", "/"));
    }
    return file.type === trimmed;
  });
}

/* ──────────────────────────────────────────────
   FileIcon Component
   ────────────────────────────────────────────── */

function FileIcon({ file, className }: { file: File; className?: string }) {
  const config = getFileTypeConfig(file);
  const Icon = config.icon;
  return (
    <Icon
      className={cn("shrink-0", className)}
      style={{ color: config.color }}
    />
  );
}

/* ──────────────────────────────────────────────
   ProgressBar Component
   ────────────────────────────────────────────── */

function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: UploadFile["status"];
}) {
  const barColor =
    status === "error"
      ? "bg-[var(--semantic-danger)]"
      : status === "success"
      ? "bg-[var(--semantic-success)]"
      : "bg-[var(--accent-primary)]";

  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface-2)] overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", barColor)}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   FileItem Component
   ────────────────────────────────────────────── */

const fileItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -60, scale: 0.95, transition: { duration: 0.2 } },
};

interface FileItemProps {
  uploadFile: UploadFile;
  showIcon?: boolean;
  allowReorder?: boolean;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  compact?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function FileItem({
  uploadFile,
  showIcon = true,
  allowReorder = false,
  onRemove,
  onRetry,
  compact = false,
  dragHandleProps,
}: FileItemProps) {
  const { id, file, name, size, progress, status, error } = uploadFile;
  const isUploading = status === "uploading";
  const isError = status === "error";
  const isSuccess = status === "success";

  if (compact) {
    return (
      <motion.div
        layout
        variants={fileItemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors duration-fast",
          isError
            ? "border-[var(--semantic-danger)]/30 bg-[var(--semantic-danger)]/5"
            : "border-[var(--border-default)] bg-[var(--bg-surface-1)] hover:border-[var(--border-hover)]"
        )}
      >
        {allowReorder && (
          <div
            {...dragHandleProps}
            className="cursor-grab text-[var(--text-muted)] hover:text-[var(--text-secondary)] active:cursor-grabbing"
          >
            <GripVertical className="size-3" />
          </div>
        )}
        {showIcon && <FileIcon file={file} className="size-4" />}
        <span className="flex-1 truncate text-xs text-[var(--text-primary)]">
          {name}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
          {formatBytes(size)}
        </span>
        {isSuccess && (
          <FileCheck className="size-3.5 text-[var(--semantic-success)]" />
        )}
        {isError && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 min-w-5"
            onClick={() => onRetry?.(id)}
            title="Retry upload"
          >
            <AlertCircle className="size-3 text-[var(--semantic-danger)]" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 min-w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(id)}
          title="Remove file"
        >
          <X className="size-3 text-[var(--text-muted)] hover:text-[var(--semantic-danger)]" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={fileItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-fast",
        isError
          ? "border-[var(--semantic-danger)]/30 bg-[var(--semantic-danger)]/5"
          : isSuccess
          ? "border-[var(--semantic-success)]/20 bg-[var(--semantic-success)]/5"
          : "border-[var(--border-default)] bg-[var(--bg-surface-1)] hover:border-[var(--border-hover)] hover:shadow-sm"
      )}
    >
      {/* Reorder handle */}
      {allowReorder && (
        <div
          {...dragHandleProps}
          className="mt-0.5 cursor-grab text-[var(--text-muted)] hover:text-[var(--text-secondary)] active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </div>
      )}

      {/* File icon */}
      {showIcon && (
        <div className="relative mt-0.5">
          <FileIcon file={file} className="size-8" />
          {isSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[var(--bg-canvas)] p-0.5"
            >
              <FileCheck className="size-3 text-[var(--semantic-success)]" />
            </motion.div>
          )}
        </div>
      )}

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {name}
          </p>
          <span className="shrink-0 text-xs text-[var(--text-muted)] tabular-nums">
            {formatBytes(size)}
          </span>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="mt-2 space-y-1">
            <ProgressBar progress={progress} status={status} />
            <p className="text-[10px] text-[var(--text-muted)] tabular-nums">
              {progress}%
            </p>
          </div>
        )}

        {/* Error message */}
        {isError && error && (
          <div className="mt-1 flex items-center gap-1 text-xs text-[var(--semantic-danger)]">
            <AlertCircle className="size-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {isError && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-[var(--semantic-danger)] hover:bg-[var(--semantic-danger)]/10"
            onClick={() => onRetry?.(id)}
          >
            Retry
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
          onClick={() => onRemove(id)}
        >
          <Trash2 className="size-4 text-[var(--text-muted)] hover:text-[var(--semantic-danger)] transition-colors" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Drag Overlay Component
   ────────────────────────────────────────────── */

function DragOverlay({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 backdrop-blur-[1px]"
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)]/10"
          >
            <Upload className="size-7 text-[var(--accent-primary)]" />
          </motion.div>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-medium text-[var(--accent-primary)]"
          >
            Drop files here to upload
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────
   Validation Error Toast
   ────────────────────────────────────────────── */

function ValidationToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -10, x: "-50%" }}
      className="pointer-events-auto absolute left-1/2 top-3 z-20 flex items-center gap-2 rounded-lg border border-[var(--semantic-danger)]/20 bg-[var(--bg-surface-1)] px-4 py-2.5 shadow-lg"
    >
      <AlertCircle className="size-4 shrink-0 text-[var(--semantic-danger)]" />
      <span className="text-xs font-medium text-[var(--text-primary)]">
        {message}
      </span>
      <button
        onClick={onDismiss}
        className="ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Main FileUpload Component
   ────────────────────────────────────────────── */

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles,
  multiple = true,
  disabled = false,
  files: controlledFiles,
  onFilesAdd,
  onFileRemove,
  onUpload,
  onRetry,
  autoUpload = false,
  className,
  compact = false,
  dropzoneText,
  showIcons = true,
  allowReorder = false,
  onReorder,
}: FileUploadProps) {
  const [internalFiles, setInternalFiles] = React.useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragCounterRef = React.useRef(0);

  // Use controlled or uncontrolled state
  const files = controlledFiles ?? internalFiles;

  const clearError = React.useCallback(() => setValidationError(null), []);

  const validateFiles = React.useCallback(
    (newFiles: File[]): { valid: UploadFile[]; errors: string[] } => {
      const valid: UploadFile[] = [];
      const errors: string[] = [];

      for (const file of newFiles) {
        // Check file type
        if (accept && !matchesAccept(file, accept)) {
          const allowed = accept
            .map((a) => a.trim())
            .join(", ");
          errors.push(
            `"${file.name}" is not an accepted file type. Allowed: ${allowed}`
          );
          continue;
        }

        // Check file size
        if (file.size > maxSize) {
          errors.push(
            `"${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}`
          );
          continue;
        }

        // Check max files
        if (maxFiles && files.length + valid.length >= maxFiles) {
          errors.push(
            `Maximum of ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`
          );
          break;
        }

        valid.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "pending",
        });
      }

      return { valid, errors };
    },
    [accept, maxSize, maxFiles, files.length]
  );

  const addFiles = React.useCallback(
    (newFiles: File[]) => {
      if (disabled) return;
      clearError();

      const { valid, errors } = validateFiles(newFiles);

      if (errors.length > 0) {
        setValidationError(errors[0]);
      }

      if (valid.length > 0) {
        if (controlledFiles === undefined) {
          setInternalFiles((prev) => {
            const updated = multiple ? [...prev, ...valid] : valid;
            return updated;
          });
        }
        onFilesAdd?.(valid);

        if (autoUpload) {
          valid.forEach((f) => onUpload?.(f));
        }
      }
    },
    [
      disabled,
      clearError,
      validateFiles,
      controlledFiles,
      multiple,
      onFilesAdd,
      autoUpload,
      onUpload,
    ]
  );

  const removeFile = React.useCallback(
    (id: string) => {
      if (disabled) return;
      if (controlledFiles === undefined) {
        setInternalFiles((prev) => prev.filter((f) => f.id !== id));
      }
      onFileRemove?.(id);
    },
    [disabled, controlledFiles, onFileRemove]
  );

  // ── Drag & Drop Handlers ─────────────────────

  const handleDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) setIsDragOver(false);
    },
    []
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    },
    []
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      addFiles(droppedFiles);
    },
    [disabled, addFiles]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) addFiles(selected);
      e.target.value = ""; // reset so same file can be selected again
    },
    [addFiles]
  );

  const handleClick = React.useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  // ── Reorder Handlers ─────────────────────────

  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const handleDragStart = React.useCallback(
    (index: number) => (e: React.DragEvent) => {
      if (!allowReorder) return;
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Required for Firefox
      e.dataTransfer.setData("text/plain", String(index));
    },
    [allowReorder]
  );

  const handleDragOverItem = React.useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;

      const newFiles = [...files];
      const [moved] = newFiles.splice(dragIndex, 1);
      newFiles.splice(index, 0, moved);

      if (controlledFiles === undefined) {
        setInternalFiles(newFiles);
      }
      onReorder?.(newFiles);
      setDragIndex(index);
    },
    [dragIndex, files, controlledFiles, onReorder]
  );

  const handleDragEnd = React.useCallback(() => {
    setDragIndex(null);
  }, []);

  // ── Render ──────────────────────────────────

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Compact Dropzone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "group relative flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-all duration-fast",
            isDragOver
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
              : "border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-2)]",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <DragOverlay isActive={isDragOver} />
          {validationError && (
            <ValidationToast message={validationError} onDismiss={clearError} />
          )}

          <Upload
            className={cn(
              "size-4 shrink-0 transition-colors duration-fast",
              isDragOver
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
            )}
          />
          <span className="text-xs text-[var(--text-secondary)]">
            {dropzoneText ||
              (multiple ? "Drop files or click to upload" : "Drop a file or click to upload")}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={accept?.join(",")}
            multiple={multiple}
            disabled={disabled}
            onChange={handleInputChange}
            className="sr-only"
          />
        </div>

        {/* Compact File List */}
        <AnimatePresence mode="popLayout">
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5"
            >
              {files.map((f, i) => (
                <FileItem
                  key={f.id}
                  uploadFile={f}
                  showIcon={showIcons}
                  allowReorder={allowReorder}
                  onRemove={removeFile}
                  onRetry={onRetry}
                  compact
                  dragHandleProps={{
                    draggable: allowReorder,
                    onDragStart: handleDragStart(i),
                    onDragOver: handleDragOverItem(i),
                    onDragEnd: handleDragEnd,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-fast ease-out",
          isDragOver
            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 scale-[1.01]"
            : "border-[var(--border-default)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-surface-2)]",
          disabled && "pointer-events-none opacity-50",
          files.length > 0 && "p-6"
        )}
      >
        <DragOverlay isActive={isDragOver} />
        {validationError && (
          <ValidationToast message={validationError} onDismiss={clearError} />
        )}

        <motion.div
          animate={{
            scale: isDragOver ? 1.1 : 1,
            y: isDragOver ? -2 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-fast",
            isDragOver
              ? "bg-[var(--accent-primary)]/15"
              : "bg-[var(--bg-surface-2)] group-hover:bg-[var(--accent-primary)]/10"
          )}
        >
          <Upload
            className={cn(
              "size-7 transition-colors duration-fast",
              isDragOver
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
            )}
          />
        </motion.div>

        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {dropzoneText ||
              (multiple ? "Drag & drop files here" : "Drag & drop a file here")}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            or{" "}
            <span className="text-[var(--accent-primary)] underline underline-offset-2">
              click to browse
            </span>
          </p>
        </div>

        {/* File constraints hint */}
        {(accept || maxSize) && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {accept && accept.length > 0 && (
              <span className="text-[10px] text-[var(--text-muted)]">
                Accepted: {accept.map((a) => a.trim()).join(", ")}
              </span>
            )}
            {maxSize && (
              <span className="text-[10px] text-[var(--text-muted)]">
                Max: {formatBytes(maxSize)}
              </span>
            )}
            {maxFiles && (
              <span className="text-[10px] text-[var(--text-muted)]">
                Limit: {maxFiles} file{maxFiles > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept?.join(",")}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
        />
      </div>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-2"
          >
            {files.length > 1 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {files.length} file{files.length > 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--semantic-danger)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    files.forEach((f) => removeFile(f.id));
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {files.map((f, i) => (
                  <div
                    key={f.id}
                    draggable={allowReorder}
                    onDragStart={handleDragStart(i)}
                    onDragOver={handleDragOverItem(i)}
                    onDragEnd={handleDragEnd}
                  >
                    <FileItem
                      uploadFile={f}
                      showIcon={showIcons}
                      allowReorder={allowReorder}
                      onRemove={removeFile}
                      onRetry={onRetry}
                      dragHandleProps={{
                        draggable: allowReorder,
                        onDragStart: handleDragStart(i),
                        onDragOver: handleDragOverItem(i),
                        onDragEnd: handleDragEnd,
                      }}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Hook: useFileUpload
   ────────────────────────────────────────────── */

export interface UseFileUploadOptions {
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  autoUpload?: boolean;
  onUpload?: (file: UploadFile) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { onUpload } = options;
  const [files, setFiles] = React.useState<UploadFile[]>([]);

  const addFiles = React.useCallback(
    (newFiles: UploadFile[]) => {
      setFiles((prev) =>
        options.multiple !== false ? [...prev, ...newFiles] : newFiles
      );
      if (options.autoUpload) {
        newFiles.forEach((f) => onUpload?.(f));
      }
    },
    [options.multiple, options.autoUpload, onUpload]
  );

  const removeFile = React.useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = React.useCallback(() => {
    setFiles([]);
  }, []);

  const updateFileProgress = React.useCallback(
    (id: string, progress: number) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress } : f))
      );
    },
    []
  );

  const updateFileStatus = React.useCallback(
    (
      id: string,
      status: UploadFile["status"],
      error?: string
    ) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status, error } : f))
      );
    },
    []
  );

  const retryFile = React.useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "uploading" as const, progress: 0, error: undefined }
          : f
        )
      );
      onUpload?.({ ...file, status: "uploading", progress: 0, error: undefined });
    },
    [files, onUpload]
  );

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    updateFileProgress,
    updateFileStatus,
    retryFile,
    setFiles,
  };
}

/* ──────────────────────────────────────────────
   FileUpload with integrated hook (convenience)
   ────────────────────────────────────────────── */

export function FileUploadWithHook(
  props: Omit<FileUploadProps, "files" | "onFilesAdd" | "onFileRemove"> &
    UseFileUploadOptions & {
      onUpload?: (file: UploadFile) => void;
    }
) {
  const { accept, maxSize, maxFiles, multiple, autoUpload, onUpload, ...rest } =
    props;
  const upload = useFileUpload({
    accept,
    maxSize,
    maxFiles,
    multiple,
    autoUpload,
    onUpload,
  });

  return (
    <FileUpload
      accept={accept}
      maxSize={maxSize}
      maxFiles={maxFiles}
      multiple={multiple}
      autoUpload={autoUpload}
      files={upload.files}
      onFilesAdd={upload.addFiles}
      onFileRemove={upload.removeFile}
      onRetry={upload.retryFile}
      onUpload={onUpload}
      {...rest}
    />
  );
}

export default FileUpload;
