/**
 * Custom React hooks for the Multi-Model Agent Platform.
 */

export { useCitations } from "./useCitations";
export { useComposer } from "./useComposer";
export { useDebounce, useDebounceValue, useInterval } from "./useInterval";
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";
export { useTheme } from "./useTheme";
export { useVoiceInput } from "./useVoiceInput";
export type { UseVoiceInputReturn, VoiceInputState } from "./useVoiceInput";
export { useWorkflowRun } from "./useWorkflowRun";
export type { UseWorkflowRunReturn, RunStatus } from "./useWorkflowRun";

/* ── Search ── */
export { useGlobalSearch } from "./useGlobalSearch";
export type { UseGlobalSearchOptions, UseGlobalSearchReturn } from "./useGlobalSearch";

/* ── Command Palette state ── */
export { useCommandPalette } from "./CommandPaletteStore";
export { useConsoleRole } from "./useConsoleRole";
export { useLockBodyScroll } from "./useLockBodyScroll";
export { useNotifications } from "./useNotifications";
export { useOnboarding, TOUR_STEP_COUNT } from "./useOnboarding";
export { useRailStore } from "./useRailStore";
export { useWebSocketControl } from "./useWebSocketControl";
export { useWorkflowEvents } from "./useWorkflowEvents";
export { useWorkflowSimulation } from "./useWorkflowSimulation";
export { useWorkflowStream } from "./useWorkflowStream";

/* ── Service Worker / PWA ── */
export { useServiceWorker, useServiceWorkerMessages } from "./useServiceWorker";
export type { SyncPayload } from "./useServiceWorker";

/* ── Tutorial / walkthrough system ── */
export { useTutorial } from "./useTutorial";
export type { UseTutorialReturn } from "./useTutorial";

/* ── Team management ── */
export {
  useTeamInvites,
  useTeamMembers,
  useSendInvite,
  useRevokeInvite,
  useRemoveMember,
  useAcceptInvite,
} from "./useTeam";

/* ── CommandPaletteProvider is a compat shim re-exporting useCommandPalette
   from CommandPaletteStore (already exported above). Included in barrel
   coverage for directory completeness. ── */
