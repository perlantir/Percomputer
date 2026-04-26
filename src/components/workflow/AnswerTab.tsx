"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ExternalLink,
  Globe,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "@/src/components/layout/Toaster";
import { cn } from "@/src/lib/utils";
import { mockSynthesisResponse } from "@/src/mock/llm-responses";
import type { SourceCard } from "@/src/mock/generators";

/** Helper to type react-markdown custom component props */
type MarkdownProps<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T] & ExtraProps;

export interface AnswerTabProps {
  workflowId: string;
  objective: string;
  sources: SourceCard[];
  isRunning?: boolean;
  onCitationClick?: (index: number) => void;
}

/* Thin reading progress bar — tracks scroll position within the answer */
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const pct = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
        setProgress(pct);
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 -mx-4 mb-6 px-4">
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-[var(--border-subtle)]/50">
        <motion.div
          className="h-full origin-left rounded-full bg-[var(--accent-primary)]"
          style={{
            scaleX: progress,
            boxShadow: progress > 0
              ? "0 0 8px var(--accent-primary), 0 0 16px var(--accent-primary)"
              : "none",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}

/* Inline citation chip */
function CitationChip({
  index,
  title,
  domain,
  excerpt,
  onClick,
}: {
  index: number;
  title: string;
  domain: string;
  excerpt: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const visible = hovered || focused;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <sup>
        <button
          onClick={onClick}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label={`Citation ${index}: ${title}`}
          className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--accent-primary)]/10 px-1 text-[10px] font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]"
        >
          {index}
        </button>
      </sup>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]">
                <Globe className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-[var(--text-primary)]">
                  {title}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  {domain}
                </div>
              </div>
            </div>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              {excerpt}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--accent-primary)]">
              <ExternalLink className="h-3 w-3" />
              Click to view in Sources
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

/* Streaming animation for running workflows */
function StreamingIndicator() {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="mb-4 flex items-center gap-2">
      <Sparkles
        className={cn(
          "h-4 w-4 text-[var(--accent-primary)]",
          !prefersReducedMotion && "animate-pulse"
        )}
      />
      <span className="text-sm text-[var(--accent-primary)]">
        Synthesizing answer...
      </span>
      {!prefersReducedMotion && (
        <span className="inline-flex gap-0.5">
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      )}
    </div>
  );
}

