/**
 * GET /api/connectors/[name] — Connector detail
 * DELETE /api/connectors/[name] — Revoke connector
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx, { params }: { params: { name: string } }) => {
    const connector = db.getConnector(params.name);
    if (!connector) {
      return errorResponse("Connector not found", 404, undefined, req);
    }

    // Org isolation check
    if ((connector as any).orgId !== ctx.orgId) {
      return errorResponse("Forbidden — insufficient permissions", 403, undefined, req);
    }

    return jsonResponse(connector, 200, undefined, req);
  }) as any
);

export const DELETE = withErrorHandler(
  withAuth(async (req: NextRequest, ctx, { params }: { params: { name: string } }) => {
    const connector = db.getConnector(params.name);
    if (!connector) {
      return errorResponse("Connector not found", 404, undefined, req);
    }

    // Org isolation check
    if ((connector as any).orgId !== ctx.orgId) {
      return errorResponse("Forbidden — insufficient permissions", 403, undefined, req);
    }

    if (connector.status !== "installed") {
      return errorResponse("Connector is not installed", 400, undefined, req);
    }

    const revoked = db.revokeConnector(params.name);
    if (!revoked) {
      return errorResponse("Failed to revoke connector", 500, undefined, req);
    }

    db.createAuditEvent({
      type: "connector.revoked",
      actor_id: ctx.user.id,
      org_id: ctx.orgId,
      details: { connector_name: params.name },
    });

    return jsonResponse({ success: true, name: params.name, status: "revoked" }, 200, undefined, req);
  }) as any
);

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}
