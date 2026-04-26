/**
 * GET /api/memory — Memory entries (with filter by kind, query)
 * DELETE /api/memory — Revoke a memory entry by ID
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withErrorHandler,
  jsonResponse,
  errorResponse,
  parseQueryParams,
  validateRequest,
  corsPreflight,
} from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

const deleteMemorySchema = z.object({
  id: z.string().min(1),
});

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const params = parseQueryParams(req);
    const { data, total } = db.listMemory({
      kind: params.kind,
      query: params.query,
      spaceId: params.space_id,
      userId: params.user_id,
      workflowId: params.workflow_id,
      orgId: ctx.orgId,
      limit: params.limit ? parseInt(params.limit, 10) : 50,
      offset: params.offset ? parseInt(params.offset, 10) : 0,
    });

    return jsonResponse(
      {
        data,
        total,
        limit: params.limit ? parseInt(params.limit, 10) : 50,
        offset: params.offset ? parseInt(params.offset, 10) : 0,
      },
      200,
      undefined,
      req
    );
  }) as any
);

export const DELETE = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const validated = await validateRequest(req, deleteMemorySchema);
    if (!validated.success) return validated.response;

    const { id } = validated.data;
    const entry = db.getMemory(id);
    if (!entry) {
      return errorResponse("Memory entry not found", 404, undefined, req);
    }

    // Org isolation check
    if ((entry as any).orgId !== ctx.orgId) {
      return errorResponse("Forbidden — insufficient permissions", 403, undefined, req);
    }

    db.deleteMemory(id);

    db.createAuditEvent({
      type: "memory.revoked",
      actor_id: ctx.user.id,
      org_id: ctx.orgId,
      details: { memory_id: id, kind: entry.kind, key: entry.key },
    });

    return jsonResponse({ success: true, id }, 200, undefined, req);
  }) as any
);

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}
