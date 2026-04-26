export interface DemoSpace {
  id: string;
  name: string;
  description: string;
  orgId: string;
  ownerId: string;
  memberIds: string[];
  workflowIds: string[];
  connectorIds: string[];
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const DEMO_SPACES: DemoSpace[] = [
  {
    id: "spc_acme_research",
    name: "Acme Account Research",
    description:
      "Deep-dive research workflows for portfolio companies and potential investments. Covers valuation, competitive analysis, and market sizing.",
    orgId: "org_acme_001",
    ownerId: "usr_7a3f9e2b1c4d",
    memberIds: ["usr_7a3f9e2b1c4d", "usr_b8e5d1a4f7c2"],
    workflowIds: ["wf_lithium_miners","wf_tesla_vs_byd","wf_regulatory_monitor","wf_pm_tools_compare","wf_series_b_memo"],
    connectorIds: ["conn_slack", "conn_salesforce", "conn_notion"],
    color: "#3B82F6",
    icon: "briefcase",
    createdAt: "2024-07-01T08:00:00Z",
    updatedAt: "2025-01-10T15:30:00Z",
  },
  {
    id: "spc_personal_investing",
    name: "Personal Investing",
    description:
      "Individual research and monitoring workflows for public equities, crypto, and macro trends. Private space for ad-hoc analysis.",
    orgId: "org_indie_002",
    ownerId: "usr_2f6c8d3e5b9a",
    memberIds: ["usr_2f6c8d3e5b9a"],
    workflowIds: ["wf_ipcc_summary","wf_bitcoin_onchain"],
    connectorIds: ["conn_gmail", "conn_drive"],
    color: "#10B981",
    icon: "trending-up",
    createdAt: "2024-09-25T10:00:00Z",
    updatedAt: "2025-01-12T09:15:00Z",
  },
  {
    id: "spc_engineering",
    name: "Engineering Projects",
    description:
      "Code generation, testing, and data pipeline workflows. Integrates with GitHub and internal tooling for automated development tasks.",
    orgId: "org_indie_002",
    ownerId: "usr_2f6c8d3e5b9a",
    memberIds: ["usr_2f6c8d3e5b9a"],
    workflowIds: ["wf_sec_scraper","wf_react_auth_tests","wf_csv_dedup","wf_linkedin_extract","wf_saas_dashboard","wf_sentiment_pipeline"],
    connectorIds: ["conn_github", "conn_slack", "conn_notion"],
    color: "#8B5CF6",
    icon: "code-2",
    createdAt: "2024-10-05T11:00:00Z",
    updatedAt: "2025-01-08T18:45:00Z",
  },
  {
    id: "spc_competitive_intel",
    name: "Competitive Intel",
    description:
      "Systematic competitive monitoring across AI labs, SaaS vendors, and emerging startups. Automated alerts on product launches and pricing changes.",
    orgId: "org_acme_001",
    ownerId: "usr_b8e5d1a4f7c2",
    memberIds: ["usr_7a3f9e2b1c4d", "usr_b8e5d1a4f7c2"],
    workflowIds: ["wf_anthropic_vs_openai","wf_quantum_funding","wf_pm_tools_compare"],
    connectorIds: ["conn_hubspot", "conn_slack", "conn_notion"],
    color: "#F59E0B",
    icon: "shield",
    createdAt: "2024-11-15T13:00:00Z",
    updatedAt: "2025-01-13T11:20:00Z",
  },
];

export function getSpaceById(id: string): DemoSpace | undefined {
  return DEMO_SPACES.find((s) => s.id === id);
}
