/**
 * GET /api/team/invites/validate — Validate an invitation token
 */

import { NextRequest } from "next/server";
import {
  withErrorHandler,
  jsonResponse,
  errorResponse,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return errorResponse("Token is required", 400, undefined, req);
  }

  const invite = db.findInviteByToken(token);

  if (!invite) {
    return errorResponse("Invalid invitation token", 404, undefined, req);
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

  return jsonResponse({
    orgName: invite.orgName,
    role: invite.role,
    email: invite.email,
    expiresAt: invite.expiresAt,
  });
});
