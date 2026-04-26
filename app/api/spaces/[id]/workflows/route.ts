/**
 * GET /api/spaces/[id]/workflows — List workflows in a space
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, parseQueryParams, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const space = db.getSpace(params.id);
    if (!space) {
      return errorResponse("Space not found", 404);
    }
    if (space.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const query = parseQueryParams(req);
    const { data, total } = db.listWorkflows({
      space: params.id,
      status: query.status,
      kind: query.kind,
      from: query.from,
      to: query.to,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
      orgId: ctx.orgId,
    });

    return jsonResponse({
      data,
      total,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
