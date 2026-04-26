/**
 * GET /api/artifacts — List all artifacts accessible to the org
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse, parseQueryParams, safeParseInt, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const params = parseQueryParams(req);
    const workflowId = params.workflow_id;
    const kind = params.kind;

    let artifacts = Array.from(db.artifacts.values());

    // Filter by org ownership via workflow
    artifacts = artifacts.filter((a) => {
      const wf = db.getWorkflow(a.workflow_id);
      return wf && wf.org_id === ctx.orgId;
    });

    if (workflowId) {
      artifacts = artifacts.filter((a) => a.workflow_id === workflowId);
    }
    if (kind) {
      artifacts = artifacts.filter((a) => a.kind === kind);
    }

    artifacts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = artifacts.length;
    const limit = safeParseInt(params.limit, 50);
    const offset = safeParseInt(params.offset, 0);
    artifacts = artifacts.slice(offset, offset + limit);

    return jsonResponse({ data: artifacts, total, limit, offset });
  })
);

export function OPTIONS() {
  return corsPreflight();
}
