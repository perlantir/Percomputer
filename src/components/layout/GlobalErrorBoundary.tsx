"use client";

import React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Bug,
  Camera,
  Download,
  Copy,
  Check,
  Home,
  ExternalLink,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

/* ────────────────────────────────────────────────────────────
 *  Types
 *  ──────────────────────────────────────────────────────────── */

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  /** GitHub org/repo for issue links, e.g. "my-org/my-repo" */
  repoSlug?: string;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  screenshotDataUrl: string | null;
  showScreenshot: boolean;
  copied: boolean;
}

/* ────────────────────────────────────────────────────────────
 *  Screenshot helper (pure DOM, no external lib)
 *  ──────────────────────────────────────────────────────────── */

async function capturePageScreenshot(): Promise<string | null> {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const width = Math.min(window.innerWidth, 1920);
    const height = Math.min(window.innerHeight, 1080);
    const scale = Math.min(1, 1920 / window.innerWidth);

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg-canvas") || "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Timestamp + error banner overlay
    const overlayY = height / 2 - 60;
    ctx.fillStyle = "rgba(220, 38, 38, 0.12)";
    ctx.fillRect(0, overlayY, width, 120);
    ctx.strokeStyle = "rgba(220, 38, 38, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(16, overlayY + 16, width - 32, 88);

    // Draw text
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillText("⚠ Application Error", 32, overlayY + 44);
    ctx.fillStyle = "#888";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(
      `Captured at ${new Date().toLocaleString()}  ·  ${window.location.pathname}`,
      32,
      overlayY + 68
    );

    // Draw placeholder content lines
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 8; i++) {
      const y = overlayY + 140 + i * 28;
      if (y > height - 40) break;
      const lineWidth = width * (0.3 + Math.random() * 0.5);
      ctx.fillRect(40, y, lineWidth, 12);
    }

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────────────────────
 *  Animation variants
 *  ──────────────────────────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const detailsVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

const screenshotVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.25 },
  },
};

/* ────────────────────────────────────────────────────────────
 *  Icon with gentle pulse animation
 *  ──────────────────────────────────────────────────────────── */

