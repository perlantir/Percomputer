"use client";

import * as React from "react";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
  Unlink,
  Check,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Toolbar action types                                               */
/* ------------------------------------------------------------------ */

type FormatCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "insertHTML"
  | "removeFormat";

interface ToolbarAction {
  command: FormatCommand;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  arg?: string;
  divider?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const toolbarBtnVariants = {
  idle: { scale: 1, backgroundColor: "rgba(0,0,0,0)" },
  hover: { scale: 1.05, backgroundColor: "var(--bg-surface-2)" },
  tap: { scale: 0.93 },
  active: {
    scale: 1,
    backgroundColor: "var(--accent-primary)",
    color: "var(--text-inverse)",
  },
};

const tooltipVariants = {
  hidden: { opacity: 0, y: 4, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Markdown shortcut patterns                                         */
/* ------------------------------------------------------------------ */

interface MarkdownPattern {
  regex: RegExp;
  command: FormatCommand;
  arg?: string;
}

const MARKDOWN_PATTERNS: MarkdownPattern[] = [
  { regex: /\*\*(.+?)\*\*/g, command: "bold" },
  { regex: /__(.+?)__/g, command: "bold" },
  { regex: /\*(.+?)\*/g, command: "italic" },
  { regex: /_(.+?)_/g, command: "italic" },
  { regex: /~~(.+?)~~/g, command: "strikeThrough" },
  { regex: /`(.+?)`/g, command: "insertHTML", arg: "<code>$1</code>" },
];

/* ------------------------------------------------------------------ */
/*  Helper: wrap selection with HTML                                   */
/* ------------------------------------------------------------------ */

function insertHtmlAtSelection(html: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const fragment = range.createContextualFragment(html);
  range.insertNode(fragment);

  /* Move cursor after inserted content */
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/* ------------------------------------------------------------------ */
/*  Helper: check if command is active                                 */
/* ------------------------------------------------------------------ */

function isCommandActive(command: FormatCommand): boolean {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Toolbar Button Component                                           */
/* ------------------------------------------------------------------ */

function ToolbarButton({
  action,
  isActive,
  onClick,
}: {
  action: ToolbarAction;
  isActive: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <motion.button
      type="button"
      variants={toolbarBtnVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      animate={isActive ? "active" : "idle"}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={cn(
        "relative flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors duration-fast ease-out",
        isActive
          ? "text-[var(--text-inverse)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      )}
      aria-label={action.label}
    >
      {action.icon}

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && action.shortcut && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="pointer-events-none absolute -top-9 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md bg-[var(--bg-surface-3)] px-2 py-1 text-2xs text-[var(--text-secondary)] shadow-md ring-1 ring-[var(--border-subtle)]"
          >
            <span>{action.label}</span>
            <kbd className="rounded bg-[var(--bg-surface-2)] px-1 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
              {action.shortcut}
            </kbd>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Link Dialog                                                        */
/* ------------------------------------------------------------------ */

function LinkDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setUrl("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -top-14 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[var(--bg-surface-3)] p-2 shadow-lg ring-1 ring-[var(--border-subtle)]"
    >
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onConfirm(url);
          }
          if (e.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="https://example.com"
        className="h-7 w-52 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => onConfirm(url)}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-primary)] text-[var(--text-inverse)]"
      >
        <Check className="h-3.5 w-3.5" />
      </motion.button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Rich Text Editor                                              */
/* ------------------------------------------------------------------ */

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "Type something...",
      className,
      minHeight = 120,
      maxHeight = 400,
      disabled = false,
      onFocus,
      onBlur,
      onSubmit,
    },
    ref
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRefs(ref, editorRef);
    const [activeFormats, setActiveFormats] = React.useState<Set<FormatCommand>>(
      new Set()
    );
    const [showLinkDialog, setShowLinkDialog] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isEmpty, setIsEmpty] = React.useState(!value || value === "<br>");

    /* Toolbar action definitions */
    const toolbarActions: ToolbarAction[] = React.useMemo(
      () => [
        {
          command: "bold",
          icon: <Bold className="h-3.5 w-3.5" />,
          label: "Bold",
          shortcut: "Ctrl+B",
        },
        {
          command: "italic",
          icon: <Italic className="h-3.5 w-3.5" />,
          label: "Italic",
          shortcut: "Ctrl+I",
        },
        {
          command: "strikeThrough",
          icon: <Strikethrough className="h-3.5 w-3.5" />,
          label: "Strikethrough",
          shortcut: "Ctrl+Shift+X",
        },
        {
          command: "underline",
          icon: <Underline className="h-3.5 w-3.5" />,
          label: "Underline",
          shortcut: "Ctrl+U",
        },
        {
          command: "insertHTML",
          icon: <Code className="h-3.5 w-3.5" />,
          label: "Inline Code",
          shortcut: "Ctrl+E",
          arg: "<code>",
        },
        {
          command: "insertUnorderedList",
          icon: <List className="h-3.5 w-3.5" />,
          label: "Bullet List",
          shortcut: "Ctrl+Shift+8",
          divider: true,
        },
        {
          command: "insertOrderedList",
          icon: <ListOrdered className="h-3.5 w-3.5" />,
          label: "Numbered List",
          shortcut: "Ctrl+Shift+7",
        },
      ],
      []
    );

    /* Sync value from parent */
    React.useEffect(() => {
      const el = editorRef.current;
      if (!el || el.innerHTML === value) return;
      if (value) {
        el.innerHTML = value;
        setIsEmpty(false);
      } else {
        el.innerHTML = "";
        setIsEmpty(true);
      }
    }, [value]);

    /* Update active format states */
    const refreshActiveFormats = React.useCallback(() => {
      const next = new Set<FormatCommand>();
      toolbarActions.forEach((a) => {
        if (a.command === "insertHTML") return;
        if (isCommandActive(a.command)) {
          next.add(a.command);
        }
      });
      /* Detect if inside <code> */
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.getRangeAt(0).commonAncestorContainer;
        const parentCode =
          node instanceof Element
            ? node.closest("code")
            : node.parentElement?.closest("code");
        if (parentCode) {
          next.add("insertHTML");
        }
      }
      setActiveFormats(next);
    }, [toolbarActions]);

    /* Execute formatting command */
    const execCommand = React.useCallback(
      (command: FormatCommand, arg?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, arg);
        refreshActiveFormats();
        /* Emit change */
        const html = editorRef.current?.innerHTML || "";
        onChange?.(html);
      },
      [onChange, refreshActiveFormats]
    );

    /* Handle toolbar action click */
    const handleAction = React.useCallback(
      (action: ToolbarAction) => {
        if (action.command === "insertHTML" && action.arg === "<code>") {
          /* Inline code: wrap selection in <code> */
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;
          const text = selection.toString();
          if (!text) return;
          insertHtmlAtSelection(
            `<code style="background:var(--bg-surface-2);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:0.9em;color:var(--syntax-string);">${text}</code>`
          );
          onChange?.(editorRef.current?.innerHTML || "");
          refreshActiveFormats();
          return;
        }
        execCommand(action.command, action.arg);
      },
      [execCommand, onChange, refreshActiveFormats]
    );

    /* Insert link */
    const insertLink = React.useCallback(
      (url: string) => {
        if (!url) return;
        const finalUrl =
          url.startsWith("http://") || url.startsWith("https://")
            ? url
            : `https://${url}`;
        editorRef.current?.focus();
        document.execCommand(
          "insertHTML",
          false,
          `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-primary);text-decoration:underline;cursor:pointer;">${url}</a>`
        );
        setShowLinkDialog(false);
        onChange?.(editorRef.current?.innerHTML || "");
      },
      [onChange]
    );

    /* Remove link */
    const removeLink = React.useCallback(() => {
      editorRef.current?.focus();
      document.execCommand("unlink", false);
      onChange?.(editorRef.current?.innerHTML || "");
      refreshActiveFormats();
    }, [onChange, refreshActiveFormats]);

    /* Check if selection is inside a link */
    const isInsideLink = React.useCallback((): boolean => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      const node = selection.getRangeAt(0).commonAncestorContainer;
      const el = node instanceof Element ? node : node.parentElement;
      return !!el?.closest("a");
    }, []);

    /* Parse markdown shortcuts on space/enter */
    const parseMarkdownShortcuts = React.useCallback((): boolean => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      if (textNode.nodeType !== Node.TEXT_NODE) return false;

      const text = textNode.textContent || "";
      const cursorPos = range.startOffset;
      const beforeCursor = text.slice(0, cursorPos);

      for (const pattern of MARKDOWN_PATTERNS) {
        const matches = [...beforeCursor.matchAll(pattern.regex)];
        if (matches.length === 0) continue;

        const lastMatch = matches[matches.length - 1];
        if (!lastMatch.index) continue;

        /* Only auto-convert if followed by space or at end */
        const matchEnd = lastMatch.index + lastMatch[0].length;
        if (matchEnd !== cursorPos - 1 && matchEnd !== cursorPos) continue;

        const matchedText = lastMatch[1];
        const preText = text.slice(0, lastMatch.index);
        const postText = text.slice(cursorPos);

        /* Build replacement */
        let replacementHtml = "";
        if (pattern.command === "insertHTML" && pattern.arg) {
          replacementHtml = pattern.arg.replace("$1", matchedText);
        } else {
          const tagMap: Record<string, string> = {
            bold: "strong",
            italic: "em",
            strikeThrough: "s",
          };
          const tag = tagMap[pattern.command] || "span";
          replacementHtml = `<${tag}>${matchedText}</${tag}>`;
        }

        const finalHtml = `${preText}${replacementHtml}${postText}`;

        /* Replace the text node */
        const span = document.createElement("span");
        span.innerHTML = finalHtml;

        const parent = textNode.parentNode;
        if (!parent) return false;

        /* Replace text node with parsed content */
        const fragment = document.createDocumentFragment();
        while (span.firstChild) {
          fragment.appendChild(span.firstChild);
        }
        parent.replaceChild(fragment, textNode);

        /* Place cursor after the formatted text */
        const allText = parent.textContent || "";
        const walker = document.createTreeWalker(
          parent,
          NodeFilter.SHOW_TEXT,
          null
        );
        let targetNode: Text | null = null;
        let accumulatedLength = 0;
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          const nodeLen = node.textContent?.length || 0;
          if (accumulatedLength + nodeLen >= preText.length + matchedText.length) {
            targetNode = node;
            break;
          }
          accumulatedLength += nodeLen;
        }

        if (targetNode) {
          const newRange = document.createRange();
          newRange.setStart(
            targetNode,
            preText.length + matchedText.length - accumulatedLength
          );
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }

        return true;
      }

      return false;
    }, []);

    /* Handle input */
    const handleInput = React.useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const empty = el.innerText.trim().length === 0 && el.innerHTML === "";
      setIsEmpty(empty);
      onChange?.(el.innerHTML);
    }, [onChange]);

    /* Handle keydown */
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        /* Keyboard shortcuts */
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case "b":
              e.preventDefault();
              execCommand("bold");
              return;
            case "i":
              e.preventDefault();
              execCommand("italic");
              return;
            case "u":
              e.preventDefault();
              execCommand("underline");
              return;
            case "e":
              e.preventDefault();
              handleAction(
                toolbarActions.find((a) => a.arg === "<code>")!
              );
              return;
            case "k":
              e.preventDefault();
              setShowLinkDialog(true);
              return;
          }
          if (e.shiftKey) {
            switch (e.key) {
              case "8":
                e.preventDefault();
                execCommand("insertUnorderedList");
                return;
              case "7":
                e.preventDefault();
                execCommand("insertOrderedList");
                return;
              case "x":
                e.preventDefault();
                execCommand("strikeThrough");
                return;
            }
          }
        }

        /* Markdown shortcuts on space/enter */
        if (e.key === " " || e.key === "Enter") {
          parseMarkdownShortcuts();
        }

        /* Submit on Ctrl+Enter / Cmd+Enter */
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          onSubmit?.();
          return;
        }
      },
      [execCommand, handleAction, toolbarActions, parseMarkdownShortcuts, onSubmit]
    );

    /* Handle selection change to refresh toolbar */
    React.useEffect(() => {
      const handler = () => refreshActiveFormats();
      document.addEventListener("selectionchange", handler);
      return () => document.removeEventListener("selectionchange", handler);
    }, [refreshActiveFormats]);

    /* Handle paste - strip formatting, keep plain text */
    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
        onChange?.(editorRef.current?.innerHTML || "");
      },
      [onChange]
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group relative flex flex-col rounded-lg border bg-[var(--bg-surface)] shadow-low transition-all duration-fast ease-out",
          isFocused
            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-canvas)]"
            : "border-[var(--border-default)] hover:border-[var(--border-subtle)]",
          disabled && "pointer-events-none opacity-50",
          className
        )}
      >
        {/* ── Toolbar ── */}
        <div className="relative flex items-center gap-0.5 border-b border-[var(--border-subtle)] px-2 py-1.5">
          {toolbarActions.map((action, i) => (
            <React.Fragment key={action.label}>
              {action.divider && i > 0 && (
                <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />
              )}
              <ToolbarButton
                action={action}
                isActive={activeFormats.has(action.command)}
                onClick={() => handleAction(action)}
              />
            </React.Fragment>
          ))}

          {/* Divider */}
          <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />

          {/* Link button */}
          <div className="relative">
            <ToolbarButton
              action={{
                command: "insertHTML",
                icon: isInsideLink() ? (
                  <Unlink className="h-3.5 w-3.5" />
                ) : (
                  <Link className="h-3.5 w-3.5" />
                ),
                label: isInsideLink() ? "Remove Link" : "Insert Link",
                shortcut: "Ctrl+K",
              }}
              isActive={false}
              onClick={() => {
                if (isInsideLink()) {
                  removeLink();
                } else {
                  setShowLinkDialog(true);
                }
              }}
            />
            <AnimatePresence>
              {showLinkDialog && (
                <LinkDialog
                  open={showLinkDialog}
                  onConfirm={insertLink}
                  onCancel={() => setShowLinkDialog(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Spacer + hint */}
          <div className="ml-auto flex items-center gap-1">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: isFocused ? 0.6 : 0 }}
              className="text-2xs text-[var(--text-tertiary)] transition-opacity"
            >
              Ctrl+Enter to submit
            </motion.span>
          </div>
        </div>

        {/* ── Editor Area ── */}
        <div className="relative">
          <div
            ref={combinedRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            className={cn(
              "w-full resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] outline-none transition-all duration-fast ease-out",
              "prose prose-sm max-w-none dark:prose-invert",
              "[&_strong]:font-bold [&_strong]:text-[var(--text-primary)]",
              "[&_em]:italic [&_em]:text-[var(--text-primary)]",
              "[&_s]:text-[var(--text-secondary)]",
              "[&_code]:rounded [&_code]:bg-[var(--bg-surface-2)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[var(--syntax-string)]",
              "[&_a]:text-[var(--accent-primary)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-[var(--accent-primary-hover)]",
              "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5",
              "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-0.5",
              "[&_li]:text-[var(--text-primary)]",
              "[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--accent-primary)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)]"
            )}
            style={{
              minHeight,
              maxHeight,
            }}
            role="textbox"
            aria-multiline="true"
            aria-placeholder={placeholder}
          />

          {/* Placeholder */}
          <AnimatePresence>
            {isEmpty && !isFocused && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute left-3 top-2.5 text-sm text-[var(--text-tertiary)]"
              >
                {placeholder}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

/* ------------------------------------------------------------------ */
/*  Combined refs helper                                               */
/* ------------------------------------------------------------------ */

function useCombinedRefs<T>(...refs: React.Ref<T>[]) {
  return React.useCallback(
    (value: T) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(value);
        } else if (ref && "current" in ref) {
          (ref as React.MutableRefObject<T>).current = value;
        }
      });
    },
    [refs]
  );
}

/* ------------------------------------------------------------------ */
/*  Static Renderer: render HTML safely for display                    */
/* ------------------------------------------------------------------ */

function RichTextPreview({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  if (!html || html === "<br>") {
    return (
      <span className="text-sm italic text-[var(--text-tertiary)]">
        No content
      </span>
    );
  }

  const sanitizedHtml = React.useMemo(
    () => DOMPurify.sanitize(html),
    [html]
  );

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "text-sm leading-relaxed text-[var(--text-primary)]",
        "[&_a]:text-[var(--accent-primary)] [&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded [&_code]:bg-[var(--bg-surface-2)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[var(--syntax-string)]",
        "[&_strong]:font-bold [&_em]:italic [&_s]:text-[var(--text-secondary)]",
        "[&_ul]:list-disc [&_ul]:pl-5] [&_ol]:list-decimal [&_ol]:pl-5",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export { RichTextEditor, RichTextPreview };
