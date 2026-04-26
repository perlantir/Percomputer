/**
 * GET /api/artifacts/[id] — Artifact detail with presigned URL
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse,
  errorResponse, corsPreflight } from "@/src/lib/api-utils";
import { db } from "@/src/lib/mock-db";

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx, { params }: { params: { id: string } }) => {
    const artifact = db.getArtifact(params.id);
    if (!artifact) {
      return errorResponse("Artifact not found", 404);
    }

    // Verify workflow ownership
    const workflow = db.getWorkflow(artifact.workflow_id);
    if (!workflow || workflow.org_id !== ctx.orgId) {
      return errorResponse("Forbidden", 403);
    }

    // Refresh presigned URL
    const presignedUrl = `https://mock-cdn.example.com/${artifact.id}/${encodeURIComponent(artifact.name)}?token=${Date.now().toString(36)}&expires=${Date.now() + 3600 * 1000}`;

    return jsonResponse({
      ...artifact,
      presigned_url: presignedUrl,
      presigned_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      download_url: presignedUrl + "&download=1",
    });
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
