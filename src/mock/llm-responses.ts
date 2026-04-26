import { uuid } from "./generators";

// ── orchestrator planning responses ─────────────────────────────────────────

export interface PlanNode {
  id: string;
  kind: string;
  description: string;
  dependencies: string[];
  estimatedTokens: number;
  assignedModel: string;
}

export interface PlanDAG {
  version: number;
  objective: string;
  nodes: PlanNode[];
  edges: { from: string; to: string }[];
  estimatedTotalCredits: number;
  reasoning: string;
}

export function mockOrchestratorPlan(objective: string): PlanDAG {
  const plan: PlanDAG = {
    version: 1,
    objective,
    nodes: [],
    edges: [],
    estimatedTotalCredits: 45,
    reasoning: `Based on the objective "${objective}", I've decomposed this into a DAG where research tasks run in parallel, analysis depends on research completion, and synthesis depends on analysis. The critical path is 4 steps long with an estimated 12k tokens.`,
  };

  if (objective.includes("lithium")) {
    plan.nodes = [
      { id: "n1", kind: "research", description: "Identify top 10 lithium miners by production and market cap", dependencies: [], estimatedTokens: 4000, assignedModel: "claude-sonnet-4.6" },
      { id: "n2", kind: "research", description: "Gather latest financials and guidance for each miner", dependencies: ["n1"], estimatedTokens: 5000, assignedModel: "gpt-5.2" },
      { id: "n3", kind: "analysis", description: "Run comparative valuation: P/E, EV/EBITDA, P/NAV", dependencies: ["n2"], estimatedTokens: 3500, assignedModel: "claude-sonnet-4.6" },
      { id: "n4", kind: "research", description: "Pull analyst ratings and price targets", dependencies: ["n1"], estimatedTokens: 3000, assignedModel: "gpt-5.1" },
      { id: "n5", kind: "analysis", description: "Compare operational metrics: cost curve, reserve life", dependencies: ["n2"], estimatedTokens: 3500, assignedModel: "gemini-2.5-pro" },
      { id: "n6", kind: "synthesis", description: "Draft comparative valuation memo with risk section", dependencies: ["n3", "n4", "n5"], estimatedTokens: 6000, assignedModel: "claude-opus-4.7" },
    ];
    plan.edges = [
      { from: "n1", to: "n2" },
      { from: "n1", to: "n4" },
      { from: "n2", to: "n3" },
      { from: "n2", to: "n5" },
      { from: "n3", to: "n6" },
      { from: "n4", to: "n6" },
      { from: "n5", to: "n6" },
    ];
    plan.estimatedTotalCredits = 68;
  } else if (objective.includes("Tesla") || objective.includes("BYD")) {
    plan.nodes = [
      { id: "n1", kind: "research", description: "Pull Tesla Q3 2024 earnings release and 10-Q", dependencies: [], estimatedTokens: 3000, assignedModel: "gpt-5.2" },
      { id: "n2", kind: "research", description: "Pull BYD Q3 2024 earnings and segment breakdown", dependencies: [], estimatedTokens: 3000, assignedModel: "claude-sonnet-4.6" },
      { id: "n3", kind: "analysis", description: "Compare revenue, margin, and delivery growth", dependencies: ["n1", "n2"], estimatedTokens: 3500, assignedModel: "gemini-2.5-pro" },
      { id: "n4", kind: "analysis", description: "Analyze battery cost and supply chain differences", dependencies: ["n1", "n2"], estimatedTokens: 3000, assignedModel: "claude-sonnet-4.6" },
      { id: "n5", kind: "synthesis", description: "Write comparative earnings memo", dependencies: ["n3", "n4"], estimatedTokens: 4000, assignedModel: "claude-opus-4.7" },
    ];
    plan.edges = [
      { from: "n1", to: "n3" },
      { from: "n1", to: "n4" },
      { from: "n2", to: "n3" },
      { from: "n2", to: "n4" },
      { from: "n3", to: "n5" },
      { from: "n4", to: "n5" },
    ];
    plan.estimatedTotalCredits = 42;
  } else if (objective.includes("Python") || objective.includes("script")) {
    plan.nodes = [
      { id: "n1", kind: "research", description: "Research SEC EDGAR API and filing structure", dependencies: [], estimatedTokens: 2000, assignedModel: "gpt-5.1" },
      { id: "n2", kind: "code", description: "Write Python scraper using requests + BeautifulSoup", dependencies: ["n1"], estimatedTokens: 4000, assignedModel: "codestral-22b" },
      { id: "n3", kind: "code", description: "Add XBRL parsing for executive compensation tables", dependencies: ["n2"], estimatedTokens: 3500, assignedModel: "deepseek-coder" },
      { id: "n4", kind: "test", description: "Write unit tests with mocked SEC responses", dependencies: ["n3"], estimatedTokens: 2500, assignedModel: "gpt-5.1" },
    ];
    plan.edges = [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ];
    plan.estimatedTotalCredits = 28;
  } else if (objective.includes("dashboard")) {
    plan.nodes = [
      { id: "n1", kind: "research", description: "Define key SaaS metrics to visualize", dependencies: [], estimatedTokens: 2000, assignedModel: "claude-sonnet-4.6" },
      { id: "n2", kind: "code", description: "Build React dashboard shell with routing", dependencies: [], estimatedTokens: 3000, assignedModel: "codestral-22b" },
      { id: "n3", kind: "code", description: "Implement D3 chart components for each metric", dependencies: ["n1", "n2"], estimatedTokens: 4500, assignedModel: "deepseek-coder" },
      { id: "n4", kind: "code", description: "Add CSV upload and data transformation layer", dependencies: ["n2"], estimatedTokens: 3000, assignedModel: "gpt-5.1" },
      { id: "n5", kind: "test", description: "Add component and integration tests", dependencies: ["n3", "n4"], estimatedTokens: 2500, assignedModel: "codestral-22b" },
    ];
    plan.edges = [
      { from: "n1", to: "n3" },
      { from: "n2", to: "n3" },
      { from: "n2", to: "n4" },
      { from: "n3", to: "n5" },
      { from: "n4", to: "n5" },
    ];
    plan.estimatedTotalCredits = 38;
  } else {
    // Generic fallback plan
    plan.nodes = [
      { id: "n1", kind: "research", description: "Gather background information and sources", dependencies: [], estimatedTokens: 3000, assignedModel: "claude-sonnet-4.6" },
      { id: "n2", kind: "analysis", description: "Analyze and structure findings", dependencies: ["n1"], estimatedTokens: 3000, assignedModel: "gpt-5.2" },
      { id: "n3", kind: "synthesis", description: "Produce final deliverable", dependencies: ["n2"], estimatedTokens: 4000, assignedModel: "claude-opus-4.7" },
    ];
    plan.edges = [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
    ];
    plan.estimatedTotalCredits = 35;
  }

  return plan;
}

