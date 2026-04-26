/**
 * GET /api/clarifications — List clarifications accessible to the org
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse, parseQueryParams, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const params = parseQueryParams(req);
    const workflowId = params.workflow_id;
    const answered = params.answered;

    let items = Array.from(db.clarifications.values());

    // Filter by org ownership via workflow
    items = items.filter((c) => {
      const wf = db.getWorkflow(c.workflow_id);
      return wf && wf.org_id === ctx.orgId;
    });

    if (workflowId) {
      items = items.filter((c) => c.workflow_id === workflowId);
    }
    if (answered !== undefined) {
      const bool = answered === "true";
      items = items.filter((c) => c.answered === bool);
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = items.length;
    const limit = params.limit ? parseInt(params.limit, 10) : 50;
    const offset = params.offset ? parseInt(params.offset, 10) : 0;
    items = items.slice(offset, offset + limit);

    return jsonResponse({ data: items, total, limit, offset });
  })
);

export function OPTIONS() {
  return corsPreflight();
}
