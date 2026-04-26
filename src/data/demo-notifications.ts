/**
 * Demo notifications for the Multi-Model Agent Platform.
 *
 * 10 realistic notifications covering all supported categories:
 * workflow_complete, clarification_needed, approval_required, credit_low,
 * system_alert, connector_error, artifact_ready, memory_stored, task_failed,
 * member_joined.
 */

import type { Notification } from "@/src/types/frontend";

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "ntf_001_workflow_complete",
    category: "workflow_complete",
    title: "Workflow completed",
    message:
      'Your workflow "Q4 Revenue Forecast — Deep Research" finished successfully with 8 artifacts generated.',
    createdAt: "2025-01-20T09:34:00Z",
    read: false,
    actionHref: "/w/wf_q4_forecast",
    entityId: "wf_q4_forecast",
    entityType: "workflow",
  },
  {
    id: "ntf_002_clarification",
    category: "clarification_needed",
    title: "Clarification needed",
    message:
      'The orchestrator is blocked on the task "Compare pricing models". It needs to know whether to include enterprise tier discounts.',
    createdAt: "2025-01-20T08:12:00Z",
    read: false,
    actionHref: "/w/wf_pricing_compare?clarify=clf_9a3b2c1d",
    entityId: "clf_9a3b2c1d",
    entityType: "clarification",
  },
  {
    id: "ntf_003_approval",
    category: "approval_required",
    title: "Approval required",
    message:
      'Task "Deploy sentiment pipeline to production" is awaiting your approval before proceeding. Estimated cost: $2.40.',
    createdAt: "2025-01-19T17:55:00Z",
    read: false,
    actionHref: "/w/wf_sentiment_pipeline?approve=tsk_7f4e2a1b",
    entityId: "tsk_7f4e2a1b",
    entityType: "task",
  },
  {
    id: "ntf_004_credit_low",
    category: "credit_low",
    title: "Credit balance low",
    message:
      "Your org credit balance has dropped below $10.00. Workflows may be paused when balance reaches $0.00.",
    createdAt: "2025-01-19T14:20:00Z",
    read: false,
    actionHref: "/settings?tab=billing",
    entityId: null,
    entityType: "billing",
  },
  {
    id: "ntf_005_system_alert",
    category: "system_alert",
    title: "Scheduled maintenance",
    message:
      "Platform maintenance is scheduled for 2025-01-22 at 02:00 UTC. Running workflows will be gracefully paused.",
    createdAt: "2025-01-19T11:00:00Z",
    read: true,
    actionHref: null,
    entityId: null,
    entityType: "system",
  },
  {
    id: "ntf_006_connector_error",
    category: "connector_error",
    title: "Connector error",
    message:
      'The Salesforce connector failed to sync. Error: "OAuth token expired — re-authorisation required."',
    createdAt: "2025-01-18T22:45:00Z",
    read: true,
    actionHref: "/connectors?fix=conn_salesforce",
    entityId: "conn_salesforce",
    entityType: "system",
  },
  {
    id: "ntf_007_artifact_ready",
    category: "artifact_ready",
    title: "Artifact ready",
    message:
      'Artifact "Series B Investment Memo (v3)" is now available for review and download.',
    createdAt: "2025-01-18T16:30:00Z",
    read: true,
    actionHref: "/library?artifact=art_series_b_memo_v3",
    entityId: "art_series_b_memo_v3",
    entityType: "workflow",
  },
  {
    id: "ntf_008_memory_stored",
    category: "memory_stored",
    title: "Memory stored",
    message:
      'Your feedback on the "React auth test generation" workflow has been stored as episodic memory and will inform future code-generation tasks.',
    createdAt: "2025-01-18T10:15:00Z",
    read: true,
    actionHref: "/settings?tab=memory",
    entityId: "mem_ep_8d2f1a3e",
    entityType: "system",
  },
  {
    id: "ntf_009_task_failed",
    category: "task_failed",
    title: "Task failed",
    message:
      'Task "LinkedIn profile extraction" failed after 3 attempts. Last error: "Rate limit exceeded — retry in 15 minutes."',
    createdAt: "2025-01-17T19:20:00Z",
    read: true,
    actionHref: "/w/wf_linkedin_extract",
    entityId: "tsk_5c1a9b2e",
    entityType: "task",
  },
  {
    id: "ntf_010_member_joined",
    category: "member_joined",
    title: "New member joined",
    message:
      'Sarah Chen (sarah.chen@acme.com) has joined the "Competitive Intel" space as a member.',
    createdAt: "2025-01-17T13:05:00Z",
    read: true,
    actionHref: "/spaces/spc_competitive_intel",
    entityId: "usr_sarah_chen_001",
    entityType: "system",
  },
];
