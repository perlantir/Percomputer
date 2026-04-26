/**
 * GET /api/spaces/[id] — Space detail
 * PATCH /api/spaces/[id] — Update space
 * DELETE /api/spaces/[id] — Delete space
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
  errorResponse,
  validateRequest,
  corsPreflight,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

const patchSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  memory_enabled: z.boolean().optional(),
  members: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const space = db.getSpace(params.id);
    if (!space) {
      return errorResponse("Space not found", 404);
    }
    if (space.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }
    return jsonResponse(space);
  }) as any
);

export const PATCH = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const space = db.getSpace(params.id);
    if (!space) {
      return errorResponse("Space not found", 404);
    }
    if (space.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const validated = await validateRequest(_req, patchSpaceSchema);
    if (!validated.success) return validated.response;

    const updated = db.updateSpace(params.id, validated.data);
    return jsonResponse(updated);
  }) as any
);

export const DELETE = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const space = db.getSpace(params.id);
    if (!space) {
      return errorResponse("Space not found", 404);
    }
    if (space.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }
    if (space.owner_id !== ctx.user.id) {
      return errorResponse("Only the owner can delete a space", 403);
    }

    // Prevent deleting non-empty spaces
    const workflows = db.listWorkflows({ space: params.id, orgId: ctx.orgId });
    if (workflows.total > 0) {
      return errorResponse("Cannot delete space with existing workflows. Delete workflows first.", 409);
    }

    db.deleteSpace(params.id);
    return jsonResponse({ success: true, id: params.id });
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
