"use client";

import * as React from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/src/components/ui/accordion";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { Separator } from "@/src/components/ui/separator";
import {
  Search,
  Copy,
  Check,
  Terminal,
  Code2,
  Braces,
  Server,
  Shield,
  AlertCircle,
  Zap,
  Layers,
  FileText,
  Users,
  Settings,
  BarChart3,
  Lock,
  Globe,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Hash,
  Clock,
  Cpu,
  CreditCard,
  MessageSquare,
  Bell,
  SearchIcon,
  Cable,
  Database,
} from "lucide-react";

/* ─────────────────────── Types ─────────────────────── */

interface Field {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  example?: string | number | boolean | string[];
}

interface EndpointDoc {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE" | "HEAD";
  path: string;
  description: string;
  auth: boolean;
  role?: string;
  tags: string[];
  queryParams?: Field[];
  bodyFields?: Field[];
  responseFields?: Field[];
  responseExample: object;
  errorExamples?: { code: number; title: string; body: object }[];
  notes?: string[];
}

interface ApiGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  endpoints: EndpointDoc[];
}

/* ─────────────────────── API Data ─────────────────────── */

const API_GROUPS: ApiGroup[] = [
  {
    id: "overview",
    label: "Overview",
    icon: BookOpen,
    description: "Base URL, authentication, and conventions",
    endpoints: [],
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: Layers,
    description: "Create, manage, and monitor workflows",
    endpoints: [
      {
        id: "list-workflows",
        method: "GET",
        path: "/api/workflows",
        description: "List workflows with pagination, status filtering, and date range queries.",
        auth: true,
        tags: ["workflows", "list"],
        queryParams: [
          { name: "status", type: "string", description: "Filter by status: queued, planning, running, paused, completed, failed", example: "running" },
          { name: "space", type: "string", description: "Filter by space ID", example: "sp_abc123" },
          { name: "kind", type: "string", description: "Filter by kind", example: "research" },
          { name: "from", type: "string (ISO 8601)", description: "Start date", example: "2024-06-01T00:00:00Z" },
          { name: "to", type: "string (ISO 8601)", description: "End date", example: "2024-06-30T23:59:59Z" },
          { name: "limit", type: "integer", description: "Max results per page (default: 20)", example: 20 },
          { name: "offset", type: "integer", description: "Pagination offset (default: 0)", example: 0 },
        ],
        responseFields: [
          { name: "data", type: "Workflow[]", description: "Array of workflow objects" },
          { name: "total", type: "integer", description: "Total matching workflows" },
          { name: "limit", type: "integer", description: "Applied limit" },
          { name: "offset", type: "integer", description: "Applied offset" },
        ],
        responseExample: {
          data: [
            {
              id: "wf_abc123",
              objective: "Research AI safety frameworks",
              status: "running",
              space_id: "sp_1",
              budget_credits: 50,
              spent_credits: 12.4,
              created_at: "2024-06-20T10:00:00Z",
            },
          ],
          total: 42,
          limit: 20,
          offset: 0,
        },
        errorExamples: [
          { code: 401, title: "Unauthorized", body: { error: { code: "UNAUTHORIZED", message: "Invalid or missing token", status: 401 } } },
        ],
      },
      {
        id: "create-workflow",
        method: "POST",
        path: "/api/workflows",
        description: "Create and start a new workflow. The platform decomposes the objective into a DAG of subtasks.",
        auth: true,
        tags: ["workflows", "create"],
        bodyFields: [
          { name: "objective", type: "string (1-5000 chars)", required: true, description: "What you want the agent to accomplish", example: "Research AI safety frameworks and produce a comparative analysis" },
          { name: "space_id", type: "string", required: true, description: "ID of the space to run in", example: "sp_abc123" },
          { name: "budget_credits", type: "number (1-1000)", description: "Maximum credit budget", example: 50 },
          { name: "deadline", type: "string (ISO 8601)", description: "Deadline for completion", example: "2024-06-21T10:00:00Z" },
          { name: "deliverable_kinds", type: "string[]", description: "Desired output types", example: ["answer", "report", "markdown"] },
          { name: "policy_overrides.max_depth", type: "integer (1-10)", description: "Max recursion depth", example: 3 },
          { name: "policy_overrides.min_model_tier", type: "string", description: "Minimum model tier: budget, standard, premium, elite", example: "premium" },
          { name: "policy_overrides.auto_retry", type: "boolean", description: "Auto-retry failed tasks", example: true },
          { name: "policy_overrides.human_approval", type: "string", description: "Approval level: none, critical, all", example: "critical" },
          { name: "policy_overrides.max_parallel", type: "integer (1-20)", description: "Max parallel tasks", example: 4 },
          { name: "policy_overrides.timeout_seconds", type: "integer (30-3600)", description: "Per-task timeout", example: 300 },
        ],
        responseFields: [
          { name: "id", type: "string", description: "Workflow ID" },
          { name: "status", type: "string", description: "Initial status: queued or planning" },
          { name: "dag", type: "object", description: "Generated execution DAG" },
        ],
        responseExample: {
          id: "wf_abc123",
          objective: "Research AI safety frameworks",
          status: "planning",
          space_id: "sp_abc123",
          budget_credits: 50,
          spent_credits: 0,
          dag: { nodes: [], edges: [] },
          created_at: "2024-06-20T10:00:00Z",
        },
        errorExamples: [
          { code: 400, title: "Validation Error", body: { error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: [{ field: "objective", message: "Required" }] } } },
          { code: 404, title: "Space Not Found", body: { error: { code: "NOT_FOUND", message: "Space not found", status: 404 } } },
        ],
      },
      {
        id: "get-workflow",
        method: "GET",
        path: "/api/workflows/{id}",
        description: "Get a single workflow with full details including tasks, artifacts, and clarifications.",
        auth: true,
        tags: ["workflows", "detail"],
        responseFields: [
          { name: "id", type: "string", description: "Workflow ID" },
          { name: "objective", type: "string", description: "Original objective" },
          { name: "status", type: "string", description: "Current status" },
          { name: "tasks", type: "Task[]", description: "Array of tasks" },
          { name: "artifacts", type: "Artifact[]", description: "Generated artifacts" },
          { name: "clarifications", type: "Clarification[]", description: "Pending/answered clarifications" },
        ],
        responseExample: {
          id: "wf_abc123",
          objective: "Research AI safety frameworks",
          status: "running",
          space_id: "sp_abc123",
          tasks: [
            { id: "task-1", name: "Plan workflow execution", status: "completed", depth: 0 },
            { id: "task-2", name: "Search for AI safety papers", status: "running", depth: 1 },
          ],
          artifacts: [],
          clarifications: [],
          created_at: "2024-06-20T10:00:00Z",
        },
        errorExamples: [
          { code: 404, title: "Not Found", body: { error: { code: "NOT_FOUND", message: "Workflow not found", status: 404 } } },
          { code: 403, title: "Forbidden", body: { error: { code: "FORBIDDEN", message: "Forbidden", status: 403 } } },
        ],
      },
      {
        id: "update-workflow",
        method: "PATCH",
        path: "/api/workflows/{id}",
        description: "Update workflow status (pause, resume, amend) or modify properties like budget and deadline.",
        auth: true,
        tags: ["workflows", "update"],
        bodyFields: [
          { name: "status", type: "string", description: "New status: paused, running, amending, cancelled", example: "paused" },
          { name: "objective", type: "string (1-5000)", description: "Updated objective", example: "Updated objective text" },
          { name: "budget_credits", type: "number (1-1000)", description: "Updated budget", example: 75 },
          { name: "deadline", type: "string (ISO 8601) | null", description: "Updated deadline or null to clear", example: "2024-06-22T10:00:00Z" },
          { name: "policy_overrides", type: "object", description: "Partial policy overrides to merge", example: { max_depth: 5 } },
        ],
        responseExample: {
          id: "wf_abc123",
          objective: "Research AI safety frameworks",
          status: "paused",
          updated_at: "2024-06-20T11:00:00Z",
        },
        errorExamples: [
          { code: 400, title: "Invalid Transition", body: { error: { code: "BAD_REQUEST", message: "Invalid status transition from running to queued", status: 400 } } },
        ],
      },
      {
        id: "cancel-workflow",
        method: "DELETE",
        path: "/api/workflows/{id}",
        description: "Cancel a running or queued workflow. Cannot cancel completed workflows.",
        auth: true,
        tags: ["workflows", "cancel"],
        responseExample: { success: true, id: "wf_abc123", status: "cancelled" },
        errorExamples: [
          { code: 400, title: "Already Finished", body: { error: { code: "BAD_REQUEST", message: "Cannot cancel a finished workflow", status: 400 } } },
        ],
      },
      {
        id: "workflow-events",
        method: "GET",
        path: "/api/workflows/{id}/events",
        description: "Subscribe to workflow events via Server-Sent Events (SSE). Returns a stream of task updates, token usage, and lifecycle events.",
        auth: true,
        tags: ["workflows", "events", "sse"],
        queryParams: [
          { name: "last-event-id", type: "string (header)", description: "Resume from a specific event ID", example: "evt-wf-1-plan" },
        ],
        notes: [
          "Returns Content-Type: text/event-stream",
          "Reconnect with Last-Event-ID header to resume",
          "Stream auto-closes for non-running workflows after sending historical events",
          "Event types: workflow.planned, workflow.amended, workflow.completed, task.started, task.tokens, task.completed, task.failed, artifact.created, clarification.needed, budget.warn, synthesis.token",
        ],
        responseFields: [
          { name: "event", type: "string", description: "Event type name" },
          { name: "id", type: "string", description: "Unique event ID for replay" },
          { name: "data", type: "object", description: "Event payload" },
        ],
        responseExample: {
          note: "SSE stream — events are line-delimited",
          event: "task.completed",
          id: "evt-wf-1-task1-done",
          data: { task_id: "task-2-1", result_summary: "Analysis complete" },
          timestamp: "2024-06-20T10:05:00Z",
        },
      },
      {
        id: "workflow-artifacts",
        method: "GET",
        path: "/api/workflows/{id}/artifacts",
        description: "List artifacts for a specific workflow.",
        auth: true,
        tags: ["workflows", "artifacts"],
        responseExample: {
          data: [
            { id: "art-1", name: "analysis.md", kind: "markdown", workflow_id: "wf_abc123", created_at: "2024-06-20T10:05:00Z" },
          ],
          total: 1,
        },
      },
    ],
  },
  {
    id: "execution",
    label: "Execution",
    icon: Zap,
    description: "Run sub-agents and search",
    endpoints: [
      {
        id: "run-agent",
        method: "POST",
        path: "/api/run",
        description: "Execute a sub-agent task with a specific model and optional tools.",
        auth: true,
        tags: ["execution", "agent"],
        bodyFields: [
          { name: "prompt", type: "string (1-10000 chars)", required: true, description: "The prompt to send to the agent", example: "Summarize the key findings about RLHF safety" },
          { name: "model", type: "string", description: "Model ID to use (default: gpt-4o)", example: "claude-3-5-sonnet" },
          { name: "tools", type: "string[]", description: "Tool names to enable", example: ["web_search", "code_executor"] },
          { name: "workflow_id", type: "string", description: "Associate with a workflow for tracking", example: "wf_abc123" },
          { name: "max_tokens", type: "integer (1-64000)", description: "Max tokens to generate", example: 4096 },
          { name: "temperature", type: "number (0-2)", description: "Sampling temperature", example: 0.7 },
        ],
        responseFields: [
          { name: "task_id", type: "string", description: "Unique task ID" },
          { name: "status", type: "string", description: "completed or failed" },
          { name: "result", type: "string", description: "Agent response text" },
          { name: "tokens_used", type: "object", description: "Input and output token counts" },
          { name: "cost_credits", type: "number", description: "Credits consumed" },
          { name: "model_used", type: "string", description: "Actual model used" },
        ],
        responseExample: {
          task_id: "task_abc123",
          status: "completed",
          result: "Based on your request, I have analyzed...",
          citations: [],
          tokens_used: { input: 1250, output: 980 },
          cost_credits: 0.0234,
          model_used: "claude-3-5-sonnet",
          completed_at: "2024-06-20T10:00:00Z",
        },
      },
      {
        id: "search",
        method: "POST",
        path: "/api/search",
        description: "Perform a web search with relevance scoring and recency filtering.",
        auth: true,
        tags: ["execution", "search"],
        bodyFields: [
          { name: "query", type: "string (1-500 chars)", required: true, description: "Search query", example: "AI safety benchmarks 2024" },
          { name: "limit", type: "integer (1-20)", description: "Max results (default: 5)", example: 10 },
          { name: "recency_days", type: "integer (1-365)", description: "Only return results newer than N days", example: 30 },
        ],
        responseFields: [
          { name: "query", type: "string", description: "Original query" },
          { name: "results", type: "SearchResult[]", description: "Search results with relevance scores" },
          { name: "total", type: "integer", description: "Result count" },
          { name: "search_id", type: "string", description: "Unique search ID" },
          { name: "credits_used", type: "number", description: "Credits consumed" },
        ],
        responseExample: {
          query: "AI safety benchmarks 2024",
          results: [
            {
              id: "sr-1",
              title: "2024 B2B SaaS Pricing Benchmarks Report",
              url: "https://example.com/saas-pricing-2024",
              snippet: "Comprehensive analysis of B2B SaaS pricing strategies...",
              relevance_score: 0.95,
              published_at: "2024-05-15T10:00:00Z",
              source: "Industry Research",
            },
          ],
          total: 1,
          search_id: "search-abc123",
          credits_used: 0.5,
        },
      },
    ],
  },
  {
    id: "artifacts",
    label: "Artifacts",
    icon: FileText,
    description: "Access generated artifacts and outputs",
    endpoints: [
      {
        id: "list-artifacts",
        method: "GET",
        path: "/api/artifacts",
        description: "List all artifacts accessible to the organization, with optional filtering by workflow or kind.",
        auth: true,
        tags: ["artifacts", "list"],
        queryParams: [
          { name: "workflow_id", type: "string", description: "Filter by workflow ID", example: "wf_abc123" },
          { name: "kind", type: "string", description: "Filter by artifact type: code, markdown, csv, pdf, json, image", example: "markdown" },
          { name: "limit", type: "integer", description: "Max results (default: 50)", example: 50 },
          { name: "offset", type: "integer", description: "Pagination offset (default: 0)", example: 0 },
        ],
        responseFields: [
          { name: "data", type: "Artifact[]", description: "Array of artifacts" },
          { name: "total", type: "integer", description: "Total matching artifacts" },
          { name: "limit", type: "integer", description: "Applied limit" },
          { name: "offset", type: "integer", description: "Applied offset" },
        ],
        responseExample: {
          data: [
            {
              id: "art-1",
              name: "analysis.md",
              kind: "markdown",
              workflow_id: "wf_abc123",
              created_at: "2024-06-20T10:05:00Z",
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        },
      },
      {
        id: "get-artifact",
        method: "GET",
        path: "/api/artifacts/{id}",
        description: "Get artifact details with a presigned download URL valid for 1 hour.",
        auth: true,
        tags: ["artifacts", "detail"],
        responseFields: [
          { name: "id", type: "string", description: "Artifact ID" },
          { name: "name", type: "string", description: "File name" },
          { name: "kind", type: "string", description: "Artifact type" },
          { name: "presigned_url", type: "string", description: "Temporary access URL (1h expiry)" },
          { name: "download_url", type: "string", description: "Force-download URL" },
          { name: "presigned_expires_at", type: "string (ISO 8601)", description: "URL expiry time" },
        ],
        responseExample: {
          id: "art-1",
          name: "analysis.md",
          kind: "markdown",
          workflow_id: "wf_abc123",
          presigned_url: "https://mock-cdn.example.com/art-1/analysis.md?token=...&expires=...",
          download_url: "https://mock-cdn.example.com/art-1/analysis.md?token=...&download=1",
          presigned_expires_at: "2024-06-20T11:05:00Z",
          created_at: "2024-06-20T10:05:00Z",
        },
        errorExamples: [
          { code: 404, title: "Not Found", body: { error: { code: "NOT_FOUND", message: "Artifact not found", status: 404 } } },
          { code: 403, title: "Forbidden", body: { error: { code: "FORBIDDEN", message: "Forbidden", status: 403 } } },
        ],
      },
    ],
  },
  {
    id: "spaces",
    label: "Spaces",
    icon: Database,
    description: "Organize work into isolated spaces",
    endpoints: [
      {
        id: "list-spaces",
        method: "GET",
        path: "/api/spaces",
        description: "List all spaces accessible to the user.",
        auth: true,
        tags: ["spaces", "list"],
        responseFields: [
          { name: "data", type: "Space[]", description: "Array of spaces" },
          { name: "total", type: "integer", description: "Total spaces" },
        ],
        responseExample: {
          data: [
            {
              id: "sp_abc123",
              name: "Research Projects",
              description: "AI safety and alignment research",
              owner_id: "user_1",
              members: ["user_1", "user_2"],
              memory_enabled: true,
              created_at: "2024-06-01T00:00:00Z",
            },
          ],
          total: 1,
        },
      },
      {
        id: "create-space",
        method: "POST",
        path: "/api/spaces",
        description: "Create a new workspace for organizing workflows.",
        auth: true,
        tags: ["spaces", "create"],
        bodyFields: [
          { name: "name", type: "string (1-100 chars)", required: true, description: "Space name", example: "Research Projects" },
          { name: "description", type: "string (max 500)", description: "Space description", example: "AI safety and alignment research" },
          { name: "memory_enabled", type: "boolean", description: "Enable persistent memory (default: true)", example: true },
          { name: "members", type: "string[]", description: "User IDs to add as members", example: ["user_2"] },
        ],
        responseExample: {
          id: "sp_abc123",
          name: "Research Projects",
          description: "AI safety and alignment research",
          owner_id: "user_1",
          members: ["user_1", "user_2"],
          memory_enabled: true,
          created_at: "2024-06-20T10:00:00Z",
        },
      },
    ],
  },
  {
    id: "models",
    label: "Models",
    icon: Cpu,
    description: "Query available AI models and their capabilities",
    endpoints: [
      {
        id: "list-models",
        method: "GET",
        path: "/api/models",
        description: "List all available models with capabilities, pricing, and context window info.",
        auth: true,
        tags: ["models", "list"],
        queryParams: [
          { name: "tier", type: "string", description: "Filter by tier: budget, standard, premium", example: "premium" },
          { name: "capability", type: "string", description: "Filter by capability: text, vision, json_mode, function_calling, code", example: "code" },
        ],
        responseFields: [
          { name: "data", type: "Model[]", description: "Array of model configs" },
          { name: "total", type: "integer", description: "Total models" },
        ],
        responseExample: {
          data: [
            {
              id: "claude-3-5-sonnet",
              name: "Claude 3.5 Sonnet",
              provider: "anthropic",
              tier: "premium",
              context_window: 200000,
              capabilities: ["text", "vision", "json_mode", "function_calling", "code"],
              cost_per_1k_tokens: { input: 0.003, output: 0.015 },
              description: "Anthropic's most capable model with exceptional coding abilities.",
              latency_tier: "fast",
              max_output_tokens: 8192,
              supported_languages: ["en", "es", "fr", "de", "zh", "ja", "ko"],
            },
          ],
          total: 5,
        },
      },
    ],
  },
  {
    id: "connectors",
    label: "Connectors",
    icon: Cable,
    description: "Manage third-party integrations",
    endpoints: [
      {
        id: "list-connectors",
        method: "GET",
        path: "/api/connectors",
        description: "List installed and available connectors.",
        auth: true,
        tags: ["connectors", "list"],
        responseFields: [
          { name: "data", type: "Connector[]", description: "Connector configurations" },
          { name: "total", type: "integer", description: "Total connectors" },
        ],
        responseExample: {
          data: [
            {
              name: "slack",
              display_name: "Slack",
              status: "installed",
              scopes: ["chat:write", "channels:read"],
              installed_at: "2024-06-01T00:00:00Z",
            },
          ],
          total: 10,
        },
      },
      {
        id: "install-connector",
        method: "POST",
        path: "/api/connectors",
        description: "Install a connector. Initiates an OAuth flow for the user to authorize.",
        auth: true,
        tags: ["connectors", "install"],
        bodyFields: [
          { name: "name", type: "string", required: true, description: "Connector name", example: "slack" },
        ],
        responseFields: [
          { name: "oauth_redirect_url", type: "string", description: "OAuth authorization URL" },
          { name: "message", type: "string", description: "Status message" },
        ],
        responseExample: {
          name: "slack",
          status: "installed",
          oauth_redirect_url: "https://mock-oauth.example.com/auth/slack?client_id=demo&redirect_uri=...",
          message: "OAuth flow initiated.",
        },
        errorExamples: [
          { code: 404, title: "Not Found", body: { error: { code: "NOT_FOUND", message: "Connector not found", status: 404 } } },
          { code: 409, title: "Conflict", body: { error: { code: "CONFLICT", message: "Connector already installed", status: 409 } } },
        ],
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    description: "Team members and invitations",
    endpoints: [
      {
        id: "list-members",
        method: "GET",
        path: "/api/team/members",
        description: "List all team members in the organization.",
        auth: true,
        tags: ["team", "members"],
        responseFields: [
          { name: "data", type: "Member[]", description: "Team members" },
          { name: "total", type: "integer", description: "Member count" },
        ],
        responseExample: {
          data: [
            { id: "user_1", name: "Alice Chen", email: "alice@example.com", role: "owner", joined_at: "2024-01-15T00:00:00Z" },
            { id: "user_2", name: "Bob Smith", email: "bob@example.com", role: "member", joined_at: "2024-03-20T00:00:00Z" },
          ],
          total: 2,
        },
      },
      {
        id: "list-invites",
        method: "GET",
        path: "/api/team/invites",
        description: "List pending team invitations.",
        auth: true,
        tags: ["team", "invites"],
        responseFields: [
          { name: "data", type: "Invite[]", description: "Pending invitations" },
          { name: "total", type: "integer", description: "Invite count" },
        ],
        responseExample: {
          data: [
            {
              id: "inv-1",
              email: "charlie@example.com",
              role: "member",
              status: "pending",
              invited_by: "Alice Chen",
              invited_at: "2024-06-20T10:00:00Z",
            },
          ],
          total: 1,
        },
      },
      {
        id: "send-invite",
        method: "POST",
        path: "/api/team/invites",
        description: "Send an invitation to a new team member.",
        auth: true,
        tags: ["team", "invites"],
        bodyFields: [
          { name: "email", type: "string (email)", required: true, description: "Invitee email address", example: "charlie@example.com" },
          { name: "role", type: "string", required: true, description: "Role: owner, admin, member, viewer, auditor", example: "member" },
        ],
        responseExample: {
          id: "inv-1",
          email: "charlie@example.com",
          role: "member",
          status: "pending",
          invited_by: "Alice Chen",
          invited_at: "2024-06-20T10:00:00Z",
          expires_at: "2024-07-20T10:00:00Z",
        },
        errorExamples: [
          { code: 409, title: "Already Invited", body: { error: { code: "CONFLICT", message: "An active invitation already exists for this email", status: 409 } } },
        ],
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    description: "Usage and billing information",
    endpoints: [
      {
        id: "get-billing",
        method: "GET",
        path: "/api/billing",
        description: "Get billing information for the organization including plan, usage, and invoices.",
        auth: true,
        tags: ["billing", "usage"],
        responseFields: [
          { name: "plan", type: "string", description: "Current plan: free, pro, enterprise" },
          { name: "billing_period", type: "string", description: "monthly or annual" },
          { name: "seats", type: "integer", description: "Number of seats" },
          { name: "total_monthly", type: "number", description: "Monthly cost in USD" },
          { name: "credits_included", type: "number", description: "Monthly included credits" },
          { name: "current_usage", type: "object", description: "Current period usage" },
          { name: "invoices", type: "Invoice[]", description: "Invoice history" },
        ],
        responseExample: {
          plan: "pro",
          billing_period: "monthly",
          seats: 5,
          seat_price: 49,
          total_monthly: 245,
          credits_included: 1000,
          credits_overage_rate: 0.05,
          current_usage: {
            credits_used: 678.4,
            credits_remaining: 321.6,
            projected_monthly_total: 892,
          },
          invoices: [
            { id: "inv-2024-06", period: "June 2024", amount: 245, status: "paid", paid_at: "2024-06-01T00:00:00Z" },
          ],
          next_invoice_date: "2024-07-01",
          payment_method: { type: "card", last4: "4242", brand: "visa", expiry: "12/25" },
        },
      },
      {
        id: "get-usage",
        method: "GET",
        path: "/api/usage",
        description: "Get detailed token and credit usage breakdown by model and day.",
        auth: true,
        tags: ["billing", "usage"],
        responseFields: [
          { name: "total_tokens", type: "integer", description: "Total tokens consumed" },
          { name: "total_credits", type: "number", description: "Total credits consumed" },
          { name: "workflows_completed", type: "integer", description: "Completed workflows" },
          { name: "workflows_failed", type: "integer", description: "Failed workflows" },
          { name: "models_used", type: "object", description: "Per-model breakdown" },
          { name: "daily_breakdown", type: "object[]", description: "Daily usage history" },
        ],
        responseExample: {
          total_tokens: 2450000,
          total_input_tokens: 1800000,
          total_output_tokens: 650000,
          total_credits: 847.6,
          workflows_completed: 42,
          workflows_failed: 3,
          models_used: {
            "gpt-4o": { calls: 340, tokens: 980000, credits: 312.4 },
            "claude-3-5-sonnet": { calls: 156, tokens: 720000, credits: 218.2 },
          },
          daily_breakdown: [
            { date: "2024-06-15", tokens: 125000, credits: 42.3 },
            { date: "2024-06-14", tokens: 89000, credits: 31.7 },
          ],
          period_start: "2024-06-01",
          period_end: "2024-06-30",
        },
      },
    ],
  },
  {
    id: "memory",
    label: "Memory",
    icon: Database,
    description: "Persistent memory entries",
    endpoints: [
      {
        id: "list-memory",
        method: "GET",
        path: "/api/memory",
        description: "List memory entries with filtering by kind, query, space, or workflow.",
        auth: true,
        tags: ["memory", "list"],
        queryParams: [
          { name: "kind", type: "string", description: "Filter by kind: fact, preference, instruction, context", example: "fact" },
          { name: "query", type: "string", description: "Search query for content matching", example: "AI safety" },
          { name: "space_id", type: "string", description: "Filter by space", example: "sp_abc123" },
          { name: "workflow_id", type: "string", description: "Filter by workflow", example: "wf_abc123" },
          { name: "limit", type: "integer", description: "Max results (default: 50)", example: 50 },
          { name: "offset", type: "integer", description: "Pagination offset (default: 0)", example: 0 },
        ],
        responseExample: {
          data: [
            { id: "mem-1", kind: "fact", key: "preferred-model", value: "claude-3-5-sonnet", space_id: "sp_abc123", created_at: "2024-06-20T10:00:00Z" },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        },
      },
      {
        id: "delete-memory",
        method: "DELETE",
        path: "/api/memory",
        description: "Revoke a memory entry by ID.",
        auth: true,
        tags: ["memory", "delete"],
        bodyFields: [
          { name: "id", type: "string", required: true, description: "Memory entry ID to delete", example: "mem-1" },
        ],
        responseExample: { success: true, id: "mem-1" },
        errorExamples: [
          { code: 404, title: "Not Found", body: { error: { code: "NOT_FOUND", message: "Memory entry not found", status: 404 } } },
          { code: 403, title: "Forbidden", body: { error: { code: "FORBIDDEN", message: "Forbidden", status: 403 } } },
        ],
      },
    ],
  },
  {
    id: "clarifications",
    label: "Clarifications",
    icon: MessageSquare,
    description: "Manage workflow clarification questions",
    endpoints: [
      {
        id: "list-clarifications",
        method: "GET",
        path: "/api/clarifications",
        description: "List clarification questions, optionally filtered by workflow or answered status.",
        auth: true,
        tags: ["clarifications", "list"],
        queryParams: [
          { name: "workflow_id", type: "string", description: "Filter by workflow ID", example: "wf_abc123" },
          { name: "answered", type: "boolean", description: "Filter by answered status", example: false },
          { name: "limit", type: "integer", description: "Max results (default: 50)", example: 50 },
          { name: "offset", type: "integer", description: "Pagination offset (default: 0)", example: 0 },
        ],
        responseExample: {
          data: [
            {
              id: "clar-1",
              workflow_id: "wf_abc123",
              question: "Should the analysis focus on technical safety or policy frameworks?",
              context: "The objective mentions 'AI safety frameworks' which is ambiguous...",
              answered: false,
              created_at: "2024-06-20T10:00:00Z",
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        },
      },
    ],
  },
  {
    id: "audit",
    label: "Audit",
    icon: Shield,
    description: "Audit trail for compliance",
    endpoints: [
      {
        id: "list-audit",
        method: "GET",
        path: "GET /api/audit",
        description: "List audit events. Requires auditor or admin role.",
        auth: true,
        role: "auditor",
        tags: ["audit", "compliance"],
        queryParams: [
          { name: "workflow_id", type: "string", description: "Filter by workflow", example: "wf_abc123" },
          { name: "actor_id", type: "string", description: "Filter by actor/user ID", example: "user_1" },
          { name: "type", type: "string", description: "Filter by event type", example: "workflow.created" },
          { name: "from", type: "string (ISO 8601)", description: "Start date", example: "2024-06-01T00:00:00Z" },
          { name: "to", type: "string (ISO 8601)", description: "End date", example: "2024-06-30T23:59:59Z" },
          { name: "limit", type: "integer", description: "Max results (default: 50)", example: 50 },
          { name: "offset", type: "integer", description: "Pagination offset (default: 0)", example: 0 },
        ],
        responseExample: {
          data: [
            {
              id: "audit-1",
              type: "workflow.created",
              actor_id: "user_1",
              actor_name: "Alice Chen",
              org_id: "org_1",
              workflow_id: "wf_abc123",
              details: { objective: "Research AI safety frameworks" },
              ip_address: "127.0.0.1",
              user_agent: "Mozilla/5.0",
              created_at: "2024-06-20T10:00:00Z",
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        },
      },
    ],
  },
  {
    id: "health",
    label: "Health",
    icon: Globe,
    description: "System health and monitoring",
    endpoints: [
      {
        id: "health",
        method: "GET",
        path: "/api/health",
        description: "Health check with sub-system status and latency information.",
        auth: false,
        tags: ["health", "monitoring"],
        responseFields: [
          { name: "status", type: "string", description: "Overall status: healthy, degraded, unhealthy" },
          { name: "version", type: "string", description: "App version" },
          { name: "uptime_seconds", type: "integer", description: "Server uptime" },
          { name: "timestamp", type: "string (ISO 8601)", description: "Check timestamp" },
          { name: "checks", type: "object", description: "Per-subsystem health checks" },
        ],
        responseExample: {
          status: "healthy",
          version: "1.2.3",
          uptime_seconds: 86400,
          timestamp: "2024-06-20T10:00:00Z",
          checks: {
            database: { status: "healthy", latency_ms: 12 },
            queue: { status: "healthy", latency_ms: 45 },
            llm_api: { status: "healthy", latency_ms: 234 },
            storage: { status: "healthy", latency_ms: 8 },
            search_index: { status: "healthy", latency_ms: 18 },
          },
        },
      },
      {
        id: "healthcheck",
        method: "GET",
        path: "/api/healthcheck",
        description: "Simple edge-runtime health check. No authentication required.",
        auth: false,
        tags: ["health", "monitoring"],
        responseExample: { status: "ok", timestamp: "2024-06-20T10:00:00Z" },
      },
    ],
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: BarChart3,
    description: "Prometheus-compatible metrics endpoint",
    endpoints: [
      {
        id: "prometheus-metrics",
        method: "GET",
        path: "/api/metrics",
        description: "Prometheus-formatted metrics. Requires Bearer token if METRICS_API_TOKEN is configured.",
        auth: true,
        tags: ["metrics", "prometheus"],
        notes: [
          "Authentication via METRICS_API_TOKEN bearer token (if env var is set)",
          "Returns Content-Type: text/plain with Prometheus format",
          "Metrics include: http_request_duration_seconds, agent_workflow_runs_total, agent_tokens_consumed_total, agent_cost_credits_total",
          "HEAD method also supported for lightweight probes",
        ],
        responseExample: {
          note: "Prometheus text format",
          sample:
            "# HELP http_request_duration_seconds API request latencies\n# TYPE http_request_duration_seconds histogram\nhttp_request_duration_seconds_bucket{le=\"0.1\",method=\"GET\",path=\"/api/workflows\"} 42",
        },
      },
    ],
  },
];

/* ─────────────────────── Helpers ─────────────────────── */

function getMethodColor(method: string) {
  switch (method) {
    case "GET":
      return "success" as const;
    case "POST":
      return "info" as const;
    case "PATCH":
      return "warning" as const;
    case "DELETE":
      return "danger" as const;
    case "HEAD":
      return "default" as const;
    default:
      return "default" as const;
  }
}

function buildCurl(endpoint: EndpointDoc) {
  const lines = [`curl -X ${endpoint.method} "https://api.example.com${endpoint.path}"`];
  if (endpoint.auth) lines.push('  -H "Authorization: Bearer $API_TOKEN"');
  lines.push('  -H "Content-Type: application/json"');
  if (endpoint.bodyFields && endpoint.bodyFields.length > 0) {
    const body: Record<string, unknown> = {};
    for (const f of endpoint.bodyFields) {
      if (f.example !== undefined) {
        const parts = f.name.split(".");
        if (parts.length > 1) {
          const top = parts[0];
          if (!body[top]) body[top] = {};
          (body[top] as Record<string, unknown>)[parts.slice(1).join(".")] = f.example;
        } else {
          body[f.name] = f.example;
        }
      }
    }
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
  }
  return lines.join(" \\\n");
}

function buildFetch(endpoint: EndpointDoc) {
  const body = endpoint.bodyFields && endpoint.bodyFields.length > 0
    ? JSON.stringify(
      Object.fromEntries(
        endpoint.bodyFields
          .filter((f) => f.example !== undefined)
          .map((f) => [f.name.split(".")[0], f.example])
      ),
      null,
      2
    )
    : null;

  return `const response = await fetch("https://api.example.com${endpoint.path}", {
  method: "${endpoint.method}",
  headers: {
    "Authorization": "Bearer " + API_TOKEN,${body ? '\n    "Content-Type": "application/json",' : ""}
  },${body ? `\n  body: JSON.stringify(${body}),` : ""}
});

const data = await response.json();
console.log(data);`;
}

function buildTypescript(endpoint: EndpointDoc) {
  return `import { api } from "@/src/lib/client";

// Using the typed API client
const data = await api("${endpoint.path}", {
  method: "${endpoint.method}",${endpoint.bodyFields && endpoint.bodyFields.length > 0 ? '\n  body: { ... },' : ""}
});

// data is fully typed — hover to see the shape`;
}

/* ─────────────────────── Copy Button ─────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="absolute top-3 right-3 h-8 w-8 p-0 rounded-md opacity-60 hover:opacity-100 hover:bg-[var(--bg-surface-2)] transition-opacity"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-[var(--semantic-success)]" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

/* ─────────────────────── Code Block ─────────────────────── */

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative group">
      <div className="absolute top-0 left-0 right-0 h-9 flex items-center px-4 bg-[var(--bg-surface-2)] border-b border-[var(--border-subtle)] rounded-t-lg">
        <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
          {language}
        </span>
      </div>
      <CopyButton text={code} />
      <pre className="mt-9 overflow-x-auto rounded-b-lg bg-[var(--bg-surface)] border border-t-0 border-[var(--border-subtle)] p-4 text-[13px] leading-relaxed font-mono">
        <code className="text-[var(--text-primary)]">{code}</code>
      </pre>
    </div>
  );
}

/* ─────────────────────── Endpoint Card ─────────────────────── */

function EndpointCard({ endpoint }: { endpoint: EndpointDoc }) {
  const methodColor = getMethodColor(endpoint.method);

  return (
    <div
      id={endpoint.id}
      className="scroll-mt-20 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-shadow hover:shadow-low"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Badge variant={methodColor} size="sm" className="shrink-0 font-mono uppercase tracking-wider min-w-[52px] justify-center">
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono text-[var(--accent-primary)] font-medium break-all">
            {endpoint.path}
          </code>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {endpoint.auth ? (
            <Badge variant="accent" size="sm" className="gap-1">
              <Lock className="h-3 w-3" />
              Auth
            </Badge>
          ) : (
            <Badge variant="default" size="sm" className="gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          )}
          {endpoint.role && (
            <Badge variant="warning" size="sm">{endpoint.role}</Badge>
          )}
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="details" className="border-0">
          <AccordionTrigger className="px-5 py-3 text-sm text-[var(--text-secondary)] hover:no-underline hover:text-[var(--text-primary)] [&[data-state=open]>svg]:rotate-180">
            <span className="text-left">{endpoint.description}</span>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-6">
              {/* Notes */}
              {endpoint.notes && endpoint.notes.length > 0 && (
                <div className="rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                    <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                      {endpoint.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Query Parameters */}
              {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[var(--accent-primary)]" />
                    Query Parameters
                  </h4>
                  <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] text-xs uppercase">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Name</th>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-left px-4 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {endpoint.queryParams.map((param) => (
                          <tr key={param.name}>
                            <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent-primary)]">
                              {param.name}
                              {param.required && <span className="text-[var(--semantic-danger)] ml-0.5">*</span>}
                            </td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)] text-xs font-mono">{param.type}</td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                              {param.description}
                              {param.example !== undefined && (
                                <span className="block mt-0.5 text-xs text-[var(--text-tertiary)]">
                                  e.g. {JSON.stringify(param.example)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Body Fields */}
              {endpoint.bodyFields && endpoint.bodyFields.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Braces className="h-4 w-4 text-[var(--accent-primary)]" />
                    Request Body
                  </h4>
                  <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] text-xs uppercase">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Field</th>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-left px-4 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {endpoint.bodyFields.map((field) => (
                          <tr key={field.name}>
                            <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent-primary)]">
                              {field.name}
                              {field.required && <span className="text-[var(--semantic-danger)] ml-0.5">*</span>}
                            </td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)] text-xs font-mono">{field.type}</td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                              {field.description}
                              {field.example !== undefined && (
                                <span className="block mt-0.5 text-xs text-[var(--text-tertiary)]">
                                  e.g. {JSON.stringify(field.example)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Code Examples */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[var(--accent-primary)]" />
                  Code Examples
                </h4>
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="curl" className="gap-1.5 text-xs">
                      <Terminal className="h-3.5 w-3.5" />
                      cURL
                    </TabsTrigger>
                    <TabsTrigger value="fetch" className="gap-1.5 text-xs">
                      <Globe className="h-3.5 w-3.5" />
                      Fetch
                    </TabsTrigger>
                    <TabsTrigger value="ts" className="gap-1.5 text-xs">
                      <Code2 className="h-3.5 w-3.5" />
                      TypeScript
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="curl">
                    <CodeBlock code={buildCurl(endpoint)} language="bash" />
                  </TabsContent>
                  <TabsContent value="fetch">
                    <CodeBlock code={buildFetch(endpoint)} language="javascript" />
                  </TabsContent>
                  <TabsContent value="ts">
                    <CodeBlock code={buildTypescript(endpoint)} language="typescript" />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Response */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Server className="h-4 w-4 text-[var(--semantic-success)]" />
                  Response
                </h4>
                {endpoint.responseFields && endpoint.responseFields.length > 0 && (
                  <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden mb-3">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] text-xs uppercase">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Field</th>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-left px-4 py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {endpoint.responseFields.map((field) => (
                          <tr key={field.name}>
                            <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent-primary)]">{field.name}</td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)] text-xs font-mono">{field.type}</td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)]">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} language="json" />
              </div>

              {/* Error Examples */}
              {endpoint.errorExamples && endpoint.errorExamples.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[var(--semantic-danger)]" />
                    Error Responses
                  </h4>
                  <div className="space-y-3">
                    {endpoint.errorExamples.map((err, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="danger" size="sm">{err.code}</Badge>
                          <span className="text-xs text-[var(--text-secondary)]">{err.title}</span>
                        </div>
                        <CodeBlock code={JSON.stringify(err.body, null, 2)} language="json" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/* ─────────────────────── Authentication Section ─────────────────────── */

function AuthSection() {
  return (
    <div id="overview-auth" className="scroll-mt-20 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--accent-primary)]" />
          Authentication
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          All API endpoints (except Health checks) require Bearer token authentication.
        </p>
      </div>

      <CodeBlock
        code={`Authorization: Bearer YOUR_API_TOKEN`}
        language="http"
      />

      <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Header</th>
              <th className="text-left px-4 py-2.5 font-medium">Value</th>
              <th className="text-left px-4 py-2.5 font-medium">Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            <tr>
              <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent-primary)]">Authorization</td>
              <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">Bearer {`<token>`}</td>
              <td className="px-4 py-2.5"><Badge variant="success" size="sm">Yes</Badge></td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent-primary)]">Content-Type</td>
              <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">application/json</td>
              <td className="px-4 py-2.5"><Badge variant="default" size="sm">For POST/PATCH</Badge></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-[var(--semantic-danger)]/5 border border-[var(--semantic-danger)]/10 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--semantic-danger)] mt-0.5 shrink-0" />
          <div className="text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)] mb-1">API Token Security</p>
            <ul className="space-y-1">
              <li>Store tokens in environment variables, never in client-side code</li>
              <li>Use a separate token per environment (dev, staging, production)</li>
              <li>Rotate tokens regularly via Settings → API Keys</li>
              <li>Tokens carry your organization permissions — keep them secret</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Rate Limits Section ─────────────────────── */

function RateLimitsSection() {
  return (
    <div id="overview-limits" className="scroll-mt-20 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Clock className="h-5 w-5 text-[var(--accent-primary)]" />
          Rate Limits & Conventions
        </h2>
      </div>

      <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Resource</th>
              <th className="text-left px-4 py-2.5 font-medium">Limit</th>
              <th className="text-left px-4 py-2.5 font-medium">Window</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {[
              { resource: "General API", limit: "100 requests", window: "per minute" },
              { resource: "Workflow creation", limit: "10 requests", window: "per minute" },
              { resource: "Run agent", limit: "30 requests", window: "per minute" },
              { resource: "Search", limit: "20 requests", window: "per minute" },
              { resource: "SSE events", limit: "5 concurrent", window: "per client" },
            ].map((row) => (
              <tr key={row.resource}>
                <td className="px-4 py-2.5 text-[var(--text-primary)] font-medium">{row.resource}</td>
                <td className="px-4 py-2.5 text-[var(--text-secondary)]">{row.limit}</td>
                <td className="px-4 py-2.5 text-[var(--text-secondary)]">{row.window}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "Request IDs", desc: "Every response includes an X-Request-ID header for debugging" },
          { label: "Pagination", desc: "Use limit/offset. Check total for total count." },
          { label: "Timestamps", desc: "All timestamps are ISO 8601 UTC strings" },
          { label: "CORS", desc: "All endpoints support CORS preflight OPTIONS requests" },
          { label: "Errors", desc: "Standard error format: { error: { code, message, status } }" },
          { label: "Versioning", desc: "Base URL: /api/v1 (implicit — current version)" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Sidebar ─────────────────────── */

function Sidebar({
  groups,
  activeSection,
  searchQuery,
  onSearchChange,
  onNavigate,
}: {
  groups: ApiGroup[];
  activeSection: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigate: (id: string) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-[var(--accent-primary)] text-white shadow-lg flex items-center justify-center"
        aria-label="Toggle navigation"
      >
        <BookOpen className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-y-auto",
          "lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16",
          "transform transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-sm"
            />
          </div>

          {/* Nav Groups */}
          <nav className="space-y-1">
            {groups.map((group) => {
              const Icon = group.icon;
              const isActive = activeSection === group.id;
              const hasEndpoints = group.endpoints.length > 0;

              return (
                <div key={group.id}>
                  <button
                    onClick={() => {
                      onNavigate(group.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    {group.endpoints.length > 0 && (
                      <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-surface-2)] px-1.5 py-0.5 rounded">
                        {group.endpoints.length}
                      </span>
                    )}
                  </button>

                  {/* Endpoint sub-nav */}
                  {hasEndpoints && isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="ml-4 mt-0.5 space-y-0.5 overflow-hidden"
                    >
                      {group.endpoints.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => {
                            onNavigate(ep.id);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors",
                            activeSection === ep.id
                              ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
                          )}
                        >
                          <Badge
                            variant={getMethodColor(ep.method)}
                            size="sm"
                            className="text-[10px] px-1 py-0 min-w-[36px] justify-center"
                          >
                            {ep.method}
                          </Badge>
                          <span className="truncate">{ep.path.split("/").pop()}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

/* ─────────────────────── Main Content ─────────────────────── */

export default function DocsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const mainRef = useRef<HTMLDivElement>(null);

  // Filter groups/endpoints based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return API_GROUPS;
    const q = searchQuery.toLowerCase();
    return API_GROUPS.map((group) => ({
      ...group,
      endpoints: group.endpoints.filter(
        (ep) =>
          ep.path.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q) ||
          ep.tags.some((t) => t.toLowerCase().includes(q))
      ),
    })).filter(
      (group) =>
        group.id === "overview" ||
        group.label.toLowerCase().includes(q) ||
        group.endpoints.length > 0
    );
  }, [searchQuery]);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const ids = ["overview", "overview-auth", "overview-limits"];
    for (const group of API_GROUPS) {
      ids.push(group.id);
      for (const ep of group.endpoints) ids.push(ep.id);
    }

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [filteredGroups]);

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const totalEndpoints = API_GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]" ref={mainRef}>
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="accent" size="sm" className="gap-1">
                <Code2 className="h-3 w-3" />
                REST API
              </Badge>
              <Badge variant="default" size="sm">{totalEndpoints} endpoints</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              API Documentation
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Build integrations with the Multi-Model Agent Platform. Create workflows,
              run agents, manage spaces, and access artifacts programmatically.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] px-4 py-2.5 text-sm">
                <Globe className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="font-mono text-[var(--text-secondary)]">https://api.example.com</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] px-4 py-2.5 text-sm">
                <Lock className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="text-[var(--text-secondary)]">Bearer token auth</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] px-4 py-2.5 text-sm">
                <Braces className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="text-[var(--text-secondary)]">JSON responses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <Sidebar
            groups={filteredGroups}
            activeSection={activeSection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNavigate={handleNavigate}
          />

          {/* Main */}
          <div className="flex-1 min-w-0 lg:ml-0">
            <div className="space-y-12">
              {/* Overview */}
              {!searchQuery && (
                <section id="overview" className="scroll-mt-20 space-y-10">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Getting Started
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      The Computer API is organized around RESTful principles. All requests return JSON,
                      use standard HTTP methods, and return consistent error formats. This reference
                      covers every endpoint available in the platform.
                    </p>
                  </div>

                  <Separator />
                  <AuthSection />

                  <Separator />
                  <RateLimitsSection />

                  <Separator />
                </section>
              )}

              {/* API Groups */}
              {filteredGroups.map(
                (group) =>
                  group.endpoints.length > 0 && (
                    <section key={group.id} id={group.id} className="scroll-mt-20">
                      <div className="mb-6">
                        <div className="flex items-center gap-2.5 mb-2">
                          <group.icon className="h-5 w-5 text-[var(--accent-primary)]" />
                          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                            {group.label}
                          </h2>
                          <Badge variant="default" size="sm">{group.endpoints.length}</Badge>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {group.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {group.endpoints.map((endpoint) => (
                          <EndpointCard key={endpoint.id} endpoint={endpoint} />
                        ))}
                      </div>
                    </section>
                  )
              )}

              {/* No results */}
              {searchQuery &&
                filteredGroups.every((g) => g.endpoints.length === 0) && (
                  <div className="text-center py-16">
                    <SearchIcon className="mx-auto h-10 w-10 text-[var(--text-tertiary)] mb-3" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      No endpoints match &quot;{searchQuery}&quot;
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
