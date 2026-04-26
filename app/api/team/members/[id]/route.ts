/**
 * DELETE /api/team/members/:id — Remove a team member
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
    const member = db.getMember(id);

    if (!member) {
      return errorResponse("Member not found", 404, undefined, req);
    }

    if (member.orgId !== ctx.orgId) {
      return errorResponse("Forbidden", 403, undefined, req);
    }

    if (member.id === ctx.user.id) {
      return errorResponse("Cannot remove yourself", 400, undefined, req);
    }

    db.removeMember(id);
    return jsonResponse({ success: true });
  })
);
