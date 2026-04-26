/**
 * Workflow template definitions for the Multi-Model Agent Platform.
 *
 * Each template provides a reusable starting point for common agent-driven
 * workflows. Users can fork a template, fill in the placeholder variables,
 * and launch an orchestrated multi-model run.
 */

export type TemplateCategory =
  | "Research"
  | "Build"
  | "Analyze"
  | "Automate"
  | "Security"
  | "Finance"
  | "Data";

export interface WorkflowTemplate {
  /** Unique identifier. */
  id: string;
  /** Human-readable title. */
  title: string;
  /** One-line description of what the workflow does. */
  description: string;
  /** Objective string with [placeholder] variables for user input. */
  objective: string;
  /** Broad category used for filtering and colour-coding. */
  category: TemplateCategory;
  /** Estimated cost in platform credits / USD. */
  estimatedCost: string;
  /** Estimated wall-clock time to completion. */
  estimatedTime: string;
  /** Lucide icon name (without the "Icon" suffix). */
  icon: string;
  /** Tags for faceted search. */
  tags: string[];
  /** Number of times this template has been forked (social proof). */
  forks: number;
  /** Default model mix recommendation. */
  recommendedModels?: string[];
}

/** ── Category metadata ─────────────────────────────────────────────────────── */

export const CATEGORY_META: Record<
  TemplateCategory,
  { label: string; color: string; bg: string; description: string }
> = {
  Research: {
    label: "Research",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    description: "Gather intelligence, scout markets, and synthesise findings.",
  },
  Build: {
    label: "Build",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    description: "Generate code, scaffolding, and working prototypes.",
  },
  Analyze: {
    label: "Analyze",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    description: "Crunch numbers, detect patterns, and derive insight.",
  },
  Automate: {
    label: "Automate",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    description: "Wire up pipelines, bots, and recurring workflows.",
  },
  Security: {
    label: "Security",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    description: "Audit, harden, and protect code and infrastructure.",
  },
  Finance: {
    label: "Finance",
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.12)",
    description: "Track markets, earnings, and on-chain activity.",
  },
  Data: {
    label: "Data",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.12)",
    description: "Extract, transform, load, and visualise data.",
  },
};

