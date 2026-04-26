/**
 * GET /api/audit — Audit events (admin/auditor only)
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse, parseQueryParams, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(
    async (req: NextRequest, ctx) => {
      const params = parseQueryParams(req);
      const { data, total } = db.listAudit({
        orgId: ctx.orgId,
        workflowId: params.workflow_id,
        actorId: params.actor_id,
        type: params.type,
        from: params.from,
        to: params.to,
        limit: params.limit ? parseInt(params.limit, 10) : 50,
        offset: params.offset ? parseInt(params.offset, 10) : 0,
      });

      return jsonResponse({
        data,
        total,
        limit: params.limit ? parseInt(params.limit, 10) : 50,
        offset: params.offset ? parseInt(params.offset, 10) : 0,
      });
    },
    "auditor"
  ) as any
);

export function OPTIONS() {
  return corsPreflight();
}
