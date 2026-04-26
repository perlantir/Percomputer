/**
 * GET /api/team/members — List team members
 */

import { NextRequest } from "next/server";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx) => {
    const members = db.listMembers({ orgId: ctx.orgId });
    return jsonResponse({ data: members, total: members.length });
  })
);