// ── sub-agent research responses ────────────────────────────────────────────

export interface CitedResponse {
  content: string;
  citations: Array<{ index: number; sourceId: string; text: string }>;
}

export function mockResearchResponse(topic: string): CitedResponse {
  const citations = [
    { index: 1, sourceId: uuid(), text: "Primary industry report" },
    { index: 2, sourceId: uuid(), text: "Company filings" },
    { index: 3, sourceId: uuid(), text: "News analysis" },
    { index: 4, sourceId: uuid(), text: "Academic source" },
  ];

  if (topic.includes("lithium")) {
    return {
      content: `## Top Lithium Miners Overview

The global lithium mining landscape is dominated by a handful of players controlling the majority of production capacity.[1] Albemarle Corporation (NYSE: ALB) remains the largest producer with operations in Chile's Atacama and Australia.[2] SQM (NYSE: SQM) follows closely, leveraging its Chilean brine assets.[3]

Australian hard-rock miners — Pilbara Minerals, Mineral Resources, and IGO — have ramped spodumene concentrate output significantly.[1] Chinese firms Ganfeng Lithium and Tianqi Lithium control substantial downstream refining capacity.[4]

**Key Metrics (2024):**
- Albemarle: ~110 kt LCE guidance, $4.2B revenue run-rate
- SQM: ~95 kt LCE, facing royalty disputes with Chilean government
- Pilbara: ~80 kt LCE equivalent in spodumene

**Valuation Spread:** P/E ratios range from 8x (SQM) to 35x (Pilbara), reflecting divergent growth and risk profiles.[2]`,
      citations: citations.slice(0, 4),
    };
  }

  if (topic.includes("Tesla") || topic.includes("BYD")) {
    return {
      content: `## Tesla vs BYD Q3 2024 Comparison

**Revenue:** Tesla reported $25.18B (+8% YoY) while BYD delivered 201.1B RMB (~$28.2B, +24% YoY).[1] On a USD basis, BYD has overtaken Tesla in absolute revenue for the first time.[2]

**Deliveries:** Tesla 462,890 vehicles vs BYD 1,134,000 vehicles (including plug-in hybrids).[3] Tesla's pure BEV volume is roughly half of BYD's BEV-only figure (~443,000).

**Margins:** Tesla automotive gross margin 19.7% vs BYD 21.9%.[1] The gap is narrowing — a year ago it was 17.9% vs 22.1%. Tesla's energy segment (52% growth) margin is undisclosed but believed to be lower.

**Guidance:** Tesla maintained "minimum 50% CAGR" long-term but gave no 2025 unit target. BYD guided 4M total NEVs for 2025, implying 42% growth.[2]`,
      citations: citations.slice(0, 3),
    };
  }

  if (topic.includes("quantum")) {
    return {
      content: `## Quantum Computing Companies & Funding

**Public Companies:**
- IonQ (NYSE: IONQ): Market cap ~$2.1B, 2024 revenue ~$38M (+90% YoY), SPAC merger completed 2021.[1]
- Rigetti (NASDAQ: RGTI): Market cap ~$200M, reverse merger with Supernova 2022. Revenue ~$13M.[2]
- D-Wave (NYSE: QBTS): Quantum annealing focus. Revenue ~$10M, raised $40M PIPE in 2024.[3]

**Private Companies:**
- PsiQuantum: Raised $940M Series D (2024) at $3.15B valuation. Photonic approach targeting 1M+ qubits.[1]
- Xanadu: Raised $100M Series B (2023), photonic quantum computing.
- QuEra: $17M seed (2022), neutral atoms approach, Harvard/MIT spinout.[4]

**Funding Trends:** Total quantum VC funding in 2024 was ~$1.2B, down from $2.3B peak in 2022. Hardware companies face longer time-to-revenue; software/tools are getting relatively more capital.[2]`,
      citations: citations.slice(0, 4),
    };
  }

  // Generic fallback
  return {
    content: `## Research Summary: ${topic}

Based on the available sources, here are the key findings:[1]

The ${topic} landscape has evolved significantly over the past 12 months. Primary drivers include regulatory changes, technological breakthroughs, and shifting competitive dynamics.[2]

Key entities identified include major incumbents and emerging challengers, each with distinct strategic positioning.[3] Financial metrics suggest the sector is at an inflection point, with capital allocation favoring scale over innovation in the near term.[4]

Further deep-dive is recommended on the regulatory and technology vectors before finalizing any investment thesis.`,
    citations,
  };
}

