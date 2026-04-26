import { NextResponse } from "next/server";

/* ─────────────────────────── Changelog Data ─────────────────────────── */

interface Change {
  type: "new" | "improved" | "fixed";
  description: string;
  tag: string;
}

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  changes: Change[];
  highlights: string[];
  breaking?: boolean;
}

const CHANGE_LOG: ChangelogEntry[] = [
  {
    id: "v2-3-0",
    version: "2.3.0",
    date: "2025-04-24",
    title: "Parallel Execution Engine & Enterprise SSO",
    description:
      "Major runtime upgrade introducing true parallel task execution, enterprise SSO support, and significant memory improvements.",
    changes: [
      { type: "new", description: "Parallel execution engine for independent tasks — up to 8x faster workflow completion", tag: "workflows" },
      { type: "new", description: "Enterprise SSO via SAML 2.0 and OIDC providers", tag: "security" },
      { type: "new", description: "Workflow snapshots — save and restore execution state at any checkpoint", tag: "workflows" },
      { type: "improved", description: "Memory system now auto-compacts vectors with 40% faster retrieval", tag: "memory" },
      { type: "improved", description: "Reduced cold-start latency for containerized model runtimes by 60%", tag: "performance" },
      { type: "fixed", description: "Fixed race condition in concurrent connector access during high-load scenarios", tag: "connectors" },
      { type: "fixed", description: "Resolved memory leak in long-running episodic memory sweeps", tag: "memory" },
    ],
    highlights: ["parallel-execution", "enterprise-sso", "snapshots"],
    breaking: false,
  },
  {
    id: "v2-2-1",
    version: "2.2.1",
    date: "2025-04-10",
    title: "Hotfix: Connector Stability",
    description: "Critical stability fixes for database and API connectors.",
    changes: [
      { type: "fixed", description: "PostgreSQL connector timeout handling for queries exceeding 30s", tag: "connectors" },
      { type: "fixed", description: "Webhook payload validation failing on nested JSON arrays", tag: "api" },
      { type: "improved", description: "Better error messages for connector authentication failures", tag: "connectors" },
    ],
    highlights: [],
    breaking: false,
  },
  {
    id: "v2-2-0",
    version: "2.2.0",
    date: "2025-04-03",
    title: "Multi-Agent Orchestration & Model Marketplace",
    description:
      "New multi-agent collaboration framework and a curated model marketplace for discovering specialized models.",
    changes: [
      { type: "new", description: "Multi-agent orchestration — coordinate multiple agents with shared context and task delegation", tag: "workflows" },
      { type: "new", description: "Model Marketplace — browse, test, and deploy specialized fine-tuned models", tag: "models" },
      { type: "new", description: "Zero Data Retention mode for OpenAI and Anthropic enterprise tiers", tag: "security" },
      { type: "new", description: "Workflow diff/compare tool — see exactly what changed between versions", tag: "ui" },
      { type: "improved", description: "DAG visualization now supports zoom, pan, and minimap navigation", tag: "ui" },
      { type: "improved", description: "Token usage tracking with per-model cost breakdown in billing dashboard", tag: "billing" },
      { type: "improved", description: "API key scopes now support fine-grained resource-level permissions", tag: "api" },
      { type: "fixed", description: "Fixed UI flickering during theme transitions on Safari", tag: "ui" },
      { type: "fixed", description: "Corrected cost estimation for Claude 3.5 Sonnet streaming responses", tag: "models" },
    ],
    highlights: ["multi-agent", "model-marketplace", "zdr"],
    breaking: false,
  },
  {
    id: "v2-1-0",
    version: "2.1.0",
    date: "2025-03-15",
    title: "Semantic Memory & Custom Connectors",
    description:
      "Long-term memory system for workflows and a framework for building custom data connectors.",
    changes: [
      { type: "new", description: "Semantic Memory — persistent knowledge extraction and retrieval across sessions", tag: "memory" },
      { type: "new", description: "Custom Connector SDK — build and publish your own data connectors", tag: "connectors" },
      { type: "new", description: "Workflow templates gallery with community submissions", tag: "workflows" },
      { type: "improved", description: "Model routing accuracy improved by 15% with new task complexity heuristic", tag: "models" },
      { type: "improved", description: "Export workflows as PNG/SVG diagrams for documentation", tag: "ui" },
      { type: "fixed", description: "OAuth token refresh race condition in Google Drive connector", tag: "connectors" },
      { type: "fixed", description: "Pagination cursor inconsistency in workflow history API", tag: "api" },
    ],
    highlights: ["semantic-memory", "custom-connectors"],
    breaking: false,
  },
  {
    id: "v2-0-0",
    version: "2.0.0",
    date: "2025-02-28",
    title: "Platform 2.0 — New Architecture",
    description:
      "Complete platform rewrite with new execution engine, redesigned UI, and enterprise features.",
    changes: [
      { type: "new", description: "Next-gen execution engine with sub-100ms task scheduling", tag: "performance" },
      { type: "new", description: "Real-time collaboration — multiple users editing same workflow", tag: "workflows" },
      { type: "new", description: "Spaces — isolated project environments with team access controls", tag: "workflows" },
      { type: "new", description: "Audit log with tamper-proof event history", tag: "security" },
      { type: "improved", description: "Complete UI redesign with dark mode support", tag: "ui" },
      { type: "improved", description: "3x throughput improvement with connection pooling overhaul", tag: "performance" },
      { type: "fixed", description: "Resolved all known memory leaks in long-running sessions", tag: "performance" },
    ],
    highlights: ["v2-architecture", "collaboration", "spaces"],
    breaking: true,
  },
  {
    id: "v1-9-0",
    version: "1.9.0",
    date: "2025-02-10",
    title: "Advanced Analytics & Usage Dashboards",
    description:
      "Comprehensive usage analytics, team management, and billing enhancements.",
    changes: [
      { type: "new", description: "Usage analytics dashboard with per-workflow cost breakdown", tag: "billing" },
      { type: "new", description: "Team member roles — Owner, Admin, Member, Viewer", tag: "workflows" },
      { type: "improved", description: "Budget alerts with configurable thresholds per space", tag: "billing" },
      { type: "fixed", description: "Fixed export format for large artifact downloads (>100MB)", tag: "workflows" },
    ],
    highlights: [],
    breaking: false,
  },
  {
    id: "v1-8-0",
    version: "1.8.0",
    date: "2025-01-25",
    title: "Connector Ecosystem v1",
    description:
      "First-class data connector system with pre-built integrations for popular services.",
    changes: [
      { type: "new", description: "Pre-built connectors: PostgreSQL, MySQL, MongoDB, Redis", tag: "connectors" },
      { type: "new", description: "Cloud storage connectors: AWS S3, GCS, Azure Blob", tag: "connectors" },
      { type: "new", description: "REST API connector with automatic schema inference", tag: "connectors" },
      { type: "improved", description: "Workflow input validation with JSON Schema support", tag: "workflows" },
      { type: "fixed", description: "Corrected time zone handling in scheduled workflows", tag: "api" },
    ],
    highlights: ["connectors-v1"],
    breaking: false,
  },
  {
    id: "v1-7-0",
    version: "1.7.0",
    date: "2025-01-08",
    title: "Public API & Webhooks",
    description: "Full REST API and webhook system for external integrations.",
    changes: [
      { type: "new", description: "REST API v1 with OpenAPI 3.0 specification", tag: "api" },
      { type: "new", description: "Webhook system for workflow events and triggers", tag: "api" },
      { type: "new", description: "SDK packages for Python and TypeScript", tag: "api" },
      { type: "improved", description: "Webhook delivery retry with exponential backoff", tag: "api" },
      { type: "fixed", description: "Fixed pagination offset in /workflows/list endpoint", tag: "api" },
    ],
    highlights: ["rest-api", "webhooks"],
    breaking: false,
  },
  {
    id: "v1-6-0",
    version: "1.6.0",
    date: "2024-12-20",
    title: "Model Router & Multi-Model Support",
    description:
      "Intelligent model routing with support for all major LLM providers.",
    changes: [
      { type: "new", description: "Support for GPT-4o, Claude 3.5 Sonnet, Gemini Pro, Mistral Large", tag: "models" },
      { type: "new", description: "Intelligent model routing based on task type and complexity", tag: "models" },
      { type: "new", description: "Model fallback chains for resilience against provider outages", tag: "models" },
      { type: "improved", description: "Streaming response handling with real-time token display", tag: "ui" },
      { type: "fixed", description: "Rate limit handling across all supported providers", tag: "models" },
    ],
    highlights: ["model-router", "multi-model"],
    breaking: false,
  },
  {
    id: "v1-5-0",
    version: "1.5.0",
    date: "2024-12-01",
    title: "Initial Public Release",
    description: "The first public release of the Multi-Model Agent Platform.",
    changes: [
      { type: "new", description: "Natural language to workflow decomposition", tag: "workflows" },
      { type: "new", description: "Visual DAG editor for workflow design", tag: "workflows" },
      { type: "new", description: "Real-time execution monitoring with live progress", tag: "ui" },
      { type: "new", description: "Artifact generation and export (Markdown, JSON, PDF)", tag: "workflows" },
      { type: "new", description: "Command palette with keyboard shortcuts", tag: "ui" },
      { type: "new", description: "Multi-model support with OpenAI and Anthropic", tag: "models" },
    ],
    highlights: ["launch"],
    breaking: false,
  },
];

