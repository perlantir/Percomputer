// ── deterministic UUID v4 ──────────────────────────────────────────────────
let _seed = 1;

export function resetSeed(seed = 1) {
  _seed = seed;
}

function nextRand(): number {
  _seed = (_seed * 16807) % 2147483647;
  return _seed / 2147483647;
}

function hex4(): string {
  return Math.floor(nextRand() * 0x10000)
    .toString(16)
    .padStart(4, "0");
}

export function uuid(): string {
  const v4 = `${hex4()}${hex4()}-${hex4()}-4${hex4().slice(1)}-a${hex4().slice(1)}-${hex4()}${hex4()}${hex4()}`;
  return v4;
}

export function shortId(prefix: string): string {
  return `${prefix}_${hex4()}${hex4()}`.toLowerCase();
}

// ── timestamps ─────────────────────────────────────────────────────────────
const NOW = new Date("2025-01-15T14:30:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

export function ago(days: number): Date {
  return new Date(NOW - days * DAY + Math.floor(nextRand() * DAY * 0.5));
}

export function between(startDays: number, endDays: number): Date {
  const t1 = NOW - startDays * DAY;
  const t2 = NOW - endDays * DAY;
  return new Date(t2 + Math.floor(nextRand() * (t1 - t2)));
}

export function addMs(base: Date, ms: number): Date {
  return new Date(base.getTime() + ms);
}

export function iso(d: Date): string {
  return d.toISOString();
}

// ── pickers ────────────────────────────────────────────────────────────────
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(nextRand() * arr.length)];
}

export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => nextRand() - 0.5);
  return shuffled.slice(0, n);
}

export function randInt(min: number, max: number): number {
  return min + Math.floor(nextRand() * (max - min + 1));
}

export function randFloat(min: number, max: number, decimals = 2): number {
  const val = min + nextRand() * (max - min);
  return Number(val.toFixed(decimals));
}

// ── domains / source metadata ───────────────────────────────────────────────
const DOMAINS = [
  "sec.gov",
  "bloomberg.com",
  "reuters.com",
  "ft.com",
  "arxiv.org",
  "github.com",
  "crunchbase.com",
  "pitchbook.com",
  "linkedin.com",
  "medium.com",
  "twitter.com",
  "substack.com",
  "techcrunch.com",
  "theverge.com",
  "wired.com",
  "mit.edu",
  "nature.com",
  "science.org",
  "ipcc.ch",
  "who.int",
  "coinmarketcap.com",
  "coingecko.com",
  "glassnode.com",
  "coinmetrics.io",
  "producthunt.com",
  "g2.com",
  "gartner.com",
  "forrester.com",
  "capterra.com",
  "zapier.com",
  "notion.so",
  "figma.com",
  "stripe.com",
  "aws.amazon.com",
  "docs.python.org",
  "pytorch.org",
  "huggingface.co",
  "stackoverflow.com",
  "news.ycombinator.com",
  "benzinga.com",
  "seekingalpha.com",
  "morningstar.com",
  "yahoo.com",
  "cnbc.com",
  "wsj.com",
  "economist.com",
  "businessinsider.com",
  "marketwatch.com",
  "investopedia.com",
  "nasdaq.com",
  "nytimes.com",
  "washingtonpost.com",
  "apnews.com",
];

export function domain(): string {
  return pick(DOMAINS);
}

export function faviconUrl(d: string): string {
  return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
}

import type { TaskKind } from "../types/enums";

// ── task specs ──────────────────────────────────────────────────────────────
const TASK_TEMPLATES: Record<TaskKind, string[]> = {
  research: [
    "Search for {topic} and compile preliminary findings",
    "Deep-dive into {topic} regulatory landscape",
    "Query academic papers on {topic}",
    "Scrape news articles mentioning {topic}",
    "Build bibliography for {topic}",
  ],
  code: [
    "Generate {lang} script for {task}",
    "Refactor {task} module for performance",
    "Write unit tests covering {task} edge cases",
    "Build CLI tool for {task}",
    "Create Docker container for {task}",
  ],
  synthesis: [
    "Synthesize findings into executive summary",
    "Cross-validate sources and resolve conflicts",
    "Produce final deliverable from draft artifacts",
    "Generate citations and bibliography",
    "Format output per style guide",
  ],
  analysis: [
    "Perform valuation analysis on {topic}",
    "Run comparative analysis: {topic}",
    "Compute financial metrics for {topic}",
    "Trend analysis on {topic} timeseries",
    "Risk-adjusted return analysis for {topic}",
  ],
  "data-processing": [
    "Clean and normalize {dataset} dataset",
    "Run deduplication pass on {dataset}",
    "Transform {dataset} into {format} format",
    "Validate schema for {dataset}",
    "Compute aggregates for {dataset}",
  ],
  monitor: [
    "Set up watch on {target} feed",
    "Poll {target} endpoint every 5 min",
    "Alert on {target} threshold breach",
    "Log all {target} state changes",
  ],
  extract: [
    "Extract structured fields from {source}",
    "Parse contact info from {source}",
    "Pull tabular data from {source}",
    "Mine entities from {source}",
  ],
  visualize: [
    "Render {chartType} chart for {dataset}",
    "Build interactive dashboard for {dataset}",
    "Generate infographic summary of {dataset}",
    "Export {dataset} to PDF report",
  ],
  test: [
    "Run integration tests on {component}",
    "Verify {component} against spec",
    "Load-test {component} at 1000 req/s",
    "Check accessibility on {component}",
  ],
  write: [
    "Draft investment memo for {topic}",
    "Write technical documentation for {topic}",
    "Compose blog post on {topic}",
    "Prepare pitch deck for {topic}",
  ],
  compare: [
    "Compare pricing models of {topic}",
    "Feature matrix: {topic}",
    "Performance benchmark: {topic}",
    "SWOT analysis for {topic}",
  ],
  scrape: [
    "Scrape {target} listing pages",
    "Crawl {target} sitemap for updates",
    "Extract metadata from {target}",
    "Download bulk files from {target}",
  ],
};