/** ── Workflow templates (20 total) ───────────────────────────────────────── */

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tmpl-research-top-10",
    title: "Research top 10 companies in X industry",
    description:
      "Scout the leading players in any industry, compile structured profiles, and rank them by market share, revenue, and growth trajectory.",
    objective:
      "Research the top 10 companies in the [industry] industry. For each company, extract: name, headquarters, estimated revenue, employee count, key products, and recent news. Return a ranked table with sources.",
    category: "Research",
    estimatedCost: "$0.80",
    estimatedTime: "3 min",
    icon: "Search",
    tags: ["market-research", "companies", "ranking"],
    forks: 1240,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-earnings-analysis",
    title: "Analyze quarterly earnings for [ticker]",
    description:
      "Ingest the latest 10-Q / 10-K filings, extract KPIs, compare against consensus estimates, and surface red or green flags.",
    objective:
      "Analyze the most recent quarterly earnings report for ticker [ticker]. Extract revenue, EPS, guidance, margin trends, and segment performance. Compare to analyst consensus and prior quarter. Flag any material deviations.",
    category: "Finance",
    estimatedCost: "$1.20",
    estimatedTime: "4 min",
    icon: "TrendingUp",
    tags: ["earnings", "SEC", "fundamentals"],
    forks: 892,
    recommendedModels: ["gpt-4o", "claude-3-opus"],
  },
  {
    id: "tmpl-python-scraper",
    title: "Build a Python scraper for [website]",
    description:
      "Generate production-ready Python scraping code with rate-limiting, retry logic, and structured output parsing.",
    objective:
      "Build a Python scraper for [website]. The scraper should: (1) respect robots.txt and implement polite rate-limiting, (2) extract [data fields], (3) handle pagination and dynamic content, (4) output clean JSON/CSV, (5) include error handling and retry logic.",
    category: "Build",
    estimatedCost: "$0.60",
    estimatedTime: "2 min",
    icon: "Code",
    tags: ["python", "scraping", "automation"],
    forks: 2103,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-product-comparison",
    title: "Compare [product A] vs [product B]",
    description:
      "Run a head-to-head comparison across features, pricing, performance, and user sentiment with a weighted scorecard.",
    objective:
      "Compare [product A] vs [product B]. Evaluate across: features, pricing tiers, performance benchmarks, user reviews, support quality, and ecosystem integrations. Return a weighted scorecard and a final recommendation with justification.",
    category: "Analyze",
    estimatedCost: "$0.90",
    estimatedTime: "3 min",
    icon: "GitCompare",
    tags: ["comparison", "products", "scorecard"],
    forks: 756,
    recommendedModels: ["gpt-4o", "gemini-1.5-pro"],
  },
  {
    id: "tmpl-competitive-analysis",
    title: "Generate a competitive analysis",
    description:
      "Map the competitive landscape: SWOT, positioning matrix, pricing tiers, and strategic moats for any market segment.",
    objective:
      "Generate a competitive analysis for the [market segment] market. Include: (1) key competitors with market share, (2) SWOT for each, (3) feature comparison matrix, (4) pricing overview, (5) strategic recommendations for a new entrant.",
    category: "Research",
    estimatedCost: "$1.50",
    estimatedTime: "5 min",
    icon: "Target",
    tags: ["strategy", "swot", "market-map"],
    forks: 645,
    recommendedModels: ["claude-3-opus", "gpt-4o"],
  },
  {
    id: "tmpl-pdf-to-csv",
    title: "Extract data from PDF to CSV",
    description:
      "Parse structured tables and text from PDF documents, clean the extracted data, and export as a tidy CSV.",
    objective:
      "Extract all tabular data from the provided PDF and convert it into a clean CSV. Preserve headers, handle merged cells gracefully, and validate numeric formats. Provide a data-quality report (missing values, anomalies).",
    category: "Data",
    estimatedCost: "$0.50",
    estimatedTime: "2 min",
    icon: "FileText",
    tags: ["pdf", "etl", "csv", "parsing"],
    forks: 1834,
    recommendedModels: ["gpt-4o"],
  },
  {
    id: "tmpl-monitor-filings",
    title: "Monitor regulatory filings for [company]",
    description:
      "Watch SEC EDGAR, UK Companies House, or other registries for new filings and summarise material changes automatically.",
    objective:
      "Set up monitoring for regulatory filings related to [company]. Check EDGAR (8-K, 10-Q, 10-K, 13F, DEF 14A) and summarise any new filings within the last [period]. Highlight material events: executive changes, M&A, restatements, or litigation.",
    category: "Finance",
    estimatedCost: "$1.00",
    estimatedTime: "3 min",
    icon: "ShieldAlert",
    tags: ["sec", "compliance", "monitoring"],
    forks: 412,
    recommendedModels: ["claude-3-sonnet", "gpt-4o"],
  },
  {
    id: "tmpl-unit-tests",
    title: "Write unit tests for [code snippet]",
    description:
      "Generate comprehensive unit tests with edge-case coverage, mocks, and assertions for any code snippet.",
    objective:
      "Write comprehensive unit tests for the following [language] code snippet. Cover: happy path, edge cases (null, empty, overflow), exception handling, and parameter boundary checks. Use [testing framework] and include mocks where appropriate. Output the full test file.",
    category: "Build",
    estimatedCost: "$0.40",
    estimatedTime: "1 min",
    icon: "CheckCircle",
    tags: ["testing", "qa", "coverage"],
    forks: 1567,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-data-viz-dashboard",
    title: "Create a data visualization dashboard",
    description:
      "Spin up an interactive React / D3 dashboard from a dataset, complete with filters, drill-downs, and export.",
    objective:
      "Create an interactive data visualization dashboard for [dataset]. Include: (1) summary KPI cards, (2) time-series chart, (3) distribution histogram, (4) correlation heatmap, (5) filterable data table. Use React + D3 / Recharts and make it responsive.",
    category: "Data",
    estimatedCost: "$1.80",
    estimatedTime: "5 min",
    icon: "BarChart3",
    tags: ["dashboard", "react", "d3", "visualisation"],
    forks: 923,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-investment-memo",
    title: "Draft an investment memo",
    description:
      "Produce a VC-style investment memo with market sizing, traction analysis, team assessment, and risk-adjusted returns.",
    objective:
      "Draft a professional investment memo for [company / opportunity]. Include: (1) executive summary, (2) market size (TAM/SAM/SOM), (3) product & traction, (4) team background, (5) competitive landscape, (6) financial projections, (7) risks & mitigations, (8) recommendation (invest / pass / watch) with rationale.",
    category: "Finance",
    estimatedCost: "$2.00",
    estimatedTime: "6 min",
    icon: "FileSignature",
    tags: ["vc", "memo", "due-diligence"],
    forks: 534,
    recommendedModels: ["claude-3-opus", "gpt-4o"],
  },
  {
    id: "tmpl-summarize-papers",
    title: "Summarize latest research papers on [topic]",
    description:
      "Query arXiv, Semantic Scholar, and PubMed for recent papers, distill key findings, and build a structured literature review.",
    objective:
      "Summarise the latest research papers on [topic] from the last [timeframe]. For each paper: title, authors, key contribution, methodology, results, and limitations. Synthesise common themes, gaps, and future directions. Provide citations in APA format.",
    category: "Research",
    estimatedCost: "$1.40",
    estimatedTime: "4 min",
    icon: "BookOpen",
    tags: ["literature-review", "arxiv", "academic"],
    forks: 1102,
    recommendedModels: ["claude-3-sonnet", "gpt-4o"],
  },
  {
    id: "tmpl-sentiment-pipeline",
    title: "Build a sentiment analysis pipeline",
    description:
      "Construct an end-to-end sentiment pipeline: data ingestion, preprocessing, model inference, aggregation, and alerting.",
    objective:
      "Build a sentiment analysis pipeline for [data source]. Steps: (1) ingest data (API/stream/csv), (2) preprocess and tokenise, (3) run sentiment classification (positive / neutral / negative) with confidence scores, (4) aggregate by time bucket and entity, (5) flag anomalies, (6) output to dashboard or trigger alerts.",
    category: "Automate",
    estimatedCost: "$1.10",
    estimatedTime: "4 min",
    icon: "Activity",
    tags: ["nlp", "sentiment", "pipeline", "ml"],
    forks: 678,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-linkedin-scraper",
    title: "Scrape LinkedIn profiles for [role]",
    description:
      "Harvest public LinkedIn profile data for a specific role, deduplicate, and enrich with inferred seniority and skills.",
    objective:
      "Scrape public LinkedIn profiles for people with the role [role] at [company or location]. Extract: name, headline, current role, tenure, education, top skills, and recent posts. Output a structured table and deduplicate by profile URL. Respect rate limits and ToS.",
    category: "Research",
    estimatedCost: "$0.70",
    estimatedTime: "3 min",
    icon: "Users",
    tags: ["talent", "recruiting", "linkedin"],
    forks: 445,
    recommendedModels: ["gpt-4o"],
  },
  {
    id: "tmpl-onchain-metrics",
    title: "Analyze on-chain metrics for [crypto]",
    description:
      "Pull Dune / DeFiLlama / The Graph data, compute TVL, active addresses, transaction velocity, and whale concentration.",
    objective:
      "Analyze on-chain metrics for [crypto / protocol]. Pull: TVL, daily active addresses, transaction count, median gas, whale wallet concentration, staking ratio, and developer activity. Compare to 30-day and 90-day trends. Flag any unusual spikes or drops.",
    category: "Finance",
    estimatedCost: "$1.30",
    estimatedTime: "4 min",
    icon: "Link",
    tags: ["crypto", "on-chain", "defi", "blockchain"],
    forks: 389,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-project-plan",
    title: "Generate a project plan for [goal]",
    description:
      "Break a high-level goal into milestones, tasks, owners, dependencies, and a Gantt-style timeline with risk buffers.",
    objective:
      "Generate a detailed project plan to achieve: [goal]. Include: (1) objective & success criteria, (2) key milestones with dates, (3) task breakdown with owners, (4) dependency map, (5) resource requirements, (6) risk register with mitigations, (7) communication cadence. Output in markdown with a mermaid Gantt diagram.",
    category: "Automate",
    estimatedCost: "$0.80",
    estimatedTime: "3 min",
    icon: "Calendar",
    tags: ["planning", "gantt", "pm"],
    forks: 1345,
    recommendedModels: ["claude-3-sonnet", "gpt-4o"],
  },
  {
    id: "tmpl-customer-segmentation",
    title: "Create a customer segmentation analysis",
    description:
      "Run RFM, cohort, and cluster analysis on a customer dataset to surface high-value segments and churn risk.",
    objective:
      "Create a customer segmentation analysis for [dataset / business]. Apply: (1) RFM scoring, (2) cohort retention analysis, (3) k-means clustering on behavioural features, (4) segment profiling (demographics, LTV, churn risk). Recommend targeted actions for each segment. Output visualisations and a summary deck.",
    category: "Data",
    estimatedCost: "$1.60",
    estimatedTime: "5 min",
    icon: "PieChart",
    tags: ["segmentation", "rfm", "clv", "clustering"],
    forks: 567,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-api-integration",
    title: "Build an API integration script",
    description:
      "Generate boilerplate for REST / GraphQL / gRPC integrations with auth, pagination, error handling, and rate-limit awareness.",
    objective:
      "Build an API integration script for [service] API. Requirements: (1) authenticate via [auth method], (2) paginate through [endpoint] to fetch all [resource], (3) transform responses into [target schema], (4) handle rate limits (429) with exponential back-off, (5) log errors and retries, (6) output to [destination]. Use [language].",
    category: "Build",
    estimatedCost: "$0.70",
    estimatedTime: "2 min",
    icon: "Plug",
    tags: ["api", "integration", "rest", "graphql"],
    forks: 1892,
    recommendedModels: ["gpt-4o", "claude-3-sonnet"],
  },
  {
    id: "tmpl-patent-landscape",
    title: "Research patent landscape for [technology]",
    description:
      "Mine USPTO, EPO, and WIPO databases for patents related to a technology, map assignees, and identify white-space opportunities.",
    objective:
      "Research the patent landscape for [technology]. Query USPTO, EPO, and WIPO. For each relevant patent: title, assignee, filing date, claims summary, and legal status. Map top assignees by volume, identify emerging sub-technologies, and highlight white-space opportunities. Provide a visual landscape map.",
    category: "Research",
    estimatedCost: "$1.70",
    estimatedTime: "5 min",
    icon: "Lightbulb",
    tags: ["patents", "ip", "innovation"],
    forks: 298,
    recommendedModels: ["claude-3-opus", "gpt-4o"],
  },
  {
    id: "tmpl-weekly-market-report",
    title: "Generate weekly market report",
    description:
      "Auto-compile a macro + micro market report with index performance, sector rotation, key earnings, and economic calendar.",
    objective:
      "Generate a weekly market report for [date range / region]. Include: (1) index performance (S&P, Nasdaq, DOW, FTSE, etc.), (2) sector rotation heatmap, (3) top 5 earnings surprises, (4) macro data releases (CPI, jobs, PMI), (5) key M&A and IPO news, (6) FX and commodity moves, (7) forward-looking calendar. Output as a formatted markdown report with charts.",
    category: "Finance",
    estimatedCost: "$2.20",
    estimatedTime: "6 min",
    icon: "Newspaper",
    tags: ["macro", "weekly", "report", "markets"],
    forks: 712,
    recommendedModels: ["gpt-4o", "claude-3-opus"],
  },
  {
    id: "tmpl-security-audit",
    title: "Audit code for security vulnerabilities",
    description:
      "Scan code for OWASP Top 10, injection risks, secrets leakage, and insecure dependencies with remediation steps.",
    objective:
      "Audit the provided [language] codebase for security vulnerabilities. Check for: (1) injection risks (SQL, NoSQL, OS command, LDAP), (2) broken authentication / session management, (3) sensitive data exposure, (4) XXE, (5) broken access control, (6) security misconfiguration, (7) XSS, (8) insecure deserialization, (9) known vulnerable dependencies, (10) insufficient logging. Provide severity scores, PoC snippets, and remediation steps.",
    category: "Security",
    estimatedCost: "$1.50",
    estimatedTime: "5 min",
    icon: "Shield",
    tags: ["security", "owasp", "audit", "sast"],
    forks: 1560,
    recommendedModels: ["claude-3-opus", "gpt-4o"],
  },
];

/** ── Helpers ─────────────────────────────────────────────────────────────── */

export function getTemplatesByCategory(
  category: TemplateCategory
): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

export function getAllCategories(): TemplateCategory[] {
  return Array.from(new Set(WORKFLOW_TEMPLATES.map((t) => t.category)));
}

export function searchTemplates(query: string): WorkflowTemplate[] {
  const q = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}
