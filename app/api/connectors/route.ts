/**
 * GET /api/connectors — List installed/available connectors
 * POST /api/connectors — Install connector (starts OAuth flow simulation)
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

const installConnectorSchema = z.object({
  name: z.enum([
    "slack",
    "github",
    "linear",
    "notion",
    "jira",
    "gmail",
    "google_drive",
    "confluence",
    "asana",
    "trello",
  ]),
});

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const connectors = db.listConnectors({ orgId: ctx.orgId });
    return jsonResponse({ data: connectors, total: connectors.length }, 200, undefined, req);
  })
);

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, ctx) => {
    const validated = await validateRequest(req, installConnectorSchema);
    if (!validated.success) return validated.response;

    const { name } = validated.data;
    const connector = db.getConnector(name);
    if (!connector) {
      return errorResponse("Connector not found", 404, undefined, req);
    }

    // Org isolation check
    if (connector.orgId !== ctx.orgId) {
      return errorResponse("Forbidden — insufficient permissions", 403, undefined, req);
    }

    if (connector.status === "installed") {
      return errorResponse("Connector already installed", 409, undefined, req);
    }

    // Simulate OAuth flow
    const installed = db.installConnector(name);
    if (!installed) {
      return errorResponse("Failed to install connector", 500, undefined, req);
    }

    db.createAuditEvent({
      type: "connector.installed",
      actor_id: ctx.user.id,
      org_id: ctx.orgId,
      details: { connector_name: name, scopes: installed.scopes },
    });

    return jsonResponse(
      {
        ...installed,
        oauth_redirect_url: `https://mock-oauth.example.com/auth/${name}?client_id=demo&redirect_uri=https://app.example.com/callback`,
        message: "OAuth flow initiated. In production, user would be redirected to authorize.",
      },
      201,
      undefined,
      req
    );
  })
);

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}