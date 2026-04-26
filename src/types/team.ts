/**
 * Team invitation types for the Multi-Model Agent Orchestration Platform.
 */

import type { UserRole } from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// Team Invitation
// ─────────────────────────────────────────────────────────────────────────────

/** A pending invitation to join an organisation. */
export interface TeamInvitation {
  readonly id: string;
  /** Email address of the invited user. */
  readonly email: string;
  /** Role assigned to the invited user. */
  readonly role: UserRole;
  /** Organisation the invitation is for. */
  readonly orgId: string;
  readonly orgName: string;
  /** User who sent the invitation. */
  readonly invitedById: string;
  readonly invitedByName: string;
  /** Invitation token for acceptance link. */
  readonly token: string;
  /** Whether the invitation has been accepted. */
  readonly accepted: boolean;
  /** Whether the invitation has been revoked. */
  readonly revoked: boolean;
  /** ISO-8601 timestamp of invitation creation. */
  readonly createdAt: string;
  /** ISO-8601 timestamp of invitation expiry. */
  readonly expiresAt: string;
  /** ISO-8601 timestamp of acceptance, if accepted. */
  readonly acceptedAt: string | null;
}

/** Team member within an organisation. */
export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly avatarUrl: string | null;
  readonly orgId: string;
  /** ISO-8601 timestamp when the user joined the org. */
  readonly joinedAt: string;
  /** ISO-8601 timestamp of last activity. */
  readonly lastActiveAt: string | null;
}

/** Input for sending a new team invitation. */
export interface SendInviteInput {
  email: string;
  role: UserRole;
}

/** Input for accepting a team invitation. */
export interface AcceptInviteInput {
  token: string;
  name: string;
  password: string;
}
