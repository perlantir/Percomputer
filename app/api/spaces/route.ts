/**
 * GET /api/spaces — List spaces
 * POST /api/spaces — Create space
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
  validateRequest,
  corsPreflight,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

const createSpaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memory_enabled: z.boolean().optional(),
  members: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx) => {
    const spaces = db.listSpaces({ orgId: ctx.orgId });
    return jsonResponse({ data: spaces, total: spaces.length });
  })
);

export const POST = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx) => {
    const validated = await validateRequest(_req, createSpaceSchema);
    if (!validated.success) return validated.response;

    const body = validated.data;
    const members = Array.from(new Set([...(body.members ?? []), ctx.user.id]));

    const space = db.createSpace({
      name: body.name,
      description: body.description ?? "",
      owner_id: ctx.user.id,
      org_id: ctx.orgId,
      members,
      memory_enabled: body.memory_enabled ?? true,
    });

    return jsonResponse(space, 201);
  })
);

export function OPTIONS() {
  return corsPreflight();
}
