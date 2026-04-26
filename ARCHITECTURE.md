# Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Layer](#data-layer)
5. [State Management](#state-management)
6. [Design System](#design-system)
7. [Multi-Model Orchestration](#multi-model-orchestration)
8. [Security Model](#security-model)
9. [Performance Strategy](#performance-strategy)

---

## System Overview

The Multi-Model Agent Platform is a full-stack application built on a modern, layered architecture. It separates concerns across the client, API gateway, service, and data layers to maximize maintainability, testability, and scalability.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │  Next.js App    │  │   Zustand       │  │   TanStack Query            │    │
│  │  Router (RSC)   │  │   Client Stores │  │   Server State Cache        │    │
│  │                 │  │                 │  │                             │    │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌─────────────────────┐  │    │
│  │  │  Server   │  │  │  │  Chat     │  │  │  │  Query Client       │  │    │
│  │  │ Components│  │  │  │  Store    │  │  │  │  (Devtools-enabled) │  │    │
│  │  │  (RSC)    │  │  │  │           │  │  │  │                     │  │    │
│  │  └───────────┘  │  │  └───────────┘  │  │  └─────────────────────┘  │    │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌─────────────────────┐  │    │
│  │  │  Client   │  │  │  │  Workflow │  │  │  │  Mutation Cache     │  │    │
│  │  │ Components│  │  │  │  Store    │  │  │  │  (Optimistic Updates)│  │    │
│  │  │  (RCC)    │  │  │  └───────────┘  │  │  └─────────────────────┘  │    │
│  │  └───────────┘  │  │  ┌───────────┐  │  │  ┌─────────────────────┐  │    │
│  │                 │  │  │  Console  │  │  │  │  Infinite Queries   │  │    │
│  │  ┌───────────┐  │  │  │  Store    │  │  │  │  (Paginated Lists)  │  │    │
│  │  │  React    │  │  │  └───────────┘  │  │  └─────────────────────┘  │    │
│  │  │  Flow     │  │  └─────────────────┘  └─────────────────────────────┘    │
│  │  │  Canvas   │  │                                                          │
│  │  └───────────┘  │                                                          │
│  └─────────────────┘                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                 API GATEWAY                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │  Next.js API    │  │   Zod           │  │   Middleware Pipeline       │    │
│  │  Route Handlers │  │   Validation    │  │                             │    │
│  │                 │  │                 │  │  1. CORS                    │    │
│  │  /api/chat/*    │  │  Request Schema │  │  2. Rate Limiting           │    │
│  │  /api/workflows │  │  Response Schema│  │  3. Authentication          │    │
│  │  /api/agents/*  │  │                 │  │  4. Authorization (RBAC)    │    │
│  │  /api/models/*  │  │                 │  │  5. Request Logging         │    │
│  │  /api/sse/*     │  │                 │  │  6. Error Handling          │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                               SERVICE LAYER                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │   Chat Service  │  │  Workflow       │  │   Agent Orchestrator        │    │
│  │                 │  │  Engine         │  │                             │    │
│  │  - Thread mgmt  │  │                 │  │  - Model Router             │    │
│  │  - Message CRUD │  │  - Graph exec   │  │  - Provider Abstraction     │    │
│  │  - Context mgmt │  │  - Node types   │  │  - Tool Dispatcher          │    │
│  │  - Streaming    │  │  - Edge routing   │  │  - Response Aggregator      │    │
│  │                 │  │  - State machine  │  │  - Fallback Chain           │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │   Model Service │  │  Tool Registry  │  │   Analytics Service         │    │
│  │                 │  │                 │  │                             │    │
│  │  - Cost tracking│  │  - Web Search   │  │  - Token usage              │    │
│  │  - Latency logs │  │  - Code Exec    │  │  - Latency metrics          │    │
│  │  - Quality score│  │  - File Ops     │  │  - Error rates              │    │
│  │  - Routing rules│  │  - API Calls    │  │  - Cost attribution         │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                              DATA & AI LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │   PostgreSQL    │  │   Redis         │  │   AI Provider SDKs          │    │
│  │   (Prisma ORM)  │  │   (Cache/Queue) │  │                             │    │
│  │                 │  │                 │  │  ┌─────────────────────┐    │    │
│  │  - Users        │  │  - Sessions     │  │  │  OpenAI SDK         │    │    │
│  │  - Organizations│  │  - Rate limits  │  │  │  Anthropic SDK      │    │    │
│  │  - Threads      │  │  - SSE streams  │  │  │  Google AI SDK      │    │    │
│  │  - Messages     │  │  - Job queues   │  │  │  Ollama SDK         │    │    │
│  │  - Workflows    │  │  - Pub/sub      │  │  │  Vercel AI SDK      │    │    │
│  │  - Agents       │  │                 │  │  └─────────────────────┘    │    │
│  │  - Audit Logs   │  │                 │  │                             │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Request
    |
    v
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Next.js   │ -> │  Middleware │ -> │ API Route   │
│   Router    │    │  (Auth/Rate)│    │ Handler     │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                              |
                                              v
                                    ┌─────────────┐
                                    │   Zod       │
                                    │ Validation  │
                                    └──────┬──────┘
                                           |
                                           v
                              ┌────────────────────────┐
                              │    Service Layer       │
                              │  (Business Logic)      │
                              └───────────┬────────────┘
                                          |
                    ┌─────────────────────┼─────────────────────┐
                    |                     |                     |
                    v                     v                     v
              ┌─────────┐          ┌─────────┐          ┌─────────┐
              │ Prisma  │          │  Redis  │          │ AI SDK  │
              │(PostgreSQL)       │ (Cache) │          │(Models) │
              └─────────┘          └─────────┘          └─────────┘
```

---

## Frontend Architecture

### Next.js 15 App Router

The application uses Next.js 15 with the App Router architecture, leveraging React Server Components (RSC) as the default and Client Components only where interactivity is required.

#### Route Groups

```
app/
├── (marketing)/              # Public marketing pages
│   ├── page.tsx              # Landing page
│   ├── pricing/
│   └── features/
│
├── (dashboard)/              # Authenticated app pages
│   ├── chat/
│   │   ├── page.tsx            # Chat interface
│   │   └── [threadId]/
│   ├── workflows/
│   │   ├── page.tsx            # Workflow list
│   │   └── [workflowId]/
│   │       └── page.tsx        # Workflow builder
│   ├── console/
│   │   └── page.tsx            # Execution console
│   ├── agents/
│   │   ├── page.tsx            # Agent marketplace
│   │   └── studio/
│   └── settings/
│       ├── profile/
│       ├── organization/
│       └── billing/
│
├── api/                      # API route handlers
│   ├── chat/
│   ├── workflows/
│   ├── agents/
│   └── sse/
│
├── layout.tsx                # Root layout
├── page.tsx                  # Root redirect / landing
├── loading.tsx               # Global loading UI
├── error.tsx                 # Global error boundary
└── globals.css               # CSS variables & Tailwind
```

#### Server vs Client Components Strategy

| Layer | Component Type | Responsibility |
|-------|---------------|--------------|
| Data fetching | Server Component | Fetch initial data via Prisma, pass as props |
| Layout shell | Server Component | Render static layout, navigation |
| Forms | Client Component | Handle input state, validation, submission |
| Interactive UI | Client Component | Real-time updates, drag-and-drop, canvas |
| Charts | Client Component | Client-side rendering with Recharts |
| Lists with pagination | Mixed | Server fetch + Client infinite scroll |

### Component Hierarchy

```
RootLayout
├── Providers (TanStack Query, Theme, Auth)
│   ├── DashboardLayout
│   │   ├── Sidebar (Server Component)
│   │   │   ├── OrganizationSwitcher
│   │   │   ├── NavigationLinks
│   │   │   └── UserProfile
│   │   ├── Header (Client Component)
│   │   │   ├── Breadcrumbs
│   │   │   ├── SearchCommand
│   │   │   └── Notifications
│   │   └── Main Content Area
│   │       ├── ChatPage
│   │       │   ├── ThreadList (TanStack Query)
│   │       │   ├── MessageList (Virtualized)
│   │       │   │   ├── MessageBubble
│   │       │   │   │   ├── Avatar
│   │       │   │   │   ├── ContentRenderer
│   │       │   │   │   └── ActionBar
│   │       │   │   └── TypingIndicator
│   │       │   └── Composer (Client)
│   │       │       ├── TextArea
│   │       │       ├── ModelSelector
│   │       │       ├── ToolToggles
│   │       │       └── SendButton
│   │       ├── WorkflowPage
│   │       │   ├── WorkflowList
│   │       │   └── WorkflowBuilder (Client)
│   │       │       ├── ReactFlowCanvas
│   │       │       ├── NodePalette
│   │       │       ├── PropertyPanel
│   │       │       └── ExecutionPanel
│   │       └── ConsolePage
│   │           ├── LogStream (SSE)
│   │           ├── MetricsPanel
│   │           └── TimelineView
```

### Data Fetching Patterns

#### Server Component Fetching

```tsx
// app/(dashboard)/chat/page.tsx
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage() {
  // Fetch initial data on the server
  const threads = await prisma.thread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  // Pass to client component for interactivity
  return <ChatInterface initialThreads={threads} />;
}
```

#### Client Component with TanStack Query

```tsx
// components/chat/thread-list.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function ThreadList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const res = await fetch("/api/threads");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  if (isLoading) return <ThreadListSkeleton />;
  if (error) return <ThreadListError error={error} />;

  return <ThreadListItems threads={data.threads} />;
}
```

---

## Backend Architecture

### API Route Structure

API routes follow a resource-based RESTful design with additional streaming endpoints for real-time features.

```
api/
├── chat/
│   ├── route.ts              # GET /api/chat (list threads)
│   ├── [threadId]/
│   │   ├── route.ts          # GET/POST/DELETE thread
│   │   └── messages/
│   │       └── route.ts      # POST message, GET stream
│   └── stream/
│       └── route.ts          # POST /api/chat/stream (SSE)
├── workflows/
│   ├── route.ts              # GET/POST workflows
│   ├── [workflowId]/
│   │   ├── route.ts          # GET/PUT/DELETE workflow
│   │   └── execute/
│   │       └── route.ts      # POST execute workflow
│   └── templates/
│       └── route.ts          # GET workflow templates
├── agents/
│   ├── route.ts              # GET/POST agents
│   ├── [agentId]/
│   │   └── route.ts          # GET/PUT/DELETE agent
│   └── marketplace/
│       └── route.ts          # GET marketplace agents
├── models/
│   ├── route.ts              # GET available models
│   └── [modelId]/
│       └── route.ts          # GET model details
├── sse/
│   ├── console/
│   │   └── route.ts          # GET /api/sse/console (SSE stream)
│   └── workflows/
│       └── route.ts          # GET /api/sse/workflows (execution stream)
└── auth/
    └── [...nextauth]/
        └── route.ts          # NextAuth.js handlers
```

### Service Layer

Business logic is encapsulated in service modules to keep route handlers thin and testable.

```
lib/
├── services/
│   ├── chat-service.ts       # Thread & message operations
│   ├── workflow-service.ts   # Workflow CRUD & execution
│   ├── agent-service.ts      # Agent management
│   ├── model-service.ts      # Model routing & cost tracking
│   ├── tool-service.ts       # Tool execution & registry
│   └── analytics-service.ts  # Metrics & usage tracking
```

#### Example Service Pattern

```typescript
// lib/services/chat-service.ts
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateThreadSchema = z.object({
  title: z.string().min(1).max(200),
  modelId: z.string(),
  systemPrompt: z.string().optional(),
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;

export async function createThread(
  userId: string,
  input: CreateThreadInput
) {
  const validated = CreateThreadSchema.parse(input);

  const thread = await prisma.thread.create({
    data: {
      ...validated,
      userId,
    },
  });

  return thread;
}
```

### Middleware Pipeline

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. CORS headers
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");

  // 2. Rate limiting (Redis-based)
  const rateLimitResult = await checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // 3. Authentication
  const token = request.headers.get("authorization");
  if (!token && isProtectedRoute(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 4. Add rate limit headers
  response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining);

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
```

---

## Data Layer

### Prisma Schema

The database schema is designed around the core entities: Users, Organizations, Threads, Messages, Workflows, Agents, and Models.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  avatarUrl     String?
  role          UserRole       @default(USER)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  threads       Thread[]
  organizations Organization[]
  workflows     Workflow[]
  agents        Agent[]
  auditLogs     AuditLog[]
}

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  plan        Plan     @default(FREE)
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  users       User[]
  threads     Thread[]
  workflows   Workflow[]
  agents      Agent[]
}

model Thread {
  id          String    @id @default(cuid())
  title       String
  modelId     String
  systemPrompt String?
  status      ThreadStatus @default(ACTIVE)
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  orgId       String?
  organization Organization? @relation(fields: [orgId], references: [id])
  messages    Message[]
}

model Message {
  id        String   @id @default(cuid())
  role      MessageRole
  content   String   @db.Text
  modelId   String?
  tokens    Int?
  latency   Int?     // milliseconds
  cost      Float?   // USD
  metadata  Json?
  createdAt DateTime @default(now())
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  toolCalls ToolCall[]
}

model ToolCall {
  id        String   @id @default(cuid())
  name      String
  arguments Json
  result    Json?
  status    ToolStatus @default(PENDING)
  latency   Int?
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

model Workflow {
  id          String   @id @default(cuid())
  name        String
  description String?
  nodes       Json     // React Flow node definitions
  edges       Json     // React Flow edge definitions
  settings    Json?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  orgId       String?
  organization Organization? @relation(fields: [orgId], references: [id])
  executions  WorkflowExecution[]
}

model WorkflowExecution {
  id          String   @id @default(cuid())
  status      ExecutionStatus @default(PENDING)
  input       Json?
  output      Json?
  logs        Json?
  duration    Int?     // milliseconds
  createdAt   DateTime @default(now())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
}

model Agent {
  id            String   @id @default(cuid())
  name          String
  description   String?
  systemPrompt  String   @db.Text
  modelId       String
  tools         String[] // tool IDs
  memoryConfig  Json?
  isPublic      Boolean  @default(false)
  marketplaceId String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  orgId         String?
  organization  Organization? @relation(fields: [orgId], references: [id])
}

model ModelConfig {
  id          String   @id @default(cuid())
  provider    String   // openai, anthropic, google, ollama
  modelId     String   // gpt-4, claude-3-5-sonnet, etc.
  name        String
  description String?
  maxTokens   Int
  contextWindow Int
  costPer1KInput  Float
  costPer1KOutput Float
  isEnabled   Boolean  @default(true)
  capabilities String[] // text, vision, function_calling, json_mode
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(cuid())
  action      String
  resource    String
  resourceId  String?
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
}

enum UserRole {
  USER
  ADMIN
  OWNER
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum ThreadStatus {
  ACTIVE
  ARCHIVED
  DELETED
}

enum MessageRole {
  SYSTEM
  USER
  ASSISTANT
  TOOL
}

enum ToolStatus {
  PENDING
  RUNNING
  SUCCESS
  ERROR
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

### TypeScript Types

Shared types are generated from the Prisma schema and extended for API contracts.

```typescript
// types/index.ts
import type { Prisma } from "@prisma/client";

// Re-export Prisma types
export type {
  User,
  Thread,
  Message,
  Workflow,
  Agent,
  ModelConfig,
} from "@prisma/client";

// Extended API types
export interface ThreadWithMessages extends Thread {
  messages: Message[];
}

export interface WorkflowWithExecutions extends Workflow {
  executions: WorkflowExecution[];
}

export interface ModelWithScore extends ModelConfig {
  qualityScore: number;
  avgLatency: number;
  reliability: number;
}

// Streaming event types
export interface StreamEvent {
  type: "token" | "tool_call" | "error" | "done";
  data: unknown;
  timestamp: number;
}
```

### Mock Data Layer

A comprehensive mock data system enables offline development and testing.

```typescript
// lib/mock-data.ts
export const mockThreads: Thread[] = [
  {
    id: "thread_001",
    title: "API Design Discussion",
    modelId: "gpt-4",
    status: "ACTIVE",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-16"),
    userId: "user_001",
    orgId: null,
  },
  // ...
];

export const mockMessages: Message[] = [
  {
    id: "msg_001",
    role: "USER",
    content: "Help me design a REST API for a task manager",
    modelId: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    threadId: "thread_001",
  },
  // ...
];

export const mockModels: ModelConfig[] = [
  {
    id: "model_001",
    provider: "openai",
    modelId: "gpt-4",
    name: "GPT-4",
    maxTokens: 8192,
    contextWindow: 8192,
    costPer1KInput: 0.03,
    costPer1KOutput: 0.06,
    isEnabled: true,
    capabilities: ["text", "vision", "function_calling"],
  },
  // ...
];
```

---

## State Management

### Zustand (Client State)

Zustand stores manage UI state that doesn't need server synchronization.

#### Chat Store

```typescript
// lib/zustand/chat-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ChatState {
  // State
  activeThreadId: string | null;
  selectedModelId: string;
  isStreaming: boolean;
  composerText: string;
  selectedTools: string[];
  sidebarOpen: boolean;

  // Actions
  setActiveThread: (id: string | null) => void;
  setSelectedModel: (id: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setComposerText: (text: string) => void;
  toggleTool: (toolId: string) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

const initialState = {
  activeThreadId: null,
  selectedModelId: "gpt-4",
  isStreaming: false,
  composerText: "",
  selectedTools: [],
  sidebarOpen: true,
};

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      ...initialState,

      setActiveThread: (id) => set({ activeThreadId: id }),
      setSelectedModel: (id) => set({ selectedModelId: id }),
      setIsStreaming: (streaming) => set({ isStreaming: streaming }),
      setComposerText: (text) => set({ composerText: text }),
      toggleTool: (toolId) =>
        set((state) => ({
          selectedTools: state.selectedTools.includes(toolId)
            ? state.selectedTools.filter((t) => t !== toolId)
            : [...state.selectedTools, toolId],
        })),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      reset: () => set(initialState),
    }),
    { name: "chat-store" }
  )
);
```

#### Workflow Store

```typescript
// lib/zustand/workflow-store.ts
import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  isExecuting: boolean;
  executionLogs: ExecutionLog[];

  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node | null) => void;
  setIsExecuting: (executing: boolean) => void;
  addExecutionLog: (log: ExecutionLog) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  isExecuting: false,
  executionLogs: [],

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...data } : n
      ),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter(
        (e) => e.source !== id && e.target !== id
      ),
    })),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  addExecutionLog: (log) =>
    set((state) => ({
      executionLogs: [...state.executionLogs, log],
    })),
}));
```

### TanStack Query (Server State)

TanStack Query handles all server state with caching, deduplication, and synchronization.

#### Query Client Configuration

```typescript
// lib/tanstack-query/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds
      gcTime: 5 * 60 * 1000,       // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Query Hooks

```typescript
// hooks/use-threads.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const THREADS_KEY = "threads";

export function useThreads() {
  return useQuery({
    queryKey: [THREADS_KEY],
    queryFn: fetchThreads,
    staleTime: 30 * 1000,
  });
}

export function useThread(threadId: string) {
  return useQuery({
    queryKey: [THREADS_KEY, threadId],
    queryFn: () => fetchThread(threadId),
    enabled: !!threadId,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] });
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThread,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] });
      queryClient.removeQueries({ queryKey: [THREADS_KEY, variables] });
    },
  });
}
```

### State Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        STATE LAYER                          │
│                                                             │
│  ┌─────────────────┐        ┌─────────────────────────────┐  │
│  │   ZUSTAND       │        │   TANSTACK QUERY            │  │
│  │   (Client State)│        │   (Server State)            │  │
│  │                 │        │                             │  │
│  │  UI Preferences │        │  Threads, Messages          │  │
│  │  - Sidebar open │        │  Workflows, Agents          │  │
│  │  - Composer text│        │  Models, Analytics          │  │
│  │                 │        │                             │  │
│  │  Selection State│        │  Features:                  │  │
│  │  - Active thread│        │  - Automatic Caching        │  │
│  │  - Selected model│       │  - Background Refetching  │  │
│  │  - Selected tools│       │  - Optimistic Updates       │  │
│  │                 │        │  - Infinite Pagination      │  │
│  │  Workflow Editor│        │  - Dedup & Deduplication    │  │
│  │  - Node positions│       │  - Offline Support          │  │
│  │  - Edge connections│      │  - DevTools Integration     │  │
│  │  - Execution logs│       │                             │  │
│  └─────────────────┘        └─────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    PERSISTENCE                            ││
│  │  - localStorage: UI preferences, draft messages         ││
│  │  - IndexedDB: Offline message queue                     ││
│  │  - PostgreSQL: Primary data via Prisma                  ││
│  │  - Redis: Session cache, rate limits, SSE pub/sub       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Design System

### Design Tokens

Design tokens are defined as CSS custom properties in `globals.css` and consumed via Tailwind configuration.

```css
/* app/globals.css */
@layer base {
  :root {
    /* Colors */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;

    /* AI Brand Colors */
    --ai-openai: 154 100% 35%;
    --ai-anthropic: 20 100% 55%;
    --ai-google: 217 89% 52%;
    --ai-ollama: 280 60% 45%;

    /* Semantic Colors */
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    --info: 217 91% 60%;
    --error: 0 84% 60%;

    /* Sidebar */
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217 91% 60%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217 91% 60%;
  }
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        ai: {
          openai: "hsl(var(--ai-openai))",
          anthropic: "hsl(var(--ai-anthropic))",
          google: "hsl(var(--ai-google))",
          ollama: "hsl(var(--ai-ollama))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### shadcn/ui Integration

Components are built on shadcn/ui primitives, customized with the design tokens.

```bash
# Install shadcn/ui components
npx shadcn add button
npx shadcn add dialog
npx shadcn add dropdown-menu
npx shadcn add input
npx shadcn add textarea
npx shadcn add select
npx shadcn add tabs
npx shadcn add tooltip
npx shadcn add skeleton
npx shadcn add toast
npx shadcn add badge
npx shadcn add avatar
n```

---

## Multi-Model Orchestration

### Simulation Layer

The platform includes a simulation layer for testing workflows and agents without consuming real API tokens.

```
┌─────────────────────────────────────────────────────────────┐
│                  MODEL ORCHESTRATION LAYER                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  MODEL ROUTER                            ││
│  │                                                         ││
│  │  Input: { modelId, message, tools, preferences }         ││
│  │                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   ││
│  │  │  Cost-based │  │ Quality-based│  │ Latency-based│   ││
│  │  │  Routing    │  │  Routing    │  │  Routing     │   ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘   ││
│  │                                                         ││
│  │  Output: { provider, model, estimatedCost, priority }   ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                │
│                            v                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              PROVIDER ADAPTER FACTORY                    ││
│  │                                                         ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │  │ OpenAI   │ │ Anthropic│ │  Google  │ │ Ollama   │  ││
│  │  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │  ││
│  │  │          │ │          │ │          │ │          │  ││
│  │  │ Unified  │ │ Unified  │ │ Unified  │ │ Unified  │  ││
│  │  │ Interface│ │ Interface│ │ Interface│ │ Interface│  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                │
│              ┌─────────────┼─────────────┐                  │
│              v             v             v                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  REAL MODE   │  │ MOCK MODE   │  │  SIMULATION │       │
│  │              │  │              │  │   MODE      │       │
│  │  Live API    │  │  Static      │  │  Dynamic    │       │
│  │  calls with  │  │  responses   │  │  generation │       │
│  │  streaming   │  │  from mocks  │  │  with delays│       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Provider Adapter Interface

```typescript
// lib/ai-sdk/provider-adapter.ts
export interface ProviderAdapter {
  readonly provider: string;
  readonly supportedModels: string[];

  streamText(options: StreamOptions): AsyncIterable<StreamEvent>;
  streamObject(options: ObjectStreamOptions): AsyncIterable<ObjectStreamEvent>;
  generateText(options: GenerateOptions): Promise<GenerateResult>;
  generateObject(options: ObjectGenerateOptions): Promise<ObjectGenerateResult>;
  getModelInfo(modelId: string): ModelInfo;
}

export interface StreamOptions {
  modelId: string;
  messages: Message[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

export interface StreamEvent {
  type: "text" | "tool-call" | "tool-result" | "error" | "finish";
  text?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  error?: Error;
  usage?: TokenUsage;
  finishReason?: string;
}
```

### Model Router

```typescript
// lib/services/model-service.ts
interface RoutingDecision {
  provider: string;
  modelId: string;
  estimatedCost: number;
  estimatedLatency: number;
  qualityScore: number;
}

export async function routeModelRequest(
  preferences: ModelPreferences,
  messageHistory: Message[]
): Promise<RoutingDecision> {
  const models = await getEnabledModels();

  // Score each model
  const scored = models.map((model) => ({
    model,
    score: calculateScore(model, preferences, messageHistory),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const winner = scored[0];

  return {
    provider: winner.model.provider,
    modelId: winner.model.modelId,
    estimatedCost: estimateCost(winner.model, messageHistory),
    estimatedLatency: estimateLatency(winner.model),
    qualityScore: winner.score,
  };
}
```

### Fallback Chain

```typescript
// lib/ai-sdk/fallback-chain.ts
export class FallbackChain {
  constructor(
    private adapters: ProviderAdapter[],
    private maxRetries: number = 2
  ) {}

  async *execute(options: StreamOptions): AsyncIterable<StreamEvent> {
    let lastError: Error | null = null;

    for (const adapter of this.adapters) {
      try {
        const stream = adapter.streamText(options);
        yield* stream;
        return; // Success, exit
      } catch (error) {
        lastError = error as Error;
        console.warn(`Adapter ${adapter.provider} failed:`, error);
        continue; // Try next adapter
      }
    }

    // All adapters failed
    yield {
      type: "error",
      error: lastError ?? new Error("All providers failed"),
    };
  }
}
```

---

## Security Model

### Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  User   │ ->  │  NextAuth.js│ ->  │   Prisma    │ ->  │  OAuth  │
│         │     │  (JWT/DB)   │     │   Adapter   │     │Provider │
└─────────┘     └─────────────┘     └─────────────┘     └─────────┘
     │                                               │
     │  ┌─────────────────────────────────────────┐  │
     │  │  Supported Providers:                   │  │
     │  │  - GitHub OAuth                         │  │
     │  │  - Google OAuth                         │  │
     │  │  - Email Magic Link                     │  │
     │  │  - Credentials (dev only)               │  │
     │  └─────────────────────────────────────────┘  │
     │                                               │
     v                                               v
┌─────────────────────────────────────────────────────────────┐
│  JWT Session Strategy                                       │
│  - Encrypted JWT stored in cookie                         │
│  - Session data: userId, email, role, orgId               │
│  - 30-day expiry with sliding refresh                     │
└─────────────────────────────────────────────────────────────┘
```

### Authorization (RBAC)

```typescript
// lib/auth/rbac.ts
export enum Permission {
  THREAD_CREATE = "thread:create",
  THREAD_DELETE = "thread:delete",
  WORKFLOW_CREATE = "workflow:create",
  WORKFLOW_PUBLISH = "workflow:publish",
  AGENT_CREATE = "agent:create",
  AGENT_PUBLISH = "agent:publish",
  ORG_MANAGE = "org:manage",
  BILLING_VIEW = "billing:view",
  USER_MANAGE = "user:manage",
}

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.THREAD_CREATE,
    Permission.WORKFLOW_CREATE,
    Permission.AGENT_CREATE,
  ],
  [UserRole.ADMIN]: [
    ...RolePermissions[UserRole.USER],
    Permission.WORKFLOW_PUBLISH,
    Permission.AGENT_PUBLISH,
    Permission.BILLING_VIEW,
  ],
  [UserRole.OWNER]: [
    ...RolePermissions[UserRole.ADMIN],
    Permission.ORG_MANAGE,
    Permission.USER_MANAGE,
  ],
};

export function hasPermission(user: User, permission: Permission): boolean {
  return RolePermissions[user.role]?.includes(permission) ?? false;
}
```

### API Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | HTTPS | Enforced in production |
| Authentication | JWT | NextAuth.js with encrypted cookies |
| Authorization | RBAC | Role-based permission checks |
| Input Validation | Schema validation | Zod on all API inputs |
| Rate Limiting | Token bucket | Redis-backed per-user limits |
| CORS | Whitelist | Configured per environment |
| CSRF | Double-submit cookie | Next.js built-in protection |
| XSS | Output encoding | React auto-escaping + CSP |
| SQL Injection | ORM | Prisma parameterized queries |
| Secrets | Environment variables | Never committed, rotated |

### Content Security Policy

```typescript
// next.config.js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.googleusercontent.com;
  font-src 'self';
  connect-src 'self' https://api.openai.com https://api.anthropic.com;
  frame-src 'none';
  base-uri 'self';
  form-action 'self';
`;

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader.replace(/\n/g, " ") },
        ],
      },
    ];
  },
};
```

---

## Performance Strategy

### Rendering Strategy

| Page | Strategy | Rationale |
|------|----------|-----------|
| Landing | Static + ISR | Marketing content, cacheable |
| Dashboard shell | Static + Client data | Layout shell cached, data fetched client-side |
| Chat | Client + Streaming | Real-time interactivity required |
| Workflow builder | Client | Complex canvas interactions |
| Console | Client + SSE | Live streaming data |
| Settings | Static + Client | Mix of server and client forms |

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING HIERARCHY                        │
│                                                             │
│  L1: Browser Cache                                          │
│  - TanStack Query cache (5 min GC)                         │
│  - localStorage for UI preferences                         │
│  - IndexedDB for offline message queue                       │
│                                                             │
│  L2: CDN / Edge Cache                                       │
│  - Static assets (1 year)                                  │
│  - ISR pages (1 hour stale-while-revalidate)               │
│  - API responses with Cache-Control headers                │
│                                                             │
│  L3: Redis Cache                                            │
│  - Session data (TTL: session duration)                    │
│  - Rate limit counters (TTL: 1 min)                       │
│  - Model metadata (TTL: 1 hour)                            │
│  - Thread list (TTL: 30 sec)                               │
│                                                             │
│  L4: Database                                               │
│  - PostgreSQL with query result caching                    │
│  - Connection pooling (PgBouncer)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bundle Optimization

```typescript
// next.config.js
module.exports = {
  // Code splitting by route
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@xyflow/react",
      "recharts",
    ],
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Compression
  compress: true,

  // Production source maps (Sentry)
  productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === "true",
};
```

### Streaming Performance

```typescript
// Streaming with backpressure handling
export async function* streamWithBackpressure(
  source: AsyncIterable<StreamEvent>
): AsyncIterable<StreamEvent> {
  const buffer: StreamEvent[] = [];
  const maxBuffer = 100;

  for await (const event of source) {
    buffer.push(event);

    if (buffer.length >= maxBuffer) {
      for (const e of buffer) yield e;
      buffer.length = 0;
    }
  }

  // Drain remaining
  for (const e of buffer) yield e;
}
```

### Virtualization for Large Lists

```tsx
// components/chat/message-list.tsx
import { useVirtualizer } from "@tanstack/react-virtual";

export function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="overflow-auto h-full">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MessageBubble message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Key Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.0s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| API response time (p95) | < 200ms | Server logs |
| Streaming latency (first token) | < 500ms | Client timing |
| Bundle size (initial) | < 200KB | webpack-bundle-analyzer |
| Bundle size (lazy-loaded) | < 500KB | webpack-bundle-analyzer |
