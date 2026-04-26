import {
  resetSeed,
  uuid,
  shortId,
  ago,
  addMs,
  iso,
  between,
  randInt,
  randFloat,
  pick,
  pickN,
  budget,
  makeSources,
  makeArtifacts,
  makeModelUsage,
  SourceCard,
  ArtifactMeta,
  ModelUsage,
} from "../mock/generators";

import type {
  Workflow,
  Task,
  TaskEdge,
  PlanRevision,
  WorkflowId,
  TaskId,
  TaskEdgeId,
  PlanRevisionId,
  SpaceId,
  UserId,
  OrgId,
} from "../types/entities";

import type { TaskStatus, TaskKind, WorkflowStatus, EdgeType } from "../types/enums";

// ── helper: branded id casts ────────────────────────────────────────────────

function wid(s: string): WorkflowId {
  return s as unknown as WorkflowId;
}
function tid(s: string): TaskId {
  return s as unknown as TaskId;
}
function eid(s: string): TaskEdgeId {
  return s as unknown as TaskEdgeId;
}
function pid(s: string): PlanRevisionId {
  return s as unknown as PlanRevisionId;
}
function sid(s: string): SpaceId {
  return s as unknown as SpaceId;
}
function uid(s: string): UserId {
  return s as unknown as UserId;
}
function oid(s: string): OrgId {
  return s as unknown as OrgId;
}

// ── types ────────────────────────────────────────────────────────────────────

type DemoWorkflowRecord = Workflow & {
  userId: string;
  orgId: string;
  budgetCredits: number;
  spentCredits: number;
  remainingCredits: number;
  taskCount: number;
  succeededTasks: number;
  failedTasks: number;
  pendingTasks: number;
  modelUsage: ModelUsage[];
  planRevisions: PlanRevision[];
};

export interface DemoWorkflow {
  workflow: DemoWorkflowRecord;
  tasks: Task[];
  edges: TaskEdge[];
  artifacts: ArtifactMeta[];
  sources: SourceCard[];
}

// ── deterministic seeding ────────────────────────────────────────────────────
resetSeed(42);

// ── helper: build a workflow with tasks & edges ─────────────────────────────

function buildWorkflow(
  wfId: string,
  userId: string,
  orgId: string,
  spaceId: string,
  objective: string,
  taskDefs: Array<{
    kind: TaskKind;
    name: string;
    description: string;
    model?: string;
    durationSec: number;
    tokensIn: number;
    tokensOut: number;
    status?: TaskStatus;
  }>,
  edgeDefs: Array<[number, number]>,
  artifactCategory: string,
  artifactCount: number,
  sourceTopics: string[],
  sourceCount: number,
  planRevisionDefs: Array<{
    version: number;
    createdAt: string;
    reason: string;
    addedTasks: number;
    removedTasks: number;
  }>
): DemoWorkflow {
  const createdAt = between(1, 60);
  const { budgetCredits, spentCredits } = budget();

  const workflow: DemoWorkflowRecord = {
    id: wid(wfId),
    prompt: objective,
    status: "succeeded" as WorkflowStatus,
    spaceId: sid(spaceId),
    createdById: uid(userId),
    activePlanRevisionId: null,
    safetyClass: "default",
    statusReason: null,
    startedAt: iso(addMs(createdAt, randInt(500, 3000))),
    finishedAt: iso(addMs(createdAt, randInt(300_000, 1_800_000))),
    createdAt: iso(createdAt),
    updatedAt: iso(addMs(createdAt, randInt(300_000, 1_800_000))),
    userId,
    orgId,
    budgetCredits,
    spentCredits,
    remainingCredits: Number((budgetCredits - spentCredits).toFixed(2)),
    taskCount: taskDefs.length,
    succeededTasks: taskDefs.length,
    failedTasks: 0,
    pendingTasks: 0,
    modelUsage: makeModelUsage(taskDefs.length),
    planRevisions: planRevisionDefs.map((def) => ({
      id: pid(shortId("prv")),
      workflowId: wid(wfId),
      dagJson: {},
      plannedByModelId: "orchestrator",
      ...def,
    })),
  };

  const taskIds = taskDefs.map(() => shortId("tsk"));

  // Pre-compute dependencies from edge definitions
  const dependencyMap = new Map<number, string[]>();
  for (const [fromIdx, toIdx] of edgeDefs) {
    const deps = dependencyMap.get(toIdx) ?? [];
    deps.push(tid(taskIds[fromIdx]) as unknown as string);
    dependencyMap.set(toIdx, deps);
  }

  const tasks: Task[] = taskDefs.map((def, i) => {
    const startedAt = addMs(createdAt, randInt(2000, 600_000));
    const model = def.model ?? pick(["claude-sonnet-4.6", "gpt-5.2", "gemini-2.5-pro", "claude-opus-4.7", "codestral-22b", "gpt-5.1"]);
    return {
      id: tid(taskIds[i]),
      workflowId: wid(wfId),
      title: def.name,
      instruction: def.description,
      kind: def.kind,
      status: def.status ?? "succeeded",
      dagLevel: i,
      modelAttempts: model ? [model] : [],
      resolvedModelId: model ?? null,
      maxAttempts: 3,
      statusReason: null,
      inputTokens: def.tokensIn,
      outputTokens: def.tokensOut,
      creditsUsed: randFloat(0.3, 2.5, 2),
      durationMs: def.durationSec * 1000,
      dependencies: dependencyMap.get(i) ?? [],
      toolCalls: [{ tool: pick(["web_search", "browser", "code_interpreter", "document_parser", "image_analysis"]), calls: randInt(1, 8) }],
      startedAt: iso(startedAt),
      finishedAt: iso(addMs(startedAt, def.durationSec * 1000)),
      createdAt: iso(createdAt),
      updatedAt: iso(addMs(startedAt, def.durationSec * 1000)),
    };
  });

  const edges: TaskEdge[] = edgeDefs.map(([fromIdx, toIdx]) => ({
    id: eid(shortId("edg")),
    fromTaskId: tid(taskIds[fromIdx]),
    toTaskId: tid(taskIds[toIdx]),
    workflowId: wid(wfId),
    edgeType: "ordering" as EdgeType,
    dataMapping: null,
    condition: null,
    createdAt: iso(createdAt),
  }));

  const artifacts = makeArtifacts(artifactCount, artifactCategory);
  const sources = makeSources(sourceCount, sourceTopics);

  return { workflow, tasks, edges, artifacts, sources };
}

