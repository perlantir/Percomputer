"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Activity,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  Pencil,
  Share2,
} from "lucide-react";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { Skeleton, SkeletonText } from "@/src/components/ui/skeleton";
import { WorkflowDetailSkeleton } from "@/src/components/ui/page-skeletons";
import { ErrorPage } from "@/src/components/ui/error-state";
import { WorkflowHeader } from "@/src/components/workflow/WorkflowHeader";
import { ShareWorkflowDialog } from "@/src/components/workflow/ShareWorkflowDialog";
import { AmendWorkflowDialog } from "@/src/components/workflow/AmendWorkflowDialog";
import { CancelWorkflowButton } from "@/src/components/workflow/CancelWorkflowButton";
import { getWorkflowById } from "@/src/data/demo-workflows";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";

const AnswerTab = dynamic(
  () => import("@/src/components/workflow/AnswerTab").then((m) => m.AnswerTab),
  { ssr: false }
);
const StepsTab = dynamic(
  () => import("@/src/components/workflow/StepsTab").then((m) => m.StepsTab),
  { ssr: false }
);
const SourcesTab = dynamic(
  () => import("@/src/components/workflow/SourcesTab").then((m) => m.SourcesTab),
  { ssr: false }
);
const ArtifactsTab = dynamic(
  () => import("@/src/components/workflow/ArtifactsTab").then((m) => m.ArtifactsTab),
  { ssr: false }
);

/* ── Types ── */
type TabId = "answer" | "steps" | "sources" | "artifacts";

const TABS: { id: TabId; label: string }[] = [
  { id: "answer", label: "Answer" },
  { id: "steps", label: "Steps" },
  { id: "sources", label: "Sources" },
  { id: "artifacts", label: "Artifacts" },
];

