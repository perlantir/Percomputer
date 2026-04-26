export interface DemoUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: "admin" | "analyst" | "engineer";
  orgId: string;
  orgName: string;
  preferences: {
    defaultModel: string;
    theme: "light" | "dark" | "system";
    notifications: boolean;
    autoRun: boolean;
  };
  createdAt: string;
  lastActiveAt: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "usr_7a3f9e2b1c4d",
    email: "sarah.chen@acme-research.com",
    name: "Sarah Chen",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    role: "admin",
    orgId: "org_acme_001",
    orgName: "Acme Research Partners",
    preferences: {
      defaultModel: "claude-opus-4.7",
      theme: "dark",
      notifications: true,
      autoRun: false,
    },
    createdAt: "2024-06-12T09:00:00Z",
    lastActiveAt: "2025-01-15T13:45:00Z",
  },
  {
    id: "usr_b8e5d1a4f7c2",
    email: "marcus.johnson@acme-research.com",
    name: "Marcus Johnson",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    role: "analyst",
    orgId: "org_acme_001",
    orgName: "Acme Research Partners",
    preferences: {
      defaultModel: "claude-sonnet-4.6",
      theme: "system",
      notifications: true,
      autoRun: true,
    },
    createdAt: "2024-08-03T11:30:00Z",
    lastActiveAt: "2025-01-14T16:20:00Z",
  },
  {
    id: "usr_2f6c8d3e5b9a",
    email: "alex.patel@indie.dev",
    name: "Alex Patel",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    role: "engineer",
    orgId: "org_indie_002",
    orgName: "Indie Dev Collective",
    preferences: {
      defaultModel: "gpt-5.1",
      theme: "dark",
      notifications: false,
      autoRun: true,
    },
    createdAt: "2024-09-20T14:15:00Z",
    lastActiveAt: "2025-01-15T10:10:00Z",
  },
];

export function getUserById(id: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}

export function getUsersByOrg(orgId: string): DemoUser[] {
  return DEMO_USERS.filter((u) => u.orgId === orgId);
}
