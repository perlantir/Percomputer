/**
 * POST /api/search — Web search simulation
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, withErrorHandler, jsonResponse, validateRequest, corsPreflight } from "@/src/lib/api-utils";

const mockSearchResults = [
  {
    id: "sr-1",
    title: "2024 B2B SaaS Pricing Benchmarks Report",
    url: "https://example.com/saas-pricing-2024",
    snippet: "Comprehensive analysis of B2B SaaS pricing strategies across 500 companies. Key findings show median pricing of $29/user/month for basic tiers.",
    relevance_score: 0.95,
    published_at: "2024-05-15T10:00:00Z",
    source: "Industry Research",
  },
  {
    id: "sr-2",
    title: "AI Safety Frameworks: A Technical Survey",
    url: "https://example.com/ai-safety-survey",
    snippet: "Survey of current AI safety frameworks including RLHF, Constitutional AI, and adversarial testing methodologies.",
    relevance_score: 0.88,
    published_at: "2024-04-20T14:30:00Z",
    source: "AI Research Journal",
  },
  {
    id: "sr-3",
    title: "React Component Library Best Practices 2024",
    url: "https://example.com/react-component-lib",
    snippet: "Guide to building accessible, performant React component libraries with TypeScript and modern tooling.",
    relevance_score: 0.82,
    published_at: "2024-06-01T09:00:00Z",
    source: "Frontend Engineering Blog",
  },
  {
    id: "sr-4",
    title: "Node.js Memory Leak Detection Techniques",
    url: "https://example.com/nodejs-memory-leaks",
    snippet: "Advanced techniques for detecting and resolving memory leaks in Node.js production environments using heap snapshots.",
    relevance_score: 0.78,
    published_at: "2024-03-10T11:00:00Z",
    source: "Backend Engineering Blog",
  },
  {
    id: "sr-5",
    title: "Quarterly Sales Report Templates",
    url: "https://example.com/sales-report-templates",
    snippet: "Collection of quarterly sales report templates with visualization best practices for SaaS companies.",
    relevance_score: 0.72,
    published_at: "2024-05-01T08:00:00Z",
    source: "Business Analytics Hub",
  },
];

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
  recency_days: z.number().int().min(1).max(365).optional(),
});

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest) => {
    const validated = await validateRequest(req, searchSchema);
    if (!validated.success) return validated.response;

    const { query, limit = 5, recency_days } = validated.data;

    // Simulate search with relevance scoring
    const results = mockSearchResults
      .map((r) => ({
        ...r,
        relevance_score: Math.min(1.0, r.relevance_score + (query.length > 20 ? 0.05 : 0)),
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    return jsonResponse({
      query,
      results,
      total: results.length,
      search_id: `search-${Date.now().toString(36)}`,
      credits_used: 0.5,
    });
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