/* ── Live Activity Rail ── */
function LiveActivityRail({
  collapsed,
  onToggle,
  activeWorkflowId,
}: {
  collapsed: boolean;
  onToggle: () => void;
  activeWorkflowId: string;
}) {
  const items = DEMO_WORKFLOWS.slice(0, 6);

  return (
    <aside
      className={`shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-normal ${
        collapsed ? "w-12" : "w-[320px]"
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-[var(--border-subtle)] px-3">
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Activity
          </span>
        )}
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
        >
          {collapsed ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      <ScrollArea className="h-[calc(100vh-3rem)]">
        <div className="py-2">
          {items.map((item) => {
            const isActive = item.workflow.id === activeWorkflowId;
            const isRunning = item.workflow.status === "running";
            return (
              <Link
                key={item.workflow.id}
                href={`/w/${item.workflow.id}`}
                className={`group flex items-start gap-2.5 px-3 py-2.5 transition-colors ${
                  isActive
                    ? "bg-[var(--accent-primary)]/[0.06]"
                    : "hover:bg-[var(--bg-surface-2)]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isRunning ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-[var(--accent-primary)]"
                      aria-label="Workflow running"
                    />
                  ) : (
                    <Activity
                      className={`h-3.5 w-3.5 ${
                        isActive
                          ? "text-[var(--accent-primary)]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    />
                  )}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-medium ${
                        isActive
                          ? "text-[var(--accent-primary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {item.workflow.objective}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                      <span>{item.workflow.status}</span>
                      <span>·</span>
                      <span>
                        {item.workflow.succeededTasks}/{item.workflow.taskCount}{" "}
                        tasks
                      </span>
                    </div>
                  </div>
                )}
                {!collapsed && isActive && (
                  <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" />
                )}
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

/* ── Loading Skeleton ── */
function WorkflowPageSkeleton() {
  return <WorkflowDetailSkeleton />;
}

/* ── Main Page ── */
export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = (params?.id as string) ?? "";

  const demo = getWorkflowById(workflowId);

  const [activeTab, setActiveTab] = useState<TabId>("answer");
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [tabsScrolled, setTabsScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  /* Simulate data fetch for skeleton UX */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, [workflowId]);

  /* Track scroll position for sticky tab shadow */
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const handleScroll = () => {
      setTabsScrolled(main.scrollTop > 4);
    };
    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  // Not found state
  if (!demo) {
    return (
      <ErrorPage
        variant="not-found"
        title="Workflow not found"
        message="The workflow you're looking for doesn't exist or has been removed."
        action={
          <Button variant="primary" asChild>
            <Link href="/library">Back to Library</Link>
          </Button>
        }
      />
    );
  }

  const data = demo;
  const wf = data.workflow;
  const tasks = data.tasks;
  const edges = data.edges;
  const sources = data.sources;
  const artifacts = data.artifacts;

  const isRunning = wf.status === "running";

  // Determine active task (first running/pending, or last succeeded)
  const activeTaskId = tasks.find((t) => t.status === "running")?.id ?? null;

  const handleCitationClick = useCallback(
    (index: number) => {
      const source = sources[index - 1];
      if (source) {
        setHighlightedSourceId(source.id);
      }
      setActiveTab("sources");
    },
    [sources]
  );

  const handleAmend = useCallback(() => {
    setAmendOpen(true);
  }, []);

  const handleShare = useCallback(() => {
    setShareOpen(true);
  }, []);

  /* Tab entrance stagger */
  const tabVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  /* Content fade variants */
  const contentVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      y: -4,
      transition: { duration: 0.15, ease: "easeIn" },
    },
  };

  if (isLoading) {
    return <WorkflowPageSkeleton />;
  }

  return (
    <div className="flex min-h-[100dvh] bg-[var(--bg-canvas)]">
      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <WorkflowHeader
            workflowId={wf.id}
            objective={wf.objective}
            status={wf.status}
            startedAt={wf.startedAt}
            credits={{ spent: wf.spentCredits, total: wf.budgetCredits }}
            taskCount={wf.taskCount}
            succeededTasks={wf.succeededTasks}
          />
        </motion.div>

        {/* Actions bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]"
        >
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-2 flex items-center justify-end gap-2">
            {isRunning && <CancelWorkflowButton workflowId={wf.id} size="sm" />}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAmend}
              className="gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              Amend
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              className="gap-1.5"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </motion.div>

        {/* Content area with sticky tabs */}
        <main ref={mainRef} className="flex-1 overflow-auto">
          {/* Sticky tab navigation */}
          <div
            className={`sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-shadow duration-200 ${
              tabsScrolled ? "shadow-[0_4px_12px_rgba(0,0,0,0.06)]" : "shadow-none"
            }`}
          >
            <div className="mx-auto max-w-[1400px] px-6">
              <nav className="flex items-center gap-1" aria-label="Workflow tabs">
                {TABS.map((tab, i) => {
                  const isActive = activeTab === tab.id;
                  const count =
                    tab.id === "steps"
                      ? wf.taskCount
                      : tab.id === "sources"
                      ? sources.length
                      : tab.id === "artifacts"
                      ? artifacts.length
                      : undefined;
                  return (
                    <motion.button
                      key={tab.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={tabVariants}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id !== "sources") {
                          setHighlightedSourceId(null);
                        }
                      }}
                      className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="flex items-center gap-1.5">
                        {tab.label}
                        {count !== undefined && (
                          <span
                            className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                              isActive
                                ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                                : "bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <motion.span
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-primary)]"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab content */}
          <div className="mx-auto max-w-[1400px] px-6 py-6">
            <AnimatePresence mode="wait">
              {activeTab === "answer" && (
                <motion.div
                  key="answer"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <AnswerTab
                    workflowId={wf.id}
                    objective={wf.objective}
                    sources={sources}
                    isRunning={isRunning}
                    onCitationClick={handleCitationClick}
                  />
                </motion.div>
              )}
              {activeTab === "steps" && (
                <motion.div
                  key="steps"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <StepsTab tasks={tasks} edges={edges} activeTaskId={activeTaskId} />
                </motion.div>
              )}
              {activeTab === "sources" && (
                <motion.div
                  key="sources"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <SourcesTab
                    sources={sources}
                    scrollToSourceId={highlightedSourceId ?? undefined}
                    onSelectSource={(source) => {
                      console.log("Selected source:", source);
                    }}
                  />
                </motion.div>
              )}
              {activeTab === "artifacts" && (
                <motion.div
                  key="artifacts"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <ArtifactsTab artifacts={artifacts} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <ShareWorkflowDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        workflowId={wf.id}
        workflowTitle={wf.objective}
      />
      <AmendWorkflowDialog
        open={amendOpen}
        onOpenChange={setAmendOpen}
        workflowId={wf.id}
      />

      {/* Right rail */}
      <LiveActivityRail
        collapsed={railCollapsed}
        onToggle={() => setRailCollapsed((c) => !c)}
        activeWorkflowId={wf.id}
      />
    </div>
  );
}
