"use client";

import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Bug,
  ChevronRight,
  Home,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    // In production, send to error tracking service
    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private getIssueUrl(): string {
    const title = encodeURIComponent(`Bug Report: ${this.state.error?.message ?? "Unknown error"}`);
    const body = encodeURIComponent(
      `## Error\n\n\`\`\`\n${this.state.error?.stack ?? "No stack trace"}\n\`\`\`\n\n## Info\n${this.state.errorInfo?.componentStack ?? "No component stack"}`
    );
    return `https://github.com/your-org/multi-model-agent-platform/issues/new?title=${title}&body=${body}`;
  }

  override render() {
    const { hasError, error } = this.state;
    const { children, fallback, className } = this.props;

    if (!hasError) {
      return <>{children}</>;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        className={cn(
          "flex min-h-[60vh] flex-col items-center justify-center px-4 text-center",
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
          <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
          Something went wrong
        </h2>
        <p className="mb-6 max-w-md text-sm text-[var(--text-secondary)]">
          We encountered an unexpected error. Our team has been notified.
          Please try refreshing the page or go back home.
        </p>

        {error && (
          <div className="mb-6 w-full max-w-lg overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-left">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <Bug className="h-3.5 w-3.5" />
              Error Details
            </div>
            <div className="max-h-40 overflow-auto p-4">
              <p className="font-mono text-xs text-[var(--danger)]">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 overflow-auto rounded bg-[var(--bg-surface-3)] p-3 text-[10px] text-[var(--text-secondary)]">
                  {error.stack.split("\n").slice(1, 8).join("\n")}
                </pre>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-inverse)] transition-colors hover:bg-[var(--accent-primary-hover)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </button>

          <button
            onClick={this.handleGoHome}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-2)]"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>

          <a
            href={this.getIssueUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] transition-colors hover:underline"
          >
            Report Issue
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }
}
