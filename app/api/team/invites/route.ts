/**
 * GET /api/team/invites — List pending invitations
 * POST /api/team/invites — Send a new invitation
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
  validateRequest,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

const sendInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member", "viewer", "auditor"]),
});

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx) => {
    const invites = db.listInvites({ orgId: ctx.orgId });
    return jsonResponse({ data: invites, total: invites.length });
  })
);

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const validated = await validateRequest(req, sendInviteSchema);
    if (!validated.success) return validated.response;

    const body = validated.data;

    const existing = db.findInviteByEmail(body.email, ctx.orgId);
    if (existing && !existing.accepted && !existing.revoked) {
      return jsonResponse(
        {
          error: {
            code: "CONFLICT",
            message: "An active invitation already exists for this email",
            status: 409,
          },
        },
        409,
        undefined,
        req
      );
    }

    const invite = db.createInvite({
      email: body.email,
      role: body.role,
      orgId: ctx.orgId,
      orgName: ctx.user.orgName,
      invitedById: ctx.user.id,
      invitedByName: ctx.user.name,
    });

    return jsonResponse(invite, 201);
  })
);