export function taskSpec(
  kind: TaskKind,
  replacements: Record<string, string>
): string {
  let tmpl = pick(TASK_TEMPLATES[kind]);
  for (const [k, v] of Object.entries(replacements)) {
    tmpl = tmpl.replace(`{${k}}`, v);
  }
  return tmpl;
}

// ── source cards ───────────────────────────────────────────────────────────
export interface SourceCard {
  id: string;
  url: string;
  domain: string;
  favicon: string;
  title: string;
  excerpt: string;
  cited: number;
  accessedAt: string;
}

const SOURCE_TITLES: Record<string, string[]> = {
  "sec.gov": [
    "FORM 10-K Annual Report",
    "FORM DEF 14A Proxy Statement",
    "FORM 8-K Current Report",
    "FORM S-1 Registration Statement",
  ],
  "bloomberg.com": [
    "Market Update: Equities Rally on Earnings",
    "Commodity Prices Edge Higher",
    "Fed Signals Rate Path in Latest Minutes",
    "Tech Sector Valuations Compress",
  ],
  "reuters.com": [
    "Global supply chain disruptions ease",
    "EV sales outpace forecasts in Q3",
    "Mining sector capex rises on demand",
    "Central banks diverge on policy paths",
  ],
  "ft.com": [
    "Lex column: Lithium supply crunch",
    "Companies & Markets: Tesla earnings",
    "Investors rotate into mining equities",
    "Due Diligence: Series B valuations",
  ],
  "arxiv.org": [
    "Quantum error correction advances",
    "Large language model reasoning benchmarks",
    "Climate modeling with neural networks",
    "Sentiment analysis via transformer architectures",
  ],
  "github.com": [
    "sec-edgar-downloader: Python package",
    "react-auth-hook: useAuth implementation",
    "saas-metrics-dashboard: React + D3",
    "sentiment-pipeline: Hugging Face transformers",
  ],
  "crunchbase.com": [
    "Company profile: Rigetti Computing",
    "Funding round: PsiQuantum Series D",
    "Investor profile: Andreessen Horowitz",
    "Acquisition: D-Wave goes public",
  ],
  "pitchbook.com": [
    "PE & VC valuations trending higher",
    "Exit multiples in SaaS M&A",
    "LP allocation to venture capital",
    "Emerging manager fundraising survey",
  ],
  "techcrunch.com": [
    "Anthropic raises $4B at $18B valuation",
    "OpenAI launches GPT-5 API",
    "Google DeepMind releases Gemini 2.5",
    "xAI Grok-4 hits benchmarks",
  ],
  "ipcc.ch": [
    "AR6 Synthesis Report: Climate Change 2023",
    "Working Group I: The Physical Science Basis",
    "Working Group III: Mitigation of Climate Change",
    "Special Report: Global Warming of 1.5C",
  ],
  "coinmarketcap.com": [
    "Bitcoin price analysis and metrics",
    "Ethereum network activity overview",
    "Top 100 crypto by market cap",
    "On-chain analytics summary",
  ],
  "glassnode.com": [
    "Bitcoin exchange flows reach 3-month high",
    "Miner capitulation signals flash",
    "Long-term holder supply increases",
    "Network difficulty adjustment incoming",
  ],
  "g2.com": [
    "Best Project Management Software 2024",
    "Asana vs Monday.com vs Jira",
    "User reviews: Notion vs Confluence",
    "Enterprise collaboration tools grid",
  ],
  "stackoverflow.com": [
    "React useEffect authentication patterns",
    "Python SEC EDGAR scraping techniques",
    "Pandas deduplication strategies",
    "D3.js dashboard performance tips",
  ],
  "docs.python.org": [
    "urllib.request documentation",
    "csv module reference",
    "unittest framework guide",
    "asyncio concurrent execution",
  ],
  "huggingface.co": [
    "distilbert-base-uncased model card",
    "Sentiment analysis pipeline tutorial",
    "Transformers quickstart guide",
    "Fine-tuning BERT for classification",
  ],
  "benzinga.com": [
    "Tesla Q3 deliveries beat estimates",
    "BYD expands European footprint",
    "Lithium carbonate price update",
    "EV battery technology roundup",
  ],
  "seekingalpha.com": [
    "Tesla: Buy, Sell, or Hold?",
    "BYD: The undervalued EV giant",
    "Top 10 lithium stocks for 2024",
    "Bitcoin ETF inflows accelerate",
  ],
  "morningstar.com": [
    "Stock analyst note: Tesla Inc",
    "Fair value estimate: BYD Company",
    "Sector outlook: Specialty Mining",
    "Economic moat ratings update",
  ],
  "linkedin.com": [
    "Profile: Executive at Quantum Corp",
    "Company page: IonQ Inc",
    "Post: Funding round announcement",
    "Article: Quantum computing careers",
  ],
  "wsj.com": [
    "Markets: Stocks close mixed",
    "Heard on the Street: EV pricing wars",
    " CFO Journal: Compensation trends",
    "Venture Capital: Late-stage rounds",
  ],
  "economist.com": [
    "Buttonwood: Mining boom and bust",
    "Schumpeter: Big tech competition",
    "Leaders: Climate adaptation finance",
    "Briefing: Quantum computing race",
  ],
  "gartner.com": [
    "Magic Quadrant for Analytics Platforms",
    "Hype Cycle for Artificial Intelligence",
    "Market Guide for Project Management",
    "Cool Vendors in Data Science",
  ],
  "capterra.com": [
    "Best project management software",
    "Asana reviews and pricing",
    "Monday.com feature comparison",
    "Jira vs Trello user ratings",
  ],
};

