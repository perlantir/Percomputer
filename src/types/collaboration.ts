/**
 * Shared types for real-time collaboration features.
 */

/** User presence status variants */
export type UserStatus = "online" | "away" | "offline" | "typing";

/** A user in the collaboration room */
export interface PresenceUser {
  /** Unique user ID */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** Avatar image URL */
  avatar?: string;
  /** Assigned color for UI indicators */
  color: string;
  /** Current presence status */
  status: UserStatus;
  /** ISO timestamp of last activity */
  lastSeen: string;
  /** Cursor position relative to container (null if not visible) */
  cursor?: { x: number; y: number } | null;
  /** Document or section the user is currently viewing */
  currentDocument?: string | null;
  /** Document/field ID the user is typing in */
  typingIn?: string | null;
}

/** Types of activity events tracked in the feed */
export type ActivityType =
  | "joined"
  | "left"
  | "typing"
  | "edited"
  | "commented"
  | "viewed"
  | "cursor_move";

/** A single activity event in the timeline */
export interface ActivityEvent {
  /** Unique event ID */
  id: string;
  /** ID of the user who performed the action */
  userId: string;
  /** Display name of the user */
  userName: string;
  /** Avatar URL of the user */
  userAvatar?: string;
  /** Color assigned to the user */
  userColor: string;
  /** Type of activity */
  type: ActivityType;
  /** ID of the affected document */
  documentId?: string;
  /** Human-readable document name */
  documentName?: string;
  /** Optional message or description */
  message?: string;
  /** ISO timestamp */
  timestamp: string;
  /** Additional structured metadata */
  metadata?: Record<string, unknown>;
}

/** Presence state for a room */
export interface RoomPresence {
  roomId: string;
  users: PresenceUser[];
  count: number;
  maxConcurrent: number;
}

/** Cursor position update payload */
export interface CursorUpdate {
  userId: string;
  x: number;
  y: number;
  timestamp: string;
}

/** Heartbeat payload sent to keep presence alive */
export interface HeartbeatPayload {
  roomId: string;
  status: UserStatus;
  cursor?: { x: number; y: number } | null;
  documentId?: string | null;
}

/** WebSocket message types for collaboration */
export type CollaborationMessage =
  | { type: "presence"; users: PresenceUser[] }
  | { type: "user_joined"; user: PresenceUser }
  | { type: "user_left"; userId: string }
  | { type: "cursor_update"; update: CursorUpdate }
  | { type: "typing"; userId: string; documentId: string }
  | { type: "activity"; event: ActivityEvent }
  | { type: "heartbeat_ack"; timestamp: string };