/* ─────────────────────────── RSS Generation ─────────────────────────── */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRSS(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://computer.local";
  const changelogUrl = `${siteUrl}/changelog`;
  const now = new Date().toUTCString();

  let items = "";
  for (const entry of CHANGE_LOG) {
    const entryDate = new Date(entry.date).toUTCString();
    const entryUrl = `${changelogUrl}#${entry.id}`;

    // Build description HTML
    let description = `<p>${escapeXml(entry.description)}</p>`;
    description += "<ul>";
    for (const change of entry.changes) {
      const emoji = change.type === "new" ? "✨" : change.type === "improved" ? "🔧" : "🐛";
      description += `<li>${emoji} <strong>[${change.type.toUpperCase()}]</strong> ${escapeXml(change.description)}</li>`;
    }
    description += "</ul>";
    if (entry.highlights.length > 0) {
      description += `<p>Highlights: ${entry.highlights.map((h) => escapeXml(h)).join(", ")}</p>`;
    }

    items += `
    <item>
      <title>v${escapeXml(entry.version)} — ${escapeXml(entry.title)}</title>
      <link>${escapeXml(entryUrl)}</link>
      <guid isPermaLink="true">${escapeXml(entryUrl)}</guid>
      <pubDate>${entryDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${entry.breaking ? "breaking" : "release"}</category>
    </item>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Multi-Model Agent Platform — Changelog</title>
    <link>${escapeXml(changelogUrl)}</link>
    <description>Track new features, improvements, and bug fixes across all versions of the Multi-Model Agent Platform.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(changelogUrl)}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(siteUrl)}/icon.png</url>
      <title>Multi-Model Agent Platform</title>
      <link>${escapeXml(changelogUrl)}</link>
    </image>${items}
  </channel>
</rss>`;
}

/* ─────────────────────────── Route Handler ─────────────────────────── */

export async function GET(): Promise<NextResponse> {
  const rss = buildRSS();

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