// ── sub-agent code responses ───────────────────────────────────────────────

export interface CodeResponse {
  language: string;
  code: string;
  explanation: string;
  dependencies: string[];
}

export function mockCodeResponse(task: string): CodeResponse {
  if (task.includes("scraper") || task.includes("SEC")) {
    return {
      language: "python",
      code: `import requests
from bs4 import BeautifulSoup
import pandas as pd
from typing import List, Dict

HEADERS = {
    "User-Agent": "MyCompany-Scraper/1.0 (contact@example.com)"
}

def fetch_filings(cik: str, form_type: str = "DEF 14A") -> List[Dict]:
    """Fetch SEC filings for a given CIK."""
    base = "https://www.sec.gov/cgi-bin/browse-edgar"
    params = {
        "action": "getcompany",
        "CIK": cik,
        "type": form_type,
        "dateb": "",
        "owner": "exclude",
        "count": "40",
        "output": "xml",
    }
    resp = requests.get(base, params=params, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.content, "xml")
    entries = []
    for entry in soup.find_all("entry"):
        entries.append({
            "title": entry.find("title").text,
            "link": entry.find("filingHref").text,
            "date": entry.find("filingDate").text,
            "accession": entry.find("accessionNumber").text,
        })
    return entries

def extract_executive_compensation(filing_url: str) -> pd.DataFrame:
    """Parse compensation table from proxy statement."""
    # Implementation fetches the filing, parses tables,
    # and returns a DataFrame with columns:
    # [Name, Title, Salary, Bonus, Stock_Awards, Total]
    ...
    return pd.DataFrame()
`,
      explanation: "This module provides two core functions: `fetch_filings` queries EDGAR's XML feed for filings by CIK and form type, and `extract_executive_compensation` parses the compensation tables from proxy statements. It includes proper User-Agent headers and rate-limiting considerations.",
      dependencies: ["requests", "beautifulsoup4", "pandas", "lxml"],
    };
  }

  if (task.includes("test") || task.includes("React")) {
    return {
      language: "typescript",
      code: `import { renderHook, act } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { AuthProvider } from "./AuthProvider";

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });

  it("returns unauthenticated state initially", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("authenticates on login and persists token", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    await act(async () => {
      await result.current.login("test@example.com", "password");
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem("auth_token")).toBeTruthy();
  });

  it("clears state on logout", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    await act(async () => {
      await result.current.login("test@example.com", "password");
    });
    act(() => {
      result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
  });
});
`,
      explanation: "Comprehensive test suite for the `useAuth` hook covering initial state, successful login with token persistence, and logout cleanup. Uses React Testing Library's `renderHook` with the `AuthProvider` wrapper to ensure context availability.",
      dependencies: ["@testing-library/react", "jest", "@types/jest"],
    };
  }

  if (task.includes("sentiment")) {
    return {
      language: "python",
      code: `from transformers import pipeline
import pandas as pd
from typing import List, Tuple

class SentimentPipeline:
    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        self.classifier = pipeline(
            "sentiment-analysis",
            model=model_name,
            device=-1,  # CPU; set to 0 for GPU
        )

    def analyze_batch(self, texts: List[str]) -> pd.DataFrame:
        """Run sentiment analysis on a batch of texts."""
        results = self.classifier(texts, batch_size=32)
        df = pd.DataFrame({
            "text": texts,
            "label": [r["label"] for r in results],
            "score": [r["score"] for r in results],
        })
        return df

    def stream_analyze(self, texts: List[str]):
        """Generator yielding results one by one for streaming."""
        for text in texts:
            result = self.classifier(text)[0]
            yield {
                "text": text,
                "label": result["label"],
                "score": result["score"],
            }

# Usage
if __name__ == "__main__":
    pipe = SentimentPipeline()
    sample = [
        "The earnings beat expectations significantly.",
        "Revenue declined for the third consecutive quarter.",
    ]
    print(pipe.analyze_batch(sample))
`,
      explanation: "A reusable sentiment analysis pipeline class wrapping Hugging Face transformers. Supports both batch processing for datasets and streaming for real-time applications. Uses DistilBERT for efficiency with easy model swap.",
      dependencies: ["transformers", "torch", "pandas"],
    };
  }

  // Generic fallback
  return {
    language: "python",
    code: `# ${task}\n# Auto-generated solution\n\ndef solve():\n    pass\n`,
    explanation: "A stub implementation for the requested task. Please refine based on specific requirements.",
    dependencies: [],
  };
}

