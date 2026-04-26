/**
 * DELETE /api/team/invites/:id — Revoke an invitation
 */

import { NextRequest } from "next/server";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
  errorResponse,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const DELETE = withErrorHandler(
  withAuth(async (req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const { id } = params;
    const invite = db.getInvite(id);

    if (!invite) {
      return errorResponse("Invitation not found", 404, undefined, req);
    }

    if (invite.orgId !== ctx.orgId) {
      return errorResponse("Forbidden", 403, undefined, req);
    }

    db.revokeInvite(id);
    return jsonResponse({ success: true });
  })
);
