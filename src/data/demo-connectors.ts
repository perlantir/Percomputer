export type ConnectorStatus = "connected" | "disconnected" | "error" | "pending" | "degraded";

export interface DemoConnector {
  id: string;
  name: string;
  provider: string;
  icon: string;
  status: ConnectorStatus;
  orgId: string;
  spaceIds: string[];
  connectedAt: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  config: Record<string, unknown>;
  scope: string[];
}

export const DEMO_CONNECTORS: DemoConnector[] = [
  {
    id: "conn_gmail",
    name: "Gmail",
    provider: "google",
    icon: "mail",
    status: "connected",
    orgId: "org_indie_002",
    spaceIds: ["spc_personal_investing"],
    connectedAt: "2024-09-22T10:00:00Z",
    lastSyncedAt: "2025-01-15T12:00:00Z",
    lastError: null,
    config: { readOnly: true, label: "INBOX", maxResults: 100 },
    scope: ["read:emails", "read:labels"],
  },
  {
    id: "conn_drive",
    name: "Google Drive",
    provider: "google",
    icon: "hard-drive",
    status: "connected",
    orgId: "org_indie_002",
    spaceIds: ["spc_personal_investing"],
    connectedAt: "2024-09-22T10:05:00Z",
    lastSyncedAt: "2025-01-15T11:30:00Z",
    lastError: null,
    config: { folders: ["Research", "Reports"], recursive: true },
    scope: ["read:files", "read:metadata"],
  },
  {
    id: "conn_slack",
    name: "Slack",
    provider: "slack",
    icon: "message-square",
    status: "connected",
    orgId: "org_acme_001",
    spaceIds: ["spc_acme_research", "spc_competitive_intel", "spc_engineering"],
    connectedAt: "2024-07-03T09:00:00Z",
    lastSyncedAt: "2025-01-15T13:00:00Z",
    lastError: null,
    config: { channels: ["#research", "#alerts", "#engineering"], botName: "AgentBot" },
    scope: ["read:channels", "write:messages", "read:users"],
  },
  {
    id: "conn_github",
    name: "GitHub",
    provider: "github",
    icon: "github",
    status: "connected",
    orgId: "org_indie_002",
    spaceIds: ["spc_engineering"],
    connectedAt: "2024-10-06T14:00:00Z",
    lastSyncedAt: "2025-01-14T16:00:00Z",
    lastError: null,
    config: { repos: ["alexpatel/saas-dashboard", "alexpatel/sec-scraper"], webhookEnabled: true },
    scope: ["read:repos", "read:issues", "write:commits"],
  },
  {
    id: "conn_notion",
    name: "Notion",
    provider: "notion",
    icon: "file-text",
    status: "degraded",
    orgId: "org_acme_001",
    spaceIds: ["spc_acme_research", "spc_competitive_intel", "spc_engineering"],
    connectedAt: "2024-07-10T11:00:00Z",
    lastSyncedAt: "2025-01-13T09:00:00Z",
    lastError: "Rate limit exceeded (429). Backing off for 60s.",
    config: { databases: ["Research DB", "Competitors DB"], autoExport: true },
    scope: ["read:pages", "write:pages", "read:databases"],
  },
  {
    id: "conn_salesforce",
    name: "Salesforce",
    provider: "salesforce",
    icon: "cloud",
    status: "connected",
    orgId: "org_acme_001",
    spaceIds: ["spc_acme_research"],
    connectedAt: "2024-08-15T10:00:00Z",
    lastSyncedAt: "2025-01-15T08:00:00Z",
    lastError: null,
    config: { objects: ["Account", "Opportunity", "Contact"], sandbox: false },
    scope: ["read:accounts", "read:opportunities", "read:contacts"],
  },
  {
    id: "conn_hubspot",
    name: "HubSpot",
    provider: "hubspot",
    icon: "target",
    status: "error",
    orgId: "org_acme_001",
    spaceIds: ["spc_competitive_intel"],
    connectedAt: "2024-11-20T13:00:00Z",
    lastSyncedAt: "2025-01-10T07:00:00Z",
    lastError: "OAuth token expired. Re-authorization required.",
    config: { pipelines: ["Sales Pipeline"], syncDeals: true },
    scope: ["read:contacts", "read:deals", "read:companies"],
  },
  {
    id: "conn_snowflake",
    name: "Snowflake",
    provider: "snowflake",
    icon: "database",
    status: "pending",
    orgId: "org_acme_001",
    spaceIds: ["spc_acme_research"],
    connectedAt: null,
    lastSyncedAt: null,
    lastError: null,
    config: { warehouse: "COMPUTE_WH", database: "RESEARCH_DB", schema: "PUBLIC" },
    scope: ["read:tables", "write:tables", "read:views"],
  },
];

export function getConnectorById(id: string): DemoConnector | undefined {
  return DEMO_CONNECTORS.find((c) => c.id === id);
}

export function getConnectorsByOrg(orgId: string): DemoConnector[] {
  return DEMO_CONNECTORS.filter((c) => c.orgId === orgId);
}