// ── Workflow 1: Lithium Miners ─────────────────────────────────────────────
resetSeed(101);
const WF1 = buildWorkflow(
  "wf_lithium_miners",
  "usr_7a3f9e2b1c4d",
  "org_acme_001",
  "spc_acme_research",
  "Research the top 10 lithium miners and produce a comparative valuation memo",
  [
    { kind: "research", name: "Identify top lithium miners", description: "Compile list of top 10 lithium producers by 2024 market cap and production volume", durationSec: 45, tokensIn: 2500, tokensOut: 1800, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Pull financials and guidance", description: "Gather latest quarterly results, guidance, and analyst estimates for each miner", durationSec: 62, tokensIn: 4200, tokensOut: 3100, model: "gpt-5.2" },
    { kind: "research", name: "Analyst ratings & targets", description: "Collect Wall Street ratings, price targets, and recent estimate revisions", durationSec: 38, tokensIn: 1800, tokensOut: 1400, model: "gpt-5.1" },
    { kind: "analysis", name: "Comparative valuation", description: "Run P/E, EV/EBITDA, P/NAV, and DCF comparisons across all 10 miners", durationSec: 55, tokensIn: 3800, tokensOut: 2600, model: "claude-sonnet-4.6" },
    { kind: "analysis", name: "Operational metrics", description: "Compare cost curves, reserve life, production growth, and jurisdiction risk", durationSec: 48, tokensIn: 3200, tokensOut: 2200, model: "gemini-2.5-pro" },
    { kind: "analysis", name: "ESG & regulatory scan", description: "Assess environmental, social, governance scores and regulatory exposure per jurisdiction", durationSec: 40, tokensIn: 2100, tokensOut: 1600, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Supply-demand model inputs", description: "Gather lithium carbonate and spodumene price forecasts, demand models from consultants", durationSec: 52, tokensIn: 2900, tokensOut: 2000, model: "gpt-5.2" },
    { kind: "analysis", name: "Scenario analysis", description: "Model bull/base/bear price scenarios and impact on miner valuations", durationSec: 58, tokensIn: 3500, tokensOut: 2400, model: "claude-opus-4.7" },
    { kind: "compare", name: "Peer ranking", description: "Score and rank miners across value, growth, risk, and ESG dimensions", durationSec: 35, tokensIn: 1800, tokensOut: 1300, model: "gemini-2.5-pro" },
    { kind: "synthesis", name: "Draft valuation memo", description: "Write comparative valuation memo with executive summary, peer profiles, and risk appendix", durationSec: 72, tokensIn: 5500, tokensOut: 4200, model: "claude-opus-4.7" },
    { kind: "write", name: "Investment recommendation", description: "Formulate clear buy/hold/sell recommendations with position sizing rationale", durationSec: 44, tokensIn: 2400, tokensOut: 1800, model: "claude-sonnet-4.6" },
    { kind: "visualize", name: "Generate comparison charts", description: "Produce valuation scatter plot, cost curve chart, and price sensitivity matrix", durationSec: 28, tokensIn: 1200, tokensOut: 900, model: "gpt-5.1" },
  ],
  [[0,1],[0,2],[0,6],[1,3],[1,4],[1,5],[2,3],[3,8],[4,8],[5,8],[6,7],[7,8],[8,9],[9,10],[9,11]],
  "memo",
  3,
  ["lithium", "albemarle", "sqm", "pilbara", "ganfeng"],
  5,
  [
    { version: 1, createdAt: iso(ago(45)), reason: "Initial plan generated by orchestrator", addedTasks: 10, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(43)), reason: "Added ESG scan after user request for sustainability angle", addedTasks: 1, removedTasks: 0 },
    { version: 3, createdAt: iso(ago(41)), reason: "Added scenario analysis for price sensitivity", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 2: Tesla vs BYD ───────────────────────────────────────────────
resetSeed(202);
const WF2 = buildWorkflow(
  "wf_tesla_vs_byd",
  "usr_7a3f9e2b1c4d",
  "org_acme_001",
  "spc_acme_research",
  "Analyze Q3 2024 earnings for Tesla vs BYD",
  [
    { kind: "research", name: "Pull Tesla Q3 filings", description: "Gather Tesla Q3 2024 earnings release, 10-Q, and earnings call transcript", durationSec: 32, tokensIn: 2100, tokensOut: 1600, model: "gpt-5.2" },
    { kind: "research", name: "Pull BYD Q3 filings", description: "Gather BYD Q3 2024 earnings, segment breakdown, and management commentary", durationSec: 35, tokensIn: 2300, tokensOut: 1700, model: "claude-sonnet-4.6" },
    { kind: "analysis", name: "Revenue & delivery comparison", description: "Compare revenue growth, delivery volumes, and geographic mix", durationSec: 42, tokensIn: 2800, tokensOut: 1900, model: "gemini-2.5-pro" },
    { kind: "analysis", name: "Margin deep-dive", description: "Compare automotive gross margin, operating margin, and cost structure", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "claude-sonnet-4.6" },
    { kind: "analysis", name: "Battery & supply chain", description: "Contrast battery cell strategies: vertical integration vs partnerships", durationSec: 45, tokensIn: 3100, tokensOut: 2100, model: "gpt-5.2" },
    { kind: "research", name: "Analyst reaction", description: "Compile post-earnings analyst notes, rating changes, and estimate revisions", durationSec: 28, tokensIn: 1600, tokensOut: 1200, model: "gpt-5.1" },
    { kind: "analysis", name: "Forward guidance", description: "Compare 2024-2025 guidance, capex plans, and new model pipelines", durationSec: 36, tokensIn: 2200, tokensOut: 1600, model: "claude-sonnet-4.6" },
    { kind: "synthesis", name: "Write comparative memo", description: "Synthesize all findings into a side-by-side earnings comparison memo", durationSec: 55, tokensIn: 4200, tokensOut: 3100, model: "claude-opus-4.7" },
  ],
  [[0,2],[0,3],[0,4],[0,6],[1,2],[1,3],[1,4],[1,6],[2,7],[3,7],[4,7],[5,7],[6,7]],
  "memo",
  2,
  ["tesla", "byd", "earnings", "ev"],
  8,
  [
    { version: 1, createdAt: iso(ago(38)), reason: "Initial plan for Tesla vs BYD comparison", addedTasks: 7, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(37)), reason: "Added battery supply chain deep-dive at user request", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 3: SEC Scraper ─────────────────────────────────────────────────
resetSeed(303);
const WF3 = buildWorkflow(
  "wf_sec_scraper",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_engineering",
  "Build a Python script that scrapes SEC filings and extracts executive compensation",
  [
    { kind: "research", name: "Research EDGAR API", description: "Study SEC EDGAR API docs, rate limits, and filing structure for DEF 14A", durationSec: 25, tokensIn: 1200, tokensOut: 900, model: "gpt-5.1" },
    { kind: "code", name: "Build scraper skeleton", description: "Write Python module for fetching filings by CIK and form type with proxy rotation", durationSec: 52, tokensIn: 3400, tokensOut: 2800, model: "codestral-22b" },
    { kind: "code", name: "Add compensation parser", description: "Implement table extraction for Summary Compensation Tables from HTML/XBRL", durationSec: 48, tokensIn: 3100, tokensOut: 2600, model: "deepseek-coder" },
    { kind: "code", name: "Add CLI interface", description: "Build argparse CLI with output format options (CSV, JSON, Parquet)", durationSec: 30, tokensIn: 1800, tokensOut: 1400, model: "gpt-5.1" },
    { kind: "test", name: "Write unit tests", description: "Write pytest suite with mocked SEC responses and edge case coverage", durationSec: 38, tokensIn: 2200, tokensOut: 1900, model: "codestral-22b" },
    { kind: "code", name: "Add README and examples", description: "Document usage, install instructions, and example commands", durationSec: 18, tokensIn: 900, tokensOut: 700, model: "claude-sonnet-4.6" },
  ],
  [[0,1],[1,2],[2,3],[3,4],[4,5]],
  "code",
  2,
  ["sec", "edgar", "python", "scraping"],
  3,
  [
    { version: 1, createdAt: iso(ago(55)), reason: "Initial plan for SEC scraper tool", addedTasks: 5, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(54)), reason: "Added CLI and README for usability", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 4: IPCC Summary ──────────────────────────────────────────────
resetSeed(404);
const WF4 = buildWorkflow(
  "wf_ipcc_summary",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_personal_investing",
  "Summarize the latest IPCC climate report into 5 key takeaways for investors",
  [
    { kind: "research", name: "Pull IPCC AR6 synthesis", description: "Download and parse IPCC AR6 Synthesis Report and Summary for Policymakers", durationSec: 35, tokensIn: 2100, tokensOut: 1500, model: "gpt-5.2" },
    { kind: "research", name: "Extract investment-relevant sections", description: "Identify sections on stranded assets, transition risk, and adaptation finance", durationSec: 42, tokensIn: 2800, tokensOut: 1900, model: "claude-sonnet-4.6" },
    { kind: "analysis", name: "Map findings to sectors", description: "Map climate risks and opportunities to specific sectors and asset classes", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "gemini-2.5-pro" },
    { kind: "synthesis", name: "Draft 5 takeaways", description: "Synthesize into 5 concise investor takeaways with supporting evidence", durationSec: 48, tokensIn: 3500, tokensOut: 2600, model: "claude-opus-4.7" },
    { kind: "write", name: "Format for distribution", description: "Format as Markdown memo with citations and risk disclaimer", durationSec: 22, tokensIn: 1200, tokensOut: 900, model: "claude-sonnet-4.6" },
  ],
  [[0,1],[1,2],[2,3],[3,4]],
  "memo",
  1,
  ["ipcc", "climate", "investors", "ar6"],
  4,
  [
    { version: 1, createdAt: iso(ago(30)), reason: "Initial plan for IPCC investor summary", addedTasks: 4, removedTasks: 0 },
  ]
);

// ── Workflow 5: Competitive Deck ──────────────────────────────────────────
resetSeed(505);
const WF5 = buildWorkflow(
  "wf_anthropic_vs_openai",
  "usr_b8e5d1a4f7c2",
  "org_acme_001",
  "spc_competitive_intel",
  "Generate a competitive analysis deck: Anthropic vs OpenAI vs Google",
  [
    { kind: "research", name: "Research Anthropic", description: "Gather company profile, model lineup, pricing, and enterprise positioning", durationSec: 35, tokensIn: 2200, tokensOut: 1600, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Research OpenAI", description: "Gather company profile, model lineup, API pricing, and consumer products", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "gpt-5.2" },
    { kind: "research", name: "Research Google DeepMind", description: "Gather model lineup, Workspace/Cloud integration, and research output", durationSec: 36, tokensIn: 2300, tokensOut: 1650, model: "gemini-2.5-pro" },
    { kind: "analysis", name: "Benchmark comparison", description: "Compare model benchmarks: MMLU, HumanEval, MATH, GPQA across tiers", durationSec: 45, tokensIn: 3100, tokensOut: 2200, model: "gpt-5.2" },
    { kind: "analysis", name: "Pricing & packaging", description: "Compare API pricing, enterprise tiers, and deployment options", durationSec: 32, tokensIn: 1900, tokensOut: 1400, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Funding & valuation", description: "Compile funding rounds, valuations, revenue estimates, and burn rates", durationSec: 40, tokensIn: 2600, tokensOut: 1800, model: "gpt-5.1" },
    { kind: "compare", name: "Feature matrix", description: "Build feature comparison matrix: vision, tools, JSON, streaming, fine-tuning", durationSec: 28, tokensIn: 1500, tokensOut: 1100, model: "gemini-2.5-pro" },
    { kind: "analysis", name: "Enterprise win/loss", description: "Analyze reported enterprise wins, defection cases, and switching costs", durationSec: 42, tokensIn: 2700, tokensOut: 1900, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Market sizing", description: "Estimate TAM, SAM, SOM for generative AI market and each player's share", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "gpt-5.2" },
    { kind: "synthesis", name: "Draft competitive deck", description: "Synthesize all research into slide-by-slide competitive analysis deck", durationSec: 58, tokensIn: 4500, tokensOut: 3400, model: "claude-opus-4.7" },
  ],
  [[0,3],[0,4],[0,5],[0,7],[1,3],[1,4],[1,5],[1,7],[2,3],[2,4],[2,6],[2,7],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9]],
  "deck",
  4,
  ["anthropic", "openai", "google", "ai-labs", "competition"],
  12,
  [
    { version: 1, createdAt: iso(ago(25)), reason: "Initial competitive analysis plan", addedTasks: 8, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(24)), reason: "Added enterprise win/loss analysis at request", addedTasks: 1, removedTasks: 0 },
    { version: 3, createdAt: iso(ago(23)), reason: "Added market sizing for investor context", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 6: CSV Deduplication ─────────────────────────────────────────
resetSeed(606);
const WF6 = buildWorkflow(
  "wf_csv_dedup",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_engineering",
  "Transform this CSV of 10,000 customer records into a clean dataset with deduplication",
  [
    { kind: "data-processing", name: "Schema analysis", description: "Analyze CSV schema, identify column types, null rates, and data quality issues", durationSec: 18, tokensIn: 800, tokensOut: 600, model: "gpt-5.1" },
    { kind: "data-processing", name: "Deduplication pass", description: "Run exact and fuzzy deduplication on name/email/phone fields", durationSec: 35, tokensIn: 1500, tokensOut: 1100, model: "gemini-2.5-flash" },
    { kind: "data-processing", name: "Normalization & validation", description: "Normalize addresses, standardize phone formats, validate emails", durationSec: 28, tokensIn: 1200, tokensOut: 900, model: "claude-sonnet-4.6" },
    { kind: "data-processing", name: "Export clean dataset", description: "Export deduplicated, normalized dataset to CSV and Parquet with data dictionary", durationSec: 22, tokensIn: 900, tokensOut: 700, model: "gpt-5.1" },
  ],
  [[0,1],[1,2],[2,3]],
  "data",
  2,
  ["csv", "deduplication", "data-cleaning"],
  1,
  [
    { version: 1, createdAt: iso(ago(50)), reason: "Initial data cleaning plan", addedTasks: 3, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(49)), reason: "Added export to Parquet for downstream analytics", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 7: Quantum Funding ────────────────────────────────────────────
resetSeed(707);
const WF7 = buildWorkflow(
  "wf_quantum_funding",
  "usr_b8e5d1a4f7c2",
  "org_acme_001",
  "spc_competitive_intel",
  "Research quantum computing companies and their funding rounds",
  [
    { kind: "research", name: "Map quantum landscape", description: "Compile comprehensive list of quantum computing companies: public and private", durationSec: 42, tokensIn: 2800, tokensOut: 2000, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Public company financials", description: "Pull 10-Ks, earnings releases, and analyst coverage for IonQ, Rigetti, D-Wave", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "gpt-5.2" },
    { kind: "research", name: "Private company funding", description: "Compile Crunchbase and PitchBook data for PsiQuantum, Xanadu, QuEra, and others", durationSec: 45, tokensIn: 3100, tokensOut: 2200, model: "gpt-5.1" },
    { kind: "analysis", name: "Valuation comparison", description: "Compare valuations: revenue multiples, funding per qubit, and path to commercialization", durationSec: 50, tokensIn: 3400, tokensOut: 2400, model: "claude-opus-4.7" },
    { kind: "analysis", name: "Technology comparison", description: "Compare superconducting, trapped ion, photonic, neutral atom, and annealing approaches", durationSec: 48, tokensIn: 3200, tokensOut: 2300, model: "gemini-2.5-pro" },
    { kind: "research", name: "Government grants & contracts", description: "Catalog DARPA, DOE, NSF, and international government funding awards", durationSec: 36, tokensIn: 2100, tokensOut: 1500, model: "claude-sonnet-4.6" },
    { kind: "compare", name: "Funding timeline", description: "Build timeline of major funding rounds, IPOs, and SPAC mergers 2020-2024", durationSec: 32, tokensIn: 1900, tokensOut: 1400, model: "gpt-5.1" },
    { kind: "synthesis", name: "Write sector overview", description: "Synthesize into investor-focused quantum computing sector overview", durationSec: 55, tokensIn: 4100, tokensOut: 3000, model: "claude-opus-4.7" },
    { kind: "visualize", name: "Create funding chart", description: "Generate bubble chart: funding vs valuation vs year founded", durationSec: 25, tokensIn: 1100, tokensOut: 800, model: "gpt-5.1" },
  ],
  [[0,1],[0,2],[0,5],[1,3],[1,4],[2,3],[2,6],[3,7],[4,7],[5,6],[6,7],[7,8]],
  "analysis",
  3,
  ["quantum", "ionq", "rigetti", "psiquantum", "funding"],
  7,
  [
    { version: 1, createdAt: iso(ago(20)), reason: "Initial quantum sector research plan", addedTasks: 7, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(19)), reason: "Added technology comparison for investment thesis", addedTasks: 1, removedTasks: 0 },
    { version: 3, createdAt: iso(ago(18)), reason: "Added government funding scan for complete picture", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 8: React Auth Tests ────────────────────────────────────────────
resetSeed(808);
const WF8 = buildWorkflow(
  "wf_react_auth_tests",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_engineering",
  "Write unit tests for a React authentication hook",
  [
    { kind: "research", name: "Study useAuth implementation", description: "Review existing useAuth hook source code and identify testable surfaces", durationSec: 15, tokensIn: 800, tokensOut: 600, model: "gpt-5.1" },
    { kind: "code", name: "Write auth state tests", description: "Test initial state, login success/failure, and logout transitions", durationSec: 38, tokensIn: 2200, tokensOut: 1800, model: "codestral-22b" },
    { kind: "code", name: "Write token persistence tests", description: "Test localStorage token storage, retrieval, and expiration handling", durationSec: 32, tokensIn: 1900, tokensOut: 1500, model: "deepseek-coder" },
    { kind: "code", name: "Write redirect & guard tests", description: "Test protected route guards, redirect behavior, and role-based access", durationSec: 35, tokensIn: 2000, tokensOut: 1600, model: "codestral-22b" },
    { kind: "test", name: "Run test suite", description: "Execute all tests, fix failures, and achieve >95% coverage", durationSec: 28, tokensIn: 1200, tokensOut: 1000, model: "gpt-5.1" },
  ],
  [[0,1],[0,2],[0,3],[1,4],[2,4],[3,4]],
  "code",
  2,
  ["react", "auth", "testing", "jest"],
  2,
  [
    { version: 1, createdAt: iso(ago(42)), reason: "Initial test plan for useAuth hook", addedTasks: 4, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(41)), reason: "Added redirect/guard tests for completeness", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 9: Regulatory Monitor ─────────────────────────────────────────
resetSeed(909);
const WF9 = buildWorkflow(
  "wf_regulatory_monitor",
  "usr_b8e5d1a4f7c2",
  "org_acme_001",
  "spc_acme_research",
  "Monitor regulatory filings for Company X and alert on changes",
  [
    { kind: "monitor", name: "Set up SEC watch", description: "Configure EDGAR feed monitor for Company X 8-K, 10-Q, 10-K, and 13D filings", durationSec: 22, tokensIn: 1100, tokensOut: 800, model: "claude-sonnet-4.6" },
    { kind: "monitor", name: "Set up alerts", description: "Configure Slack and email alerts for material event keywords and filing types", durationSec: 18, tokensIn: 900, tokensOut: 700, model: "gpt-5.1" },
    { kind: "monitor", name: "Historical baseline scan", description: "Pull 2 years of historical filings to establish baseline patterns and keyword frequency", durationSec: 45, tokensIn: 2600, tokensOut: 1800, model: "gemini-2.5-pro" },
  ],
  [[0,1],[1,2]],
  "analysis",
  3,
  ["sec", "regulatory", "monitoring", "8-k"],
  3,
  [
    { version: 1, createdAt: iso(ago(15)), reason: "Initial monitoring setup", addedTasks: 2, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(14)), reason: "Added historical baseline for anomaly detection", addedTasks: 1, removedTasks: 0 },
  ]
);
WF9.workflow.status = "running";
WF9.workflow.finishedAt = null;
WF9.workflow.succeededTasks = 2;
WF9.workflow.pendingTasks = 1;
WF9.tasks[2].status = "pending";
WF9.tasks[2].startedAt = null;
WF9.tasks[2].finishedAt = null;

// ── Workflow 10: LinkedIn Extract ──────────────────────────────────────────
resetSeed(1010);
const WF10 = buildWorkflow(
  "wf_linkedin_extract",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_engineering",
  "Extract contact information from 50 LinkedIn profiles",
  [
    { kind: "research", name: "Research scraping approach", description: "Research LinkedIn profile structure, anti-bot measures, and legal considerations", durationSec: 20, tokensIn: 1100, tokensOut: 800, model: "gpt-5.1" },
    { kind: "code", name: "Build scraper", description: "Write Python scraper with proxy rotation, session management, and rate limiting", durationSec: 45, tokensIn: 2900, tokensOut: 2400, model: "codestral-22b" },
    { kind: "scrape", name: "Scrape profiles batch 1", description: "Scrape profiles 1-15 with validation and screenshot capture", durationSec: 52, tokensIn: 800, tokensOut: 600, model: "gemini-2.5-flash" },
    { kind: "scrape", name: "Scrape profiles batch 2", description: "Scrape profiles 16-30 with validation and screenshot capture", durationSec: 55, tokensIn: 800, tokensOut: 600, model: "gemini-2.5-flash" },
    { kind: "scrape", name: "Scrape profiles batch 3", description: "Scrape profiles 31-45 with validation and screenshot capture", durationSec: 58, tokensIn: 800, tokensOut: 600, model: "gemini-2.5-flash" },
    { kind: "scrape", name: "Scrape profiles batch 4", description: "Scrape profiles 46-50 with validation and screenshot capture", durationSec: 35, tokensIn: 600, tokensOut: 450, model: "gemini-2.5-flash" },
    { kind: "extract", name: "Extract structured data", description: "Parse HTML into structured contact records with name, title, company, email, phone", durationSec: 32, tokensIn: 1700, tokensOut: 1300, model: "claude-sonnet-4.6" },
  ],
  [[0,1],[1,2],[1,3],[1,4],[1,5],[2,6],[3,6],[4,6],[5,6]],
  "data",
  1,
  ["linkedin", "profiles", "contact", "scraping"],
  50,
  [
    { version: 1, createdAt: iso(ago(33)), reason: "Initial LinkedIn extraction plan", addedTasks: 5, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(32)), reason: "Split into 4 batches to respect rate limits", addedTasks: 0, removedTasks: 0 },
  ]
);

// ── Workflow 11: SaaS Dashboard ──────────────────────────────────────────
resetSeed(1111);
const WF11 = buildWorkflow(
  "wf_saas_dashboard",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_engineering",
  "Create a data visualization dashboard for SaaS metrics",
  [
    { kind: "research", name: "Define SaaS metrics", description: "Research and define the 5 key SaaS metrics to visualize: NRR, CAC, churn, expansion, gross margin", durationSec: 22, tokensIn: 1300, tokensOut: 950, model: "claude-sonnet-4.6" },
    { kind: "code", name: "Build React shell", description: "Create React app with routing, layout, and theme system", durationSec: 40, tokensIn: 2500, tokensOut: 2000, model: "codestral-22b" },
    { kind: "code", name: "Implement D3 charts", description: "Build interactive D3 chart components: line, bar, donut, and funnel charts", durationSec: 48, tokensIn: 3100, tokensOut: 2600, model: "deepseek-coder" },
    { kind: "code", name: "Add CSV upload", description: "Build drag-and-drop CSV upload with PapaParse and data transformation pipeline", durationSec: 38, tokensIn: 2200, tokensOut: 1800, model: "gpt-5.1" },
    { kind: "code", name: "Add filter & drill-down", description: "Implement date range filters, segment drill-down, and metric toggle controls", durationSec: 35, tokensIn: 2000, tokensOut: 1600, model: "claude-sonnet-4.6" },
    { kind: "test", name: "Write tests & deploy", description: "Add component tests, accessibility checks, and build for static deployment", durationSec: 30, tokensIn: 1600, tokensOut: 1300, model: "codestral-22b" },
  ],
  [[0,2],[0,3],[1,2],[1,3],[1,4],[2,5],[3,5],[4,5]],
  "viz",
  3,
  ["saas", "dashboard", "d3", "react", "metrics"],
  3,
  [
    { version: 1, createdAt: iso(ago(28)), reason: "Initial dashboard plan", addedTasks: 4, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(27)), reason: "Added filter/drill-down for interactivity", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 12: PM Tools Comparison ─────────────────────────────────────
resetSeed(1212);
const WF12 = buildWorkflow(
  "wf_pm_tools_compare",
  "usr_b8e5d1a4f7c2",
  "org_acme_001",
  "spc_competitive_intel",
  "Research and compare 5 project management tools",
  [
    { kind: "research", name: "Research Asana", description: "Deep-dive into Asana features, pricing, integrations, and user feedback", durationSec: 30, tokensIn: 1800, tokensOut: 1300, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Research Monday.com", description: "Deep-dive into Monday.com features, pricing, customization, and enterprise fit", durationSec: 30, tokensIn: 1800, tokensOut: 1300, model: "gpt-5.2" },
    { kind: "research", name: "Research Jira", description: "Deep-dive into Jira features, developer integration, and scaling characteristics", durationSec: 32, tokensIn: 1900, tokensOut: 1400, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Research ClickUp", description: "Deep-dive into ClickUp features, all-in-one positioning, and user reviews", durationSec: 28, tokensIn: 1600, tokensOut: 1200, model: "gpt-5.1" },
    { kind: "research", name: "Research Notion", description: "Deep-dive into Notion project management features, docs hybrid, and limitations", durationSec: 28, tokensIn: 1600, tokensOut: 1200, model: "gemini-2.5-pro" },
    { kind: "compare", name: "Feature matrix", description: "Build comprehensive feature comparison matrix across all 5 tools", durationSec: 35, tokensIn: 2200, tokensOut: 1600, model: "gemini-2.5-pro" },
    { kind: "compare", name: "Pricing comparison", description: "Compare per-seat pricing, enterprise tiers, and total cost of ownership", durationSec: 25, tokensIn: 1400, tokensOut: 1000, model: "gpt-5.1" },
    { kind: "analysis", name: "User satisfaction analysis", description: "Analyze G2, Capterra, and Reddit reviews for satisfaction trends and pain points", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "claude-sonnet-4.6" },
  ],
  [[0,5],[0,6],[0,7],[1,5],[1,6],[1,7],[2,5],[2,6],[2,7],[3,5],[3,6],[3,7],[4,5],[4,6],[4,7]],
  "analysis",
  2,
  ["asana", "monday", "jira", "clickup", "notion", "project-management"],
  10,
  [
    { version: 1, createdAt: iso(ago(22)), reason: "Initial PM tools comparison plan", addedTasks: 5, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(21)), reason: "Added user satisfaction analysis for qualitative depth", addedTasks: 1, removedTasks: 0 },
    { version: 3, createdAt: iso(ago(20)), reason: "Added pricing comparison for procurement context", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 13: Sentiment Pipeline ───────────────────────────────────────
resetSeed(1313);
const WF13 = buildWorkflow(
  "wf_sentiment_pipeline",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_engineering",
  "Generate Python code for a sentiment analysis pipeline",
  [
    { kind: "research", name: "Research model options", description: "Compare FinBERT, DistilBERT, RoBERTa for financial sentiment tasks", durationSec: 22, tokensIn: 1400, tokensOut: 1000, model: "claude-sonnet-4.6" },
    { kind: "code", name: "Build pipeline class", description: "Write reusable SentimentPipeline class with batch and streaming modes", durationSec: 45, tokensIn: 2900, tokensOut: 2400, model: "codestral-22b" },
    { kind: "code", name: "Add preprocessing", description: "Add text cleaning, URL removal, and financial entity masking preprocessing", durationSec: 35, tokensIn: 2100, tokensOut: 1700, model: "deepseek-coder" },
    { kind: "test", name: "Write benchmark tests", description: "Write tests comparing accuracy on FiQA and financial news datasets", durationSec: 32, tokensIn: 1800, tokensOut: 1500, model: "gpt-5.1" },
    { kind: "code", name: "Add README & examples", description: "Document pipeline usage, model selection guide, and example notebooks", durationSec: 20, tokensIn: 1000, tokensOut: 750, model: "claude-sonnet-4.6" },
  ],
  [[0,1],[1,2],[2,3],[3,4]],
  "code",
  2,
  ["sentiment", "finbert", "python", "nlp"],
  2,
  [
    { version: 1, createdAt: iso(ago(35)), reason: "Initial sentiment pipeline plan", addedTasks: 3, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(34)), reason: "Added preprocessing for production robustness", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 14: Bitcoin On-Chain ─────────────────────────────────────────
resetSeed(1414);
const WF14 = buildWorkflow(
  "wf_bitcoin_onchain",
  "usr_2f6c8d3e5b9a",
  "org_indie_002",
  "spc_personal_investing",
  "Analyze Bitcoin on-chain metrics for the last 30 days",
  [
    { kind: "research", name: "Pull on-chain data", description: "Query Glassnode, CoinMetrics for exchange flows, holder supply, and network activity", durationSec: 32, tokensIn: 1900, tokensOut: 1400, model: "gpt-5.2" },
    { kind: "research", name: "Pull price & macro data", description: "Gather BTC price action, ETF flows, and macro correlations", durationSec: 28, tokensIn: 1600, tokensOut: 1200, model: "claude-sonnet-4.6" },
    { kind: "analysis", name: "Exchange flow analysis", description: "Analyze net exchange flows, inflow/outflow trends, and whale movements", durationSec: 38, tokensIn: 2200, tokensOut: 1600, model: "gemini-2.5-pro" },
    { kind: "analysis", name: "Holder behavior analysis", description: "Analyze STH/LTH supply dynamics, coin days destroyed, and realized cap", durationSec: 42, tokensIn: 2600, tokensOut: 1900, model: "claude-sonnet-4.6" },
    { kind: "analysis", name: "Network health metrics", description: "Evaluate hashrate, difficulty, mempool congestion, and miner revenue", durationSec: 35, tokensIn: 2000, tokensOut: 1500, model: "gpt-5.1" },
    { kind: "analysis", name: "Macro correlation", description: "Correlate BTC with DXY, SPX, gold, and treasury yields over the period", durationSec: 40, tokensIn: 2300, tokensOut: 1700, model: "gemini-2.5-pro" },
    { kind: "synthesis", name: "Write on-chain report", description: "Synthesize all metrics into a 30-day on-chain summary with trading implications", durationSec: 48, tokensIn: 3200, tokensOut: 2400, model: "claude-opus-4.7" },
  ],
  [[0,2],[0,3],[0,4],[1,5],[1,6],[2,6],[3,6],[4,6],[5,6]],
  "analysis",
  2,
  ["bitcoin", "on-chain", "glassnode", "crypto"],
  5,
  [
    { version: 1, createdAt: iso(ago(12)), reason: "Initial Bitcoin on-chain analysis plan", addedTasks: 5, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(11)), reason: "Added macro correlation for holistic view", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── Workflow 15: Series B Memo ────────────────────────────────────────────
resetSeed(1515);
const WF15 = buildWorkflow(
  "wf_series_b_memo",
  "usr_7a3f9e2b1c4d",
  "org_acme_001",
  "spc_acme_research",
  "Draft an investment memo for a Series B startup",
  [
    { kind: "research", name: "Company overview", description: "Research company history, founding team, mission, and product evolution", durationSec: 35, tokensIn: 2100, tokensOut: 1500, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Market sizing", description: "Build TAM/SAM/SOM estimates with bottoms-up and top-down validation", durationSec: 42, tokensIn: 2800, tokensOut: 2000, model: "gpt-5.2" },
    { kind: "research", name: "Competitive landscape", description: "Map direct and indirect competitors with differentiation analysis", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "gemini-2.5-pro" },
    { kind: "research", name: "Financial analysis", description: "Analyze ARR trajectory, burn rate, unit economics, and capital efficiency", durationSec: 45, tokensIn: 3100, tokensOut: 2200, model: "claude-sonnet-4.6" },
    { kind: "analysis", name: "Valuation analysis", description: "Build comps table and DCF to justify Series B valuation range", durationSec: 50, tokensIn: 3400, tokensOut: 2500, model: "claude-opus-4.7" },
    { kind: "research", name: "Customer validation", description: "Research customer case studies, testimonials, and Net Promoter Score data", durationSec: 32, tokensIn: 1900, tokensOut: 1400, model: "gpt-5.1" },
    { kind: "analysis", name: "Team & governance", description: "Evaluate leadership team, board composition, and cap table health", durationSec: 30, tokensIn: 1800, tokensOut: 1300, model: "claude-sonnet-4.6" },
    { kind: "research", name: "Technology assessment", description: "Assess IP portfolio, technical moat, and engineering team quality", durationSec: 35, tokensIn: 2200, tokensOut: 1600, model: "deepseek-coder" },
    { kind: "analysis", name: "Risk assessment", description: "Identify key risks: market, execution, financing, regulatory, and team", durationSec: 38, tokensIn: 2400, tokensOut: 1700, model: "gpt-5.2" },
    { kind: "analysis", name: "Exit analysis", description: "Model likely exit paths, comparable transactions, and timeline expectations", durationSec: 40, tokensIn: 2500, tokensOut: 1800, model: "claude-opus-4.7" },
    { kind: "synthesis", name: "Draft investment memo", description: "Write full investment memo: thesis, metrics, risks, and recommendation", durationSec: 62, tokensIn: 4800, tokensOut: 3600, model: "claude-opus-4.7" },
  ],
  [[0,4],[0,6],[1,4],[1,9],[2,4],[2,9],[3,4],[3,9],[4,10],[5,6],[5,10],[6,10],[7,8],[8,10],[9,10]],
  "memo",
  3,
  ["series-b", "startup", "investment", "valuation", "memo"],
  6,
  [
    { version: 1, createdAt: iso(ago(18)), reason: "Initial Series B memo plan", addedTasks: 8, removedTasks: 0 },
    { version: 2, createdAt: iso(ago(17)), reason: "Added exit analysis for fund return modeling", addedTasks: 1, removedTasks: 0 },
    { version: 3, createdAt: iso(ago(16)), reason: "Added technology assessment for SaaS moat evaluation", addedTasks: 1, removedTasks: 0 },
  ]
);

// ── exports ─────────────────────────────────────────────────────────────────

export const DEMO_WORKFLOWS: DemoWorkflow[] = [
  WF1, WF2, WF3, WF4, WF5, WF6, WF7, WF8, WF9, WF10, WF11, WF12, WF13, WF14, WF15,
];

export function getWorkflowById(id: string): DemoWorkflow | undefined {
  return DEMO_WORKFLOWS.find((w) => w.workflow.id === id);
}

export function getWorkflowsBySpace(spaceId: string): DemoWorkflow[] {
  return DEMO_WORKFLOWS.filter((w) => w.workflow.spaceId === spaceId);
}

export function getWorkflowsByUser(userId: string): DemoWorkflow[] {
  return DEMO_WORKFLOWS.filter((w) => w.workflow.userId === userId);
}

export function getAllTasks(): Task[] {
  return DEMO_WORKFLOWS.flatMap((w) => w.tasks);
}

export function getAllArtifacts(): ArtifactMeta[] {
  return DEMO_WORKFLOWS.flatMap((w) => w.artifacts);
}

export function getAllSources(): SourceCard[] {
  return DEMO_WORKFLOWS.flatMap((w) => w.sources);
}

export function getAllEdges(): TaskEdge[] {
  return DEMO_WORKFLOWS.flatMap((w) => w.edges);
}

export function countRecords(): Record<string, number> {
  return {
    workflows: DEMO_WORKFLOWS.length,
    tasks: getAllTasks().length,
    edges: getAllEdges().length,
    artifacts: getAllArtifacts().length,
    sources: getAllSources().length,
  };
}