/* Code block with copy-to-clipboard */
function CodeBlock({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match?.[1] || "text";
  const codeText = typeof children === "string" ? children : "";

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard", `${lang} code copied.`);
    } catch {
      toast.error("Copy failed", "Could not copy to clipboard.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-[var(--border-subtle)] group">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)] px-3 py-1.5">
        <span className="text-xs font-mono text-[var(--text-tertiary)]">
          {lang}
        </span>
        <button
          onClick={handleCopy}
          disabled={isCopying || !codeText}
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] disabled:opacity-50"
          aria-label="Copy code to clipboard"
        >
          {isCopying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : copied ? (
            <Check className="h-3 w-3 text-[var(--success)]" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {isCopying ? "Copying..." : copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[var(--bg-canvas)] p-4">
        <code className={`text-sm font-mono ${className || ""}`} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

/* Custom markdown components — defined once, stable reference */
const markdownComponents = {
  code({ className, children, ...props }: MarkdownProps<"code">) {
    const isInline = !className;
    return isInline ? (
      <code
        className="rounded bg-[var(--bg-surface-2)] px-1 py-0.5 text-sm font-mono text-[var(--accent-primary)]"
        {...props}
      >
        {children}
      </code>
    ) : (
      <CodeBlock className={className} {...props}>
        {children}
      </CodeBlock>
    );
  },
  a({ children, ...props }: MarkdownProps<"a">) {
    return (
      <a
        className="text-[var(--accent-primary)] underline underline-offset-2 transition-colors hover:text-[var(--accent-primary-hover)]"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  h2({ children, ...props }: MarkdownProps<"h2">) {
    return (
      <h2
        className="mt-6 mb-3 text-lg font-semibold text-[var(--text-primary)]"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3({ children, ...props }: MarkdownProps<"h3">) {
    return (
      <h3
        className="mt-4 mb-2 text-base font-semibold text-[var(--text-primary)]"
        {...props}
      >
        {children}
      </h3>
    );
  },
  p({ children, ...props }: MarkdownProps<"p">) {
    return (
      <p
        className="mb-3 leading-7 text-[var(--text-primary)]"
        {...props}
      >
        {children}
      </p>
    );
  },
  ul({ children, ...props }: MarkdownProps<"ul">) {
    return (
      <ul className="mb-3 ml-5 list-disc space-y-1 text-[var(--text-primary)]" {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, ...props }: MarkdownProps<"ol">) {
    return (
      <ol className="mb-3 ml-5 list-decimal space-y-1 text-[var(--text-primary)]" {...props}>
        {children}
      </ol>
    );
  },
  li({ children, ...props }: MarkdownProps<"li">) {
    return (
      <li className="leading-7" {...props}>
        {children}
      </li>
    );
  },
  strong({ children, ...props }: MarkdownProps<"strong">) {
    return (
      <strong className="font-semibold text-[var(--text-primary)]" {...props}>
        {children}
      </strong>
    );
  },
  blockquote({ children, ...props }: MarkdownProps<"blockquote">) {
    return (
      <blockquote
        className="my-4 border-l-2 border-[var(--accent-primary)] bg-[var(--bg-surface-2)]/50 pl-4 py-1 text-[var(--text-secondary)]"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  hr(props: MarkdownProps<"hr">) {
    return (
      <hr className="my-6 border-[var(--border-subtle)]" {...props} />
    );
  },
  table({ children, ...props }: MarkdownProps<"table">) {
    return (
      <div className="my-4 overflow-auto rounded-lg border border-[var(--border-subtle)]">
        <table className="w-full text-sm" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }: MarkdownProps<"thead">) {
    return (
      <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]" {...props}>
        {children}
      </thead>
    );
  },
  th({ children, ...props }: MarkdownProps<"th">) {
    return (
      <th className="px-3 py-2 text-left font-medium text-[var(--text-secondary)]" {...props}>
        {children}
      </th>
    );
  },
  td({ children, ...props }: MarkdownProps<"td">) {
    return (
      <td className="px-3 py-2 border-b border-[var(--border-subtle)] text-[var(--text-primary)]" {...props}>
        {children}
      </td>
    );
  },
};

/* Process markdown to replace [^N] citations with interactive chips */
function renderMarkdownWithCitations(
  markdown: string,
  sources: SourceCard[],
  onCitationClick?: (index: number) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[\^(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = regex.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index);
    if (before) {
      parts.push(
        <ReactMarkdown
          key={`md-${keyIndex++}`}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {before}
        </ReactMarkdown>
      );
    }

    const citationIndex = parseInt(match[1], 10);
    const source = sources[citationIndex - 1];
    if (source) {
      parts.push(
        <CitationChip
          key={`cite-${citationIndex}`}
          index={citationIndex}
          title={source.title}
          domain={source.domain}
          excerpt={source.excerpt}
          onClick={() => onCitationClick?.(citationIndex)}
        />
      );
    } else {
      parts.push(
        <sup key={`cite-${citationIndex}`}>
          <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--bg-surface-2)] px-1 text-[10px] text-[var(--text-tertiary)]">
            {citationIndex}
          </span>
        </sup>
      );
    }

    lastIndex = regex.lastIndex;
  }

  const remaining = markdown.slice(lastIndex);
  if (remaining) {
    parts.push(
      <ReactMarkdown
        key={`md-${keyIndex++}`}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {remaining}
      </ReactMarkdown>
    );
  }

  return parts;
}

export function AnswerTab({
  workflowId,
  objective,
  sources,
  isRunning,
  onCitationClick,
}: AnswerTabProps) {
  const response = useMemo(() => mockSynthesisResponse(objective), [objective]);
  const answerContent = response.markdown;

  const renderedContent = useMemo(
    () => renderMarkdownWithCitations(answerContent, sources, onCitationClick),
    [answerContent, sources, onCitationClick]
  );

  return (
    <div className="mx-auto max-w-[72ch]">
      <ReadingProgressBar />
      {isRunning && <StreamingIndicator />}

      <div className="text-[var(--text-primary)]">
        {renderedContent}
      </div>

      {/* Summary footer */}
      {response.summary && !isRunning && (
        <div className="mt-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/30 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            <Sparkles className="h-3.5 w-3.5" />
            Summary
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {response.summary}
          </p>
        </div>
      )}

      {/* Citation list */}
      {sources.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Sources
          </h3>
          <ol className="space-y-2">
            {sources.map((source, i) => (
              <li
                key={source.id}
                className="flex items-start gap-2 text-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[10px] font-semibold text-[var(--accent-primary)]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium text-[var(--text-primary)]">
                    {source.title}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {source.domain} · Cited {source.cited} time
                    {source.cited !== 1 ? "s" : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </d</d</d