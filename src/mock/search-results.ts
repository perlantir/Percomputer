export interface MockSearchResult {
  title: string;
  url: string;
  domain: string;
  excerpt: string;
  publishedAt: string;
  author?: string;
}

export interface MockSearchResponse {
  query: string;
  totalResults: number;
  results: MockSearchResult[];
}

const MOCK_SEARCH_DB: Record<string, MockSearchResult[]> = {
  "lithium miners": [
    {
      title: "Top 10 Lithium Mining Companies by Market Cap in 2024",
      url: "https://www.investingnews.com/lithium-mining-companies/",
      domain: "investingnews.com",
      excerpt: "Albemarle, SQM, and Ganfeng Lithium lead the global lithium mining market. Australian hard-rock miners are gaining share as Chinese brine producers face environmental scrutiny.",
      publishedAt: "2024-11-15",
      author: "Melissa Pistilli",
    },
    {
      title: "Lithium supply crunch: Can miners keep up with EV demand?",
      url: "https://www.ft.com/content/lithium-supply-ev-demand",
      domain: "ft.com",
      excerpt: "The International Energy Agency projects a 40-fold increase in lithium demand by 2040. Current mine development timelines of 5-7 years create a structural deficit through 2028.",
      publishedAt: "2024-10-22",
      author: "Lex Column",
    },
    {
      title: "Albemarle cuts 2024 guidance as lithium prices plunge",
      url: "https://www.reuters.com/business/energy/albemarle-cuts-guidance-2024/",
      domain: "reuters.com",
      excerpt: "Albemarle Corp cut its full-year adjusted profit forecast by 15% on Wednesday, citing weaker-than-expected lithium prices and slower EV adoption in Western markets.",
      publishedAt: "2024-09-18",
    },
    {
      title: "Pilbara Minerals quarterly production report Q3 2024",
      url: "https://www.pilbaraminerals.com.au/investors/asx-announcements",
      domain: "pilbaraminerals.com.au",
      excerpt: "Pilbara Minerals produced 179,000 dry metric tonnes of spodumene concentrate in Q3, up 8% QoQ. Unit operating costs fell to $396/t, maintaining cost curve position.",
      publishedAt: "2024-10-10",
    },
    {
      title: "SQM faces new royalty dispute with Chilean government",
      url: "https://www.bloomberg.com/news/articles/sqm-chile-royalty",
      domain: "bloomberg.com",
      excerpt: "Chile's CORFO is seeking to renegotiate SQM's lithium contract, potentially increasing royalties from 6.8% to 11%. The dispute threatens SQM's cost advantage.",
      publishedAt: "2024-08-30",
      author: "Ana Lankes",
    },
  ],
  "Tesla earnings Q3 2024": [
    {
      title: "Tesla Q3 2024 earnings: Revenue misses, margins beat",
      url: "https://ir.tesla.com/press-release/tesla-q3-2024",
      domain: "ir.tesla.com",
      excerpt: "Tesla reported Q3 revenue of $25.18 billion vs $25.37B consensus. Automotive gross margin improved to 19.7% from 18.5% in Q2, driven by cost reductions in 4680 cell production.",
      publishedAt: "2024-10-23",
    },
    {
      title: "Tesla's energy business is the hidden growth story",
      url: "https://www.benzinga.com/analyst-ratings/tesla-energy",
      domain: "benzinga.com",
      excerpt: "Tesla Energy generation and storage revenue grew 52% YoY to $2.38B. Megapack deployments reached 6.9 GWh in Q3. The segment could be 20% of revenue by 2026.",
      publishedAt: "2024-10-24",
      author: "Wedbush Securities",
    },
    {
      title: "BYD Q3 2024: Revenue surges past Tesla in USD terms",
      url: "https://www.reuters.com/business/autos-transportation/byd-q3-2024/",
      domain: "reuters.com",
      excerpt: "BYD reported revenue of 201.1 billion yuan ($28.25B) in Q3, surpassing Tesla's $25.18B for the first time. Net profit rose 11.5% to 11.6 billion yuan.",
      publishedAt: "2024-10-30",
    },
    {
      title: "Tesla Cybertruck production hits 2,500/week milestone",
      url: "https://www.cnbc.com/2024/10/25/tesla-cybertruck-production.html",
      domain: "cnbc.com",
      excerpt: "Tesla confirmed Cybertruck production reached 2,500 units per week at Gigafactory Texas. The company maintains a target of 250,000 annual run-rate by mid-2025.",
      publishedAt: "2024-10-25",
      author: "Lora Kolodny",
    },
  ],
  "quantum computing funding": [
    {
      title: "PsiQuantum raises $940M Series D at $3.15B valuation",
      url: "https://techcrunch.com/2024/09/10/psiquantum-series-d/",
      domain: "techcrunch.com",
      excerpt: "PsiQuantum closed a $940M Series D led by Baillie Gifford and Qatar Investment Authority. The company aims to build a utility-scale quantum computer using photonic qubits.",
      publishedAt: "2024-09-10",
      author: "Ingrid Lunden",
    },
    {
      title: "IonQ reports Q3 2024 earnings: Revenue up 90% YoY",
      url: "https://investors.ionq.com/news-releases",
      domain: "ionq.com",
      excerpt: "IonQ reported Q3 revenue of $12.4M, up 90% YoY. The company secured contracts with the U.S. Air Force and Airbus. Bookings reached $24.8M in the quarter.",
      publishedAt: "2024-11-07",
    },
    {
      title: "Quantum computing winter? Funding drops 48% in 2024",
      url: "https://www.nature.com/articles/quantum-funding-2024",
      domain: "nature.com",
      excerpt: "Global quantum computing VC funding fell to $1.2B in 2024 from $2.3B in 2022. Hardware companies bore the brunt; quantum software and applications saw modest increases.",
      publishedAt: "2024-12-01",
      author: "Davide Castelvecchi",
    },
    {
      title: "Rigetti announces $50M strategic investment from Microsoft",
      url: "https://www.rigetti.com/news/rigetti-microsoft-partnership",
      domain: "rigetti.com",
      excerpt: "Rigetti Computing announced a $50M investment from Microsoft as part of a quantum cloud partnership. The company will integrate its QPU into Azure Quantum.",
      publishedAt: "2024-08-15",
    },
  ],
  "Bitcoin on-chain metrics": [
    {
      title: "Bitcoin exchange flows turn negative as holders accumulate",
      url: "https://glassnode.com/insights/bitcoin-exchange-flows-dec-2024",
      domain: "glassnode.com",
      excerpt: "Net exchange outflows reached -45,000 BTC in the final week of December 2024. Long-term holder supply increased to 14.82M BTC, representing 78.2% of circulating supply.",
      publishedAt: "2024-12-28",
    },
    {
      title: "Bitcoin 200-week moving average analysis",
      url: "https://coinmetrics.io/bitcoin-200w-ma/",
      domain: "coinmetrics.io",
      excerpt: "The 200-week moving average sits at $28,412, a historically significant support level. Only twice in history has BTC traded below this average for extended periods.",
      publishedAt: "2024-12-20",
    },
    {
      title: "Miner capitulation signals flash as difficulty adjusts",
      url: "https://www.coingecko.com/learn/bitcoin-miner-capitulation",
      domain: "coingecko.com",
      excerpt: "Hashrate declined 12% from all-time highs as unprofitable miners shut down rigs. The next difficulty adjustment is expected to decrease by 8-10%, easing pressure.",
      publishedAt: "2024-12-15",
    },
    {
      title: "Bitcoin ETF inflows accelerate: BlackRock IBIT leads",
      url: "https://www.bloomberg.com/news/articles/bitcoin-etf-flows-2024",
      domain: "bloomberg.com",
      excerpt: "U.S. spot Bitcoin ETFs saw $2.1B in net inflows during December 2024. BlackRock's IBIT led with $1.4B, bringing total AUM to $52B across all spot ETFs.",
      publishedAt: "2024-12-30",
      author: "Vildana Hajric",
    },
  ],
  "project management tools": [
    {
      title: "Best Project Management Software 2024: G2 Grid Report",
      url: "https://www.g2.com/categories/project-management",
      domain: "g2.com",
      excerpt: "Asana, Monday.com, and Jira lead the G2 Grid for project management. ClickUp and Notion are gaining traction among smaller teams seeking all-in-one solutions.",
      publishedAt: "2024-11-01",
    },
    {
      title: "Asana vs Monday.com: Enterprise comparison",
      url: "https://www.capterra.com/project-management-software/",
      domain: "capterra.com",
      excerpt: "Asana scores higher on ease of use (4.5/5) while Monday.com leads on customization (4.4/5). Enterprise pricing: Asana $24.99/user, Monday $27/user at scale.",
      publishedAt: "2024-10-15",
    },
    {
      title: "Jira remains the developer tool of choice at scale",
      url: "https://stackoverflow.com/insights/jira-usage-2024",
      domain: "stackoverflow.com",
      excerpt: "78% of engineering teams with 50+ developers use Jira as primary project tracker. Integration with Bitbucket/GitHub and CI/CD pipelines is the primary differentiator.",
      publishedAt: "2024-09-20",
    },
    {
      title: "Notion's project management features: A deep dive",
      url: "https://www.notion.so/blog/project-management-features",
      domain: "notion.so",
      excerpt: "Notion rolled out native Gantt charts and dependencies in 2024. The docs+tasks hybrid appeals to knowledge workers but lacks dedicated resource management.",
      publishedAt: "2024-08-01",
    },
  ],
  "IPCC climate report": [
    {
      title: "IPCC AR6 Synthesis Report: Climate Change 2023",
      url: "https://www.ipcc.ch/report/ar6/syr/",
      domain: "ipcc.ch",
      excerpt: "The Synthesis Report confirms that human activities have unequivocally caused global warming. Current policies put the world on track for 2.5-2.9C warming by 2100.",
      publishedAt: "2023-03-20",
    },
    {
      title: "Key takeaways from IPCC AR6 for institutional investors",
      url: "https://www.msci.com/ipcc-ar6-investor-guide",
      domain: "msci.com",
      excerpt: "Investors should focus on: (1) physical risk exposure in real assets, (2) transition risk in carbon-intensive sectors, (3) litigation risk for fiduciary duty.",
      publishedAt: "2024-04-10",
    },
    {
      title: "Carbon budget update: 400 GtCO2 remaining for 1.5C",
      url: "https://www.carbonbrief.org/ipcc-carbon-budget-explainer",
      domain: "carbonbrief.org",
      excerpt: "The IPCC estimates ~400 GtCO2 of remaining carbon budget for a 50% chance of limiting warming to 1.5C. At current emissions (~40 GtCO2/year), this gives roughly 10 years.",
      publishedAt: "2024-06-15",
    },
  ],
  "SaaS metrics dashboard": [
    {
      title: "The 5 SaaS metrics that actually matter to VCs",
      url: "https://www.bessemervc.com/saas-metrics",
      domain: "bessemervc.com",
      excerpt: "Net Revenue Retention, CAC Payback Period, Gross Margin, Logo Churn, and Expansion ARR are the five metrics VCs weight most heavily in Series A-C decisions.",
      publishedAt: "2024-07-20",
    },
    {
      title: "D3.js performance optimization for large datasets",
      url: "https://observablehq.com/@d3/performance-tips",
      domain: "observablehq.com",
      excerpt: "For datasets >2,000 points, switch from SVG to Canvas rendering. Use d3.quadtree for spatial indexing and throttle resize handlers with requestAnimationFrame.",
      publishedAt: "2024-05-01",
    },
  ],
  "sentiment analysis pipeline": [
    {
      title: "FinBERT: Financial sentiment analysis with BERT",
      url: "https://arxiv.org/abs/1908.10063",
      domain: "arxiv.org",
      excerpt: "FinBERT achieves 86.5% F1 on FiQA sentiment tasks vs 74.2% for general BERT. Domain-specific pretraining on financial corpora yields significant gains.",
      publishedAt: "2019-08-27",
      author: "Dogu Araci",
    },
    {
      title: "Hugging Face Sentiment Analysis Pipeline Tutorial",
      url: "https://huggingface.co/docs/transformers/tasks/sentiment_analysis",
      domain: "huggingface.co",
      excerpt: "The pipeline API abstracts tokenization, model inference, and post-processing. For production, use the ONNX export path for 3x latency improvement.",
      publishedAt: "2024-01-15",
    },
  ],
  "SEC filings executive compensation": [
    {
      title: "SEC EDGAR Full-Text Search API Documentation",
      url: "https://www.sec.gov/edgar/sec-apis.htm",
      domain: "sec.gov",
      excerpt: "The Full-Text Search API supports Boolean queries across all EDGAR filings since 1994. Rate limit: 10 requests/second per IP. No authentication required.",
      publishedAt: "2024-01-01",
    },
    {
      title: "How to parse DEF 14A proxy statements for compensation data",
      url: "https://github.com/jadencooper/sec-compensation-parser",
      domain: "github.com",
      excerpt: "This repo demonstrates parsing Summary Compensation Tables from DEF 14A filings using BeautifulSoup and regex. Supports 2010-2024 filing formats.",
      publishedAt: "2024-03-10",
    },
  ],
};

export function mockSearch(query: string): MockSearchResponse {
  const normalized = query.toLowerCase();
  const key = Object.keys(MOCK_SEARCH_DB).find((k) =>
    normalized.includes(k.toLowerCase())
  );

  const results = key ? MOCK_SEARCH_DB[key] : [
    {
      title: `Search results for "${query}"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      domain: "google.com",
      excerpt: "No specific mock results available for this query. Showing generic placeholder.",
      publishedAt: "2024-12-01",
    },
  ];

  return {
    query,
    totalResults: results.length * 12 + Math.floor(Math.random() * 50),
    results,
  };
}

export function allMockQueries(): string[] {
  return Object.keys(MOCK_SEARCH_DB);
}