export function makeSources(count: number, topics: string[]): SourceCard[] {
  const out: SourceCard[] = [];
  for (let i = 0; i < count; i++) {
    const d = domain();
    const topic = pick(topics);
    const titles = SOURCE_TITLES[d] || [
      `Report on ${topic}`,
      `Analysis: ${topic}`,
      `Update regarding ${topic}`,
    ];
    const title = pick(titles);
    const id = shortId("src");
    out.push({
      id,
      url: `https://${d}/${topic.toLowerCase().replace(/\s+/g, "-")}-${hex4()}`,
      domain: d,
      favicon: faviconUrl(d),
      title,
      excerpt: `This source contains relevant information about ${topic} sourced from ${d}. ${lorem(20)}`,
      cited: randInt(0, 8),
      accessedAt: iso(ago(randFloat(1, 30))),
    });
  }
  return out;
}

// ── artifacts ────────────────────────────────────────────────────────────────
export interface ArtifactMeta {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  description: string;
  createdAt: string;
}

const ARTIFACT_NAMES: Record<string, string[]> = {
  memo: ["Valuation Memo", "Investment Memo", "Due Diligence Memo", "Executive Summary"],
  code: ["scraper.py", "pipeline.py", "tests.tsx", "dashboard.jsx", "hook.ts", "extractor.py"],
  analysis: ["Comparative Analysis", "Financial Model", "SWOT Matrix", "Benchmark Report"],
  deck: ["Competitive Deck", "Pitch Deck", "Board Presentation", "Investor Update"],
  data: ["cleaned_dataset.csv", "aggregated_metrics.json", "deduplicated_records.parquet"],
  viz: ["metrics_dashboard.html", "chart_export.png", "interactive_report.pdf"],
};

const ARTIFACT_TYPES = [
  "application/vnd.document",
  "text/x-python",
  "text/typescript",
  "text/csv",
  "application/json",
  "text/markdown",
  "text/html",
  "image/png",
  "application/pdf",
  "application/vnd.parquet",
];

export function makeArtifacts(
  count: number,
  category: string
): ArtifactMeta[] {
  const out: ArtifactMeta[] = [];
  const names = ARTIFACT_NAMES[category] || ARTIFACT_NAMES["memo"];
  for (let i = 0; i < count; i++) {
    const name = pick(names);
    const type = pick(ARTIFACT_TYPES);
    const sizeKb = randInt(1, 5000);
    out.push({
      id: shortId("art"),
      name: `${name}${i > 0 ? ` v${i + 1}` : ""}`,
      type,
      sizeBytes: sizeKb * 1024,
      description: `${name} — ${lorem(8)}`,
      createdAt: iso(ago(randFloat(1, 15))),
    });
  }
  return out;
}

