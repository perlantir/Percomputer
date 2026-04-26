/**
 * Frontend-specific types for the Multi-Model Agent Orchestration Platform.
 *
 * These types describe UI state, component props, visualisation nodes,
 * and client-side ephemeral data.  They are not persisted directly but
 * derive from API entities.
 */

import type {
  WorkflowStatus,
  TaskStatus,
  ArtifactKind,
  TaskKind,
  ModelTier,
} from './enums';
import type {
  WorkflowId,
  TaskId,
  ArtifactId,
  ClarificationId,
  SpaceId,
  UserId,
} from './entities';

// ─────────────────────────────────────────────────────────────────────────────
// Theme & Appearance
// ─────────────────────────────────────────────────────────────────────────────

/** Available colour schemes in the UI. */
export type ThemeMode = 'light' | 'dark';

// ─────────────────────────────────────────────────────────────────────────────
// Composer (Prompt Input)
// ─────────────────────────────────────────────────────────────────────────────

/** Reactive state of the main prompt composer. */
export interface ComposerState {
  /** Current user input text. */
  readonly text: string;
  /** Whether a workflow is being submitted. */
  readonly isSubmitting: boolean;
  /** Whether the composer is focused. */
  readonly isFocused: boolean;
  /** Attached file metadata (not yet uploaded). */
  readonly attachments: readonly FileAttachment[];
  /** Selected model tier hint (optional override). */
  readonly selectedModelTier: ModelTier | null;
  /** Selected space to run the workflow in. */
  readonly selectedSpaceId: SpaceId | null;
  /** Validation error message, if any. */
  readonly error: string | null;
}

