/**
 * POST /api/team/invites/accept — Accept an invitation
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withErrorHandler,
  jsonResponse,
  errorResponse,
  validateRequest,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

const acceptSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const validated = await validateRequest(req, acceptSchema);
  if (!validated.success) return validated.response;

  const { token } = validated.data;
  const invite = db.findInviteByToken(token);

  if (!invite) {
    return errorResponse("Invalid or expired invitation token", 404, undefined, req);
  }

  if (invite.accepted) {
    return errorResponse("Invitation has already been accepted", 409, undefined, req);
  }

  if (invite.revoked) {
    return errorResponse("Invitation has been revoked", 410, undefined, req);
  }

  const now = new Date().toISOString();
  if (invite.expiresAt < now) {
    return errorResponse("Invitation has expired", 410, undefined, req);
  }

  db.acceptInvite(token);

  return jsonResponse({ success: true, invite: { orgName: invite.orgName, role: invite.role } });
});