// ── model usage stats ────────────────────────────────────────────────────────
export interface ModelUsage {
  modelId: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costCredits: number;
  avgLatencyMs: number;
}

const MODEL_IDS = [
  "claude-opus-4.7",
  "claude-sonnet-4.6",
  "gpt-5.2",
  "gpt-5.1",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "grok-4-fast",
  "haiku-class",
  "mistral-large-2",
  "llama-3.1-70b",
  "codestral-22b",
  "command-r-plus",
  "deepseek-coder",
  "qwen-2.5-72b",
  "mixtral-8x22b",
  "gemma-2-27b",
  "phi-4-medium",
  "solar-10.7b",
  "nous-hermes-2",
];

export function makeModelUsage(taskCount: number): ModelUsage[] {
  const primary = pick(MODEL_IDS);
  const secondary = pick(MODEL_IDS.filter((m) => m !== primary));
  const usage: ModelUsage[] = [];
  for (const modelId of [primary, secondary]) {
    const calls = modelId === primary ? randInt(taskCount, taskCount * 2) : randInt(1, 4);
    const inputTokens = calls * randInt(800, 4000);
    const outputTokens = calls * randInt(400, 2500);
    usage.push({
      modelId,
      calls,
      inputTokens,
      outputTokens,
      costCredits: randFloat(calls * 0.3, calls * 1.2, 2),
      avgLatencyMs: randInt(200, 3500),
    });
  }
  return usage;
}

// ── lorem ipsum helper ───────────────────────────────────────────────────────
const LOREM =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(
    " "
  );

export function lorem(n: number): string {
  const words: string[] = [];
  for (let i = 0; i < n; i++) {
    words.push(LOREM[i % LOREM.length]);
  }
  return words.join(" ") + ".";
}

export function sentence(count = 1): string {
  const s: string[] = [];
  for (let i = 0; i < count; i++) {
    s.push(lorem(randInt(8, 20)));
  }
  return s.join(" ");
}

export function paragraph(count = 1): string {
  const p: string[] = [];
  for (let i = 0; i < count; i++) {
    p.push(sentence(randInt(3, 6)));
  }
  return p.join("\n\n");
}

// ── budget helpers ───────────────────────────────────────────────────────────
export function budget(): { budgetCredits: number; spentCredits: number } {
  const b = randInt(10, 150);
  const s = randFloat(b * 0.3, b * 0.95, 2);
  return { budgetCredits: b, spentCredits: s };
}

// ── workflow objectives (random pool) ──────────────────────────────────────
const OBJECTIVES = [
  "Research the top 10 lithium miners and produce a comparative valuation memo",
  "Analyze Q3 2024 earnings for Tesla vs BYD",
  "Build a Python script that scrapes SEC filings and extracts executive compensation",
  "Summarize the latest IPCC climate report into 5 key takeaways for investors",
  "Generate a competitive analysis deck: Anthropic vs OpenAI vs Google",
  "Transform this CSV of 10,000 customer records into a clean dataset with deduplication",
  "Research quantum computing companies and their funding rounds",
  "Write unit tests for a React authentication hook",
  "Monitor regulatory filings for Company X and alert on changes",
  "Extract contact information from 50 LinkedIn profiles",
  "Create a data visualization dashboard for SaaS metrics",
  "Research and compare 5 project management tools",
  "Generate Python code for a sentiment analysis pipeline",
  "Analyze Bitcoin on-chain metrics for the last 30 days",
  "Draft an investment memo for a Series B startup",
];

export function randomObjective(): string {
  return pick(OBJECTIVES);
}

export function allObjectives(): string[] {
  return [...OBJECTIVES];
}

// ── legacy id generator (moved from deleted mock-data.ts) ────────────────────

export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-4)}`;
}

/** Build a lightweight DAG representation for workflow preview. */
export function generateWorkflowDAG(
  workflowId: string,
  tasks: Array<{ id: string; name: string; status: string; assignedModel?: string; inputTokens?: number; outputTokens?: number; depth?: number; dependencies: readonly string[] }>
): { version: number; nodes: any[]; edges: any[] } {
  const nodes = tasks.map((t, i) => ({
    id: `node-${t.id}`,
    taskId: t.id,
    label: t.name,
    status: t.status,
    model: t.assignedModel,
    estimatedTokens: (t.inputTokens || 0) + (t.outputTokens || 0),
    x: i * 200,
    y: (t.depth || 0) * 120,
  }));

  const edges: any[] = [];
  tasks.forEach((t) => {
    t.dependencies.forEach((depId) => {
      edges.push({
        from: `node-${depId}`,
        to: `node-${t.id}`,
        label: "depends",
      });
    });
  });

  return { version: 1, nodes, edges };
}
