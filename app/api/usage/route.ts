/**
 * GET /api/usage — Token + credit usage for user/org
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse, corsPreflight } from "@/src/lib/api-utils";
const mockUsage = {
  total_tokens: 2_450_000,
  total_input_tokens: 1_800_000,
  total_output_tokens: 650_000,
  total_credits: 847.6,
  workflows_completed: 42,
  workflows_failed: 3,
  models_used: {
    "gpt-4o": { calls: 340, tokens: 980_000, credits: 312.4 },
    "claude-3-5-sonnet": { calls: 156, tokens: 720_000, credits: 218.2 },
    "gpt-4o-mini": { calls: 89, tokens: 210_000, credits: 42.1 },
    "deepseek-v3": { calls: 67, tokens: 380_000, credits: 145.3 },
    "gemini-1-5-pro": { calls: 45, tokens: 160_000, credits: 129.6 },
  },
  daily_breakdown: [
    { date: "2024-06-15", tokens: 125_000, credits: 42.3 },
    { date: "2024-06-14", tokens: 89_000, credits: 31.7 },
    { date: "2024-06-13", tokens: 156_000, credits: 58.2 },
    { date: "2024-06-12", tokens: 203_000, credits: 72.1 },
    { date: "2024-06-11", tokens: 178_000, credits: 61.5 },
    { date: "2024-06-10", tokens: 245_000, credits: 89.4 },
    { date: "2024-06-09", tokens: 134_000, credits: 48.8 },
  ],
  period_start: "2024-06-01",
  period_end: "2024-06-30",
};

export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, ctx) => {
    // In a real system, usage would be queried per user/org
    const usage = {
      ...mockUsage,
      user_id: ctx.user.id,
      org_id: ctx.orgId,
    };
    return jsonResponse(usage);
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