/** Ephemeral file attachment in the composer. */
export interface FileAttachment {
  readonly id: string;
  readonly name: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  /** Data URL or object URL for preview. */
  readonly previewUrl: string | null;
  /** Upload progress (0–100), null when not uploading. */
  readonly uploadProgress: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Activity Rail
// ─────────────────────────────────────────────────────────────────────────────

/** State driving the sidebar / rail showing active workflows. */
export interface LiveActivityRailState {
  /** Currently selected workflow for detail view. */
  readonly selectedWorkflowId: WorkflowId | null;
  /** List of active or recently completed workflows. */
  readonly items: readonly ActivityRailItem[];
  /** Whether the rail is collapsed (icon-only mode). */
  readonly collapsed: boolean;
}

/** Single entry in the live activity rail. */
export interface ActivityRailItem {
  readonly workflowId: WorkflowId;
  readonly promptPreview: string;
  readonly status: WorkflowStatus;
  readonly progressPercent: number;
  readonly activeTaskTitle: string | null;
  readonly updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Timeline
// ─────────────────────────────────────────────────────────────────────────────

/** Visual item in the vertical task timeline view. */
export interface TaskTimelineItem {
  readonly taskId: TaskId;
  readonly title: string;
  readonly kind: TaskKind;
  readonly status: TaskStatus;
  /** 0-based depth level for indentation / branching visuals. */
  readonly depth: number;
  /** Whether this task is currently selected for detail inspection. */
  readonly isSelected: boolean;
  /** Whether the task branch is expanded in the tree view. */
  readonly isExpanded: boolean;
  /** ISO-8601 start time. */
  readonly startedAt: string | null;
  /** ISO-8601 finish time. */
  readonly finishedAt: string | null;
  /** Elapsed duration in milliseconds. */
  readonly durationMs: number | null;
  /** Number of retry attempts displayed. */
  readonly attemptCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Source Cards
// ─────────────────────────────────────────────────────────────────────────────

/** Visual card representing a web source cited by a research task. */
export interface SourceCard {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly domain: string;
  /** Snippet or excerpt shown in the card. */
  readonly excerpt: string;
  /** Favicon or site thumbnail URL. */
  readonly faviconUrl: string | null;
  /** ISO-8601 timestamp of when the page was fetched. */
  readonly fetchedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Preview
// ─────────────────────────────────────────────────────────────────────────────

/** Frontend representation of an artifact ready for preview / rendering. */
export interface ArtifactPreview {
  readonly id: ArtifactId;
  readonly name: string;
  readonly kind: ArtifactKind;
  /** Public or signed URL to fetch the artifact content. */
  readonly contentUrl: string;
  /** Whether the content is already loaded client-side. */
  readonly isLoaded: boolean;
  /** Parsed content for inline rendering (e.g. markdown text, JSON object). */
  readonly content: string | Record<string, unknown> | null;
  /** For images: natural width. */
  readonly width: number | null;
  /** For images: natural height. */
  readonly height: number | null;
  /** File size in bytes. */
  readonly sizeBytes: number;
  readonly createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DAG Visualisation
// ─────────────────────────────────────────────────────────────────────────────

/** Node in the interactive DAG canvas (React Flow / D3 compatible). */
export interface DAGNode {
  readonly id: string;
  readonly type: 'task' | 'artifact' | 'approvalGate';
  readonly position: { readonly x: number; readonly y: number };
  readonly data: DAGNodeData;
  readonly width: number;
  readonly height: number;
  readonly selected: boolean;
  readonly dragging: boolean;
}

/** Payload attached to a DAG node. */
export interface DAGNodeData {
  readonly label: string;
  readonly status: WorkflowStatus | TaskStatus;
  readonly kind: TaskKind | ArtifactKind | 'approval';
  readonly progressPercent: number;
  readonly icon: string | null;
}

/** Edge in the interactive DAG canvas. */
export interface DAGEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: 'default' | 'data' | 'conditional';
  readonly animated: boolean;
  readonly label: string | null;
  readonly selected: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Citations
// ─────────────────────────────────────────────────────────────────────────────

/** Inline citation reference used in rendered markdown / reports. */
export interface Citation {
  readonly id: string;
  readonly index: number;
  /** Source title or description. */
  readonly title: string;
  /** Source URL. */
  readonly url: string;
  /** Highlighted excerpt supporting the claim. */
  readonly evidence: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

/** Primary or secondary navigation item in the app shell. */
export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  /** Icon identifier (Lucide / Phosphor icon name). */
  readonly icon: string;
  /** Route path or href. */
  readonly href: string;
  /** Whether the item is currently active. */
  readonly isActive: boolean;
  /** Child items for nested navigation. */
  readonly children: readonly NavigationItem[];
  /** Badge count (e.g. unread notifications). */
  readonly badgeCount: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

/** Discriminated tab in the settings panel. */
export type SettingsTab =
  | { readonly id: 'profile'; readonly label: 'Profile' }
  | { readonly id: 'org'; readonly label: 'Organisation' }
  | { readonly id: 'spaces'; readonly label: 'Spaces' }
  | { readonly id: 'models'; readonly label: 'Models' }
  | { readonly id: 'connectors'; readonly label: 'Connectors' }
  | { readonly id: 'billing'; readonly label: 'Billing' }
  | { readonly id: 'security'; readonly label: 'Security' }
  | { readonly id: 'api'; readonly label: 'API Keys' }
  | { readonly id: 'appearance'; readonly label: 'Appearance' };

// ─────────────────────────────────────────────────────────────────────────────
// Console Page
// ─────────────────────────────────────────────────────────────────────────────

/** Aggregate state for a single console / workspace page. */
export interface ConsolePage {
  readonly pageId: string;
  readonly spaceId: SpaceId;
  readonly theme: ThemeMode;
  /** Main composer state. */
  readonly composer: ComposerState;
  /** Activity rail state. */
  readonly rail: LiveActivityRailState;
  /** Currently displayed workflow detail (null if none). */
  readonly activeWorkflowId: WorkflowId | null;
  /** Currently selected artifact for full-screen preview. */
  readonly activeArtifactId: ArtifactId | null;
  /** Whether a global loading overlay is visible. */
  readonly globalLoading: boolean;
  /** Toast / notification queue. */
  readonly toasts: readonly ToastMessage[];
}

/** Ephemeral toast notification. */
export interface ToastMessage {
  readonly id: string;
  readonly type: 'info' | 'success' | 'warning' | 'error';
  readonly title: string;
  readonly description: string | null;
  readonly durationMs: number;
  readonly createdAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

/** Notification category driving icon, colour and routing. */
export type NotificationCategory =
  | 'workflow_complete'
  | 'clarification_needed'
  | 'approval_required'
  | 'credit_low'
  | 'system_alert'
  | 'connector_error'
  | 'artifact_ready'
  | 'memory_stored'
  | 'task_failed'
  | 'member_joined';

/** Single notification in the activity feed. */
export interface Notification {
  readonly id: string;
  readonly category: NotificationCategory;
  readonly title: string;
  readonly message: string;
  /** ISO-8601 timestamp of when the notification was created. */
  readonly createdAt: string;
  /** Whether the user has already seen this notification. */
  readonly read: boolean;
  /** Deep-link path to navigate to when the notification is clicked. */
  readonly actionHref: string | null;
  /** Optional entity ID that generated this notification (workflow, task, etc.). */
  readonly entityId: string | null;
  /** Optional entity type for grouping/filtering. */
  readonly entityType: 'workflow' | 'task' | 'clarification' | 'approval' | 'billing' | 'system' | null;
}

/** State slice for the notifications panel. */
export interface NotificationPanelState {
  /** All loaded notifications, newest first. */
  readonly items: readonly Notification[];
  /** Whether the panel/dropdown is currently open. */
  readonly isOpen: boolean;
  /** Whether a fetch is in progress. */
  readonly isLoading: boolean;
  /** Last fetch error, if any. */
  readonly error: string | null;
}

/** Minimal payload returned by the polling endpoint. */
export interface NotificationSummary {
  readonly unreadCount: number;
  readonly hasMore: boolean;
  readonly items: Notification[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

/** Single external search result returned by web search tools. */
export interface SearchResultItem {
  /** Result title. */
  readonly title: string;
  /** Canonical URL. */
  readonly url: string;
  /** Short excerpt. */
  readonly snippet: string;
  /** Source domain or publication. */
  readonly source: string;
  /** ISO-8601 publish timestamp. */
  readonly publishedAt: string;
  /** Semantic relevance score (0–1). */
  readonly relevanceScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

/** Supported artifact / workflow export formats. */
export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'csv';

// ─────────────────────────────────────────────────────────────────────────────
// Compare
// ─────────────────────────────────────────────────────────────────────────────

/** Comparison mode selector on the compare page. */
export type CompareMode = 'workflow' | 'artifact' | 'text';

// ─────────────────────────────────────────────────────────────────────────────
// Voice Input
// ─────────────────────────────────────────────────────────────────────────────

/** Microphone state for the composer voice-input feature. */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

/** Broad category used for filtering and colour-coding workflow templates. */
export type TemplateCategory =
  | 'Research'
  | 'Build'
  | 'Analyze'
  | 'Automate'
  | 'Security'
  | 'Finance'
  | 'Data';