// ── synthesis responses ─────────────────────────────────────────────────────

export interface SynthesisResponse {
  markdown: string;
  inlineCitations: Array<{ position: number; sourceId: string }>;
  summary: string;
}

export function mockSynthesisResponse(objective: string): SynthesisResponse {
  const now = new Date().toISOString().split("T")[0];

  if (objective.includes("memo") || objective.includes("valuation")) {
    return {
      markdown: `## Executive Summary\n\nThis memo evaluates the comparative investment case across the lithium mining sector as of ${now}. The market is undergoing a structural repricing as supply growth from Argentina and Africa challenges incumbent Chilean-Australian dominance.\n\n## Key Findings\n\n1. **Albemarle** trades at 14x forward earnings with the most diversified asset base [^1]\n2. **SQM** offers the lowest cost curve but faces political risk from Chile's new royalty framework [^2]\n3. **Pilbara Minerals** is the purest EV-play but most volatile on spodumene pricing [^3]\n4. **Ganfeng/Tianqi** are investable only via Hong Kong listings with ADR complexity [^4]\n\n## Risk Factors\n\n- Lithium carbonate price decline from $32/kg to $14/kg has crushed unhedged producers\n- Chinese refining capacity overbuild may depress margins through 2026\n- IRA compliance rules create bifurcated market: US/EU eligible vs non-eligible\n\n## Recommendation\n\nInitiate positions in Albemarle and SQM on weakness. Avoid Australian juniors without offtake agreements.`,
      inlineCitations: [
        { position: 180, sourceId: uuid() },
        { position: 260, sourceId: uuid() },
        { position: 340, sourceId: uuid() },
        { position: 430, sourceId: uuid() },
      ],
      summary: "Lithium sector comparison: favor diversified incumbents (Albemarle, SQM), avoid unhedged juniors. Key risk is price overhang from Chinese refining overcapacity.",
    };
  }

  if (objective.includes("deck") || objective.includes("competitive")) {
    return {
      markdown: `## Competitive Landscape: AI Labs\n\n### Anthropic\n- **Model:** Claude Opus 4.7 / Sonnet 4.6\n- **Differentiator:** Constitutional AI, safety-first enterprise positioning\n- **Revenue:** ~$850M run-rate (est.)\n- **Valuation:** $18B (Series D, 2024)\n\n### OpenAI\n- **Model:** GPT-5.2 / GPT-5.1\n- **Differentiator:** Ecosystem breadth, ChatGPT consumer lock-in\n- **Revenue:** ~$3.4B run-rate (est.)\n- **Valuation:** $86B (tender offer, 2024)\n\n### Google DeepMind\n- **Model:** Gemini 2.5 Pro / Flash\n- **Differentiator:** Distribution via Workspace + Cloud, research pedigree\n- **Revenue:** Embedded in GCP (estimated $500M+ AI-specific)\n- **Valuation:** Internal; DeepMind burn ~$2B/year\n\n### Strategic Implications\nOpenAI leads on product velocity. Anthropic wins on trust/safety for regulated industries. Google has distribution but lacks standalone AI revenue clarity.`,
      inlineCitations: [
        { position: 120, sourceId: uuid() },
        { position: 300, sourceId: uuid() },
        { position: 480, sourceId: uuid() },
      ],
      summary: "AI labs competitive analysis: OpenAI leads revenue and product, Anthropic leads safety/enterprise trust, Google has unmatched distribution but unclear standalone AI monetization.",
    };
  }

  // Generic fallback
  return {
    markdown: `## Synthesis: ${objective}\n\nBased on the research and analysis conducted, the following conclusions are drawn:\n\n1. Primary findings support a cautious but constructive view on the subject matter [^1]\n2. Secondary data points to emerging risks that warrant monitoring [^2]\n3. The competitive landscape is evolving rapidly with new entrants challenging incumbents [^3]\n\n**Next Steps:**\n- Validate findings with primary sources\n- Monitor key metrics on a weekly basis\n- Re-evaluate thesis if macro conditions shift significantly`,
    inlineCitations: [
      { position: 100, sourceId: uuid() },
      { position: 200, sourceId: uuid() },
      { position: 300, sourceId: uuid() },
    ],
    summary: `Synthesized findings for "${objective}" with key conclusions and recommended next steps.`,
  };
}