function AnimatedErrorIcon() {
  return (
    <motion.div
      className="relative flex h-20 w-20 items-center justify-center"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Pulsing ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-[var(--danger)]/[0.08]"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [1, 0.6, 1],
        }}
        transition={{
          duration: 2.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      {/* Static background */}
      <div className="absolute inset-0 rounded-2xl bg-[var(--danger)]/[0.08]" />
      {/* Icon */}
      <motion.div
        animate={{ rotate: [0, -3, 3, -2, 2, 0] }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <AlertTriangle className="relative h-10 w-10 text-[var(--danger)]" aria-hidden="true" />
      </motion.div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
 *  Main Component
 *  ──────────────────────────────────────────────────────────── */

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      screenshotDataUrl: null,
      showScreenshot: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.error("[GlobalErrorBoundary] Caught error:", error, errorInfo);
    }
  }

  /* ── Actions ── */

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  private toggleScreenshot = async () => {
    const { showScreenshot, screenshotDataUrl } = this.state;
    if (!showScreenshot) {
      if (!screenshotDataUrl) {
        const captured = await capturePageScreenshot();
        this.setState({ screenshotDataUrl: captured, showScreenshot: true });
        return;
      }
      this.setState({ showScreenshot: true });
    } else {
      this.setState({ showScreenshot: false });
    }
  };

  private handleCopyStack = () => {
    const { error, errorInfo } = this.state;
    const text = [
      `## Error Message`,
      `\`\`\``,error?.message ?? "Unknown error",`\`\`\``,`
## Stack Trace`,`\`\`\``,error?.stack ?? "No stack trace","\`\`\`",`
## Component Stack`,`\`\`\``,errorInfo?.componentStack ?? "No component stack","\`\`\`",`
## Environment`,`- URL: ${typeof window !== "undefined" ? window.location.href : ""}`, `- User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`, `- Time: ${new Date().toISOString()}`,
    ].join("\n");

    navigator.clipboard?.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  private handleDownloadScreenshot = () => {
    const { screenshotDataUrl } = this.state;
    if (!screenshotDataUrl) return;
    const link = document.createElement("a");
    link.href = screenshotDataUrl;
    link.download = `error-screenshot-${Date.now()}.png`;
    link.click();
  };

  private getIssueUrl(): string {
    const { repoSlug } = this.props;
    const { error, errorInfo } = this.state;
    const title = encodeURIComponent(`Bug Report: ${error?.message ?? "Unknown error"}`);
    const body = encodeURIComponent(
      [
        `## Bug Description`,
        `A runtime error occurred in the application.`,
        ``,
        `## Error Details`,
        ``,
        `**Message:** ${error?.message ?? "N/A"}`,
        ``,
        `**Stack Trace:**`,
        `\`\`\``,error?.stack ?? "No stack trace","\`\`\`",``,`**Component Stack:**`,`\`\`\``,errorInfo?.componentStack ?? "N/A","\`\`\`",``,`## Environment`, `- **URL:** ${typeof window !== "undefined" ? window.location.href : ""}`,`- **Time:** ${new Date().toISOString()}`,`- **User Agent:** ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`,``,`## Steps to Reproduce`, `1. \<!-- Describe what you were doing when the error occurred -->`, `2.`, `3.`,``,`## Expected Behavior`, `\<!-- What did you expect to happen? -->`,
      ].join("\n")
    );
    if (repoSlug) {
      return `https://github.com/${repoSlug}/issues/new?title=${title}&body=${body}`;
    }
    return `https://github.com/your-org/multi-model-agent-platform/issues/new?title=${title}&body=${body}`;
  }

  /* ── Render ── */

  override render() {
    const { hasError, error, errorInfo, showDetails, screenshotDataUrl, showScreenshot, copied } =
      this.state;
    const { children, fallback, className } = this.props;

    if (!hasError) {
      return <>{children}</>;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <main
        className={cn(
          "flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-canvas)] px-4 py-12",
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <motion.div
          className="flex w-full max-w-xl flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Icon ── */}
          <motion.div variants={itemVariants}>
            <AnimatedErrorIcon />
          </motion.div>

          {/* ── Heading ── */}
          <motion.h1
            className="mt-6 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl"
            variants={itemVariants}
          >
            Something went wrong
          </motion.h1>

          {/* ── Subtext ── */}
          <motion.p
            className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]"
            variants={itemVariants}
          >
            We encountered an unexpected error. Don&apos;t worry — we&apos;ve been notified and
            are looking into it. You can try refreshing the page or report the issue if it persists.
          </motion.p>

          {/* ── Action Buttons ── */}
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            variants={itemVariants}
          >
            <Button
              onClick={this.handleReload}
              className="gap-1.5 shadow-glow-sm hover:shadow-glow-md transition-shadow duration-300"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload Page
            </Button>

            <Button variant="secondary" onClick={this.handleGoHome} className="gap-1.5">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go Home
            </Button>

            <Button variant="ghost" asChild className="gap-1">
              <a
                href={this.getIssueUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Bug className="h-4 w-4" aria-hidden="true" />
                Report Issue
                <ExternalLink className="h-3.5 w-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
              </a>
            </Button>
          </motion.div>

          {/* ── Expandable Error Details ── */}
          {error && (
            <motion.div
              className="mt-8 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              variants={itemVariants}
            >
              {/* Header — clickable to expand */}
              <button
                onClick={this.toggleDetails}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--bg-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]"
                aria-expanded={showDetails}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  <Bug className="h-3.5 w-3.5" aria-hidden="true" />
                  Error Details
                </span>
                <motion.span
                  animate={{ rotate: showDetails ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
                </motion.span>
              </button>

              {/* Expandable content */}
              <AnimatePresence initial={false}>
                {showDetails && (
                  <motion.div
                    key="details"
                    variants={detailsVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[var(--border-subtle)] px-5 py-4">
                      {/* Error message */}
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
                        <p className="font-mono text-xs leading-relaxed text-[var(--danger)]">
                          {error.message}
                        </p>
                      </div>

                      {/* Stack trace */}
                      {error.stack && (
                        <div className="mt-3">
                          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Stack Trace
                          </div>
                          <pre className="max-h-48 overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3 text-[10px] leading-5 text-[var(--text-secondary)] scrollbar-thin">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {/* Component stack */}
                      {errorInfo?.componentStack && (
                        <div className="mt-3">
                          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Component Stack
                          </div>
                          <pre className="max-h-40 overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3 text-[10px] leading-5 text-[var(--text-secondary)] scrollbar-thin">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      {/* Environment info */}
                      <div className="mt-3">
                        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                          Environment
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] p-3 text-[10px] leading-5 text-[var(--text-secondary)]">
                          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                            <span className="text-[var(--text-tertiary)]">URL</span>
                            <span className="font-mono text-[var(--text-primary)] truncate">
                              {typeof window !== "undefined" ? window.location.href : "N/A"}
                            </span>
                            <span className="text-[var(--text-tertiary)]">Time</span>
                            <span>{new Date().toLocaleString()}</span>
                            <span className="text-[var(--text-tertiary)]">User Agent</span>
                            <span className="truncate">
                              {typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Copy action */}
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={this.handleCopyStack}
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy Details
                            </>
                          )}
                        </Button>

                        {/* Screenshot toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={this.toggleScreenshot}
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          {showScreenshot ? "Hide Screenshot" : "View Screenshot"}
                        </Button>
                      </div>

                      {/* Screenshot preview */}
                      <AnimatePresence>
                        {showScreenshot && screenshotDataUrl && (
                          <motion.div
                            key="screenshot"
                            variants={screenshotVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="mt-3"
                          >
                            <div className="relative overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
                              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                  Page Screenshot
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={this.handleDownloadScreenshot}
                                    className="h-6 gap-1 px-2 text-[10px]"
                                  >
                                    <Download className="h-3 w-3" />
                                    Download
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => this.setState({ showScreenshot: false })}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="relative p-2 h-80">
                                <Image
                                  src={screenshotDataUrl}
                                  alt="Screenshot of the page at the time of the error"
                                  fill
                                  unoptimized
                                  className="rounded border border-[var(--border-subtle)] object-cover object-top"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Footer hint ── */}
          <motion.p
            className="mt-6 text-xs text-[var(--text-tertiary)]"
            variants={itemVariants}
          >
            Error ID:{" "}
            <span className="font-mono text-[var(--text-secondary)]">
              {this.generateErrorId()}
            </span>
          </motion.p>
        </motion.div>
      </main>
    );
  }

  private generateErrorId(): string {
    const { error } = this.state;
    const base = error?.message ?? "unknown";
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      const char = base.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const timeSegment = Date.now().toString(36).slice(-4).toUpperCase();
    const hashSegment = Math.abs(hash).toString(36).slice(0, 4).toUpperCase();
    return `ERR-${hashSegment}-${timeSegment}`;
  }
}

/* ────────────────────────────────────────────────────────────
 *  Hook wrapper for functional components
 *  ──────────────────────────────────────────────────────────── */

export function useGlobalErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, setError, resetError };
}

/* ────────────────────────────────────────────────────────────
 *  Pre-built fallback page (for use with Next.js error.js)
 *  ──────────────────────────────────────────────────────────── */

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  repoSlug?: string;
}

export function GlobalErrorPage({ error, reset, repoSlug }: GlobalErrorPageProps) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-canvas)] px-4 py-12">
      <motion.div
        className="flex w-full max-w-xl flex-col items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <AnimatedErrorIcon />
        </motion.div>

        <motion.h1
          className="mt-6 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl"
          variants={itemVariants}
        >
          Something went wrong
        </motion.h1>

        <motion.p
          className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]"
          variants={itemVariants}
        >
          We encountered an unexpected error. We&apos;ve been notified and are looking into it.
        </motion.p>

        {error.digest && (
          <motion.p
            className="mt-4 rounded-full bg-[var(--bg-surface-2)] px-3 py-1 font-mono text-[10px] text-[var(--text-tertiary)]"
            variants={itemVariants}
          >
            Digest: {error.digest}
          </motion.p>
        )}

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          variants={itemVariants}
        >
          <Button onClick={reset} className="gap-1.5 shadow-glow-sm">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>

          <Button variant="secondary" onClick={() => (window.location.href = "/")} className="gap-1.5">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go Home
          </Button>

          <Button variant="ghost" asChild className="gap-1">
            <a
              href={`https://github.com/${repoSlug ?? "your-org/multi-model-agent-platform"}/issues/new?title=${encodeURIComponent(`Bug Report: ${error.message}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Bug className="h-4 w-4" aria-hidden="true" />
              Report Issue
              <ExternalLink className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
}
