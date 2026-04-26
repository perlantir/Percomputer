import type { Meta, StoryObj } from "@storybook/react";
import { SourceCard } from "./SourceCard";

/**
 * SourceCard displays information about a data source or integration
 * with metadata, status indicators, and action controls.
 */
const meta: Meta<typeof SourceCard> = {
  title: "Workflow/SourceCard",
  component: SourceCard,
  parameters: {
    layout: "centered",
    themes: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "Display name of the source",
    },
    type: {
      control: "select",
      options: ["api", "database", "file", "stream", "webhook", "queue"],
      description: "Type of the data source",
    },
    status: {
      control: "select",
      options: ["connected", "disconnected", "error", "syncing"],
      description: "Connection status of the source",
    },
    description: {
      control: "text",
      description: "Optional description text",
    },
    lastSync: {
      control: "text",
      description: "Last sync timestamp (ISO string or relative)",
    },
    recordCount: {
      control: "number",
      description: "Number of records/items in the source",
    },
    onSync: { action: "sync" },
    onConfigure: { action: "configure" },
    onDelete: { action: "delete" },
  },
  args: {
    name: "PostgreSQL Database",
    type: "database",
    status: "connected",
    description: "Primary production database for user data",
    lastSync: "2 minutes ago",
    recordCount: 154320,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "PostgreSQL Database",
    type: "database",
    status: "connected",
    description: "Primary production database for user data",
    lastSync: "2 minutes ago",
    recordCount: 154320,
  },
};

export const API: Story = {
  args: {
    name: "REST API Integration",
    type: "api",
    status: "connected",
    description: "External payment gateway API",
    lastSync: "Just now",
    recordCount: 0,
  },
};

export const FileSource: Story = {
  args: {
    name: "CSV Uploads",
    type: "file",
    status: "connected",
    description: "Monthly report CSV files",
    lastSync: "1 hour ago",
    recordCount: 850,
  },
};

export const Stream: Story = {
  args: {
    name: "Kafka Events",
    type: "stream",
    status: "connected",
    description: "Real-time event stream from microservices",
    lastSync: "Live",
    recordCount: 999999,
  },
};

export const Webhook: Story = {
  args: {
    name: "GitHub Webhooks",
    type: "webhook",
    status: "connected",
    description: "Repository push and PR events",
    lastSync: "5 seconds ago",
    recordCount: 42,
  },
};

export const Queue: Story = {
  args: {
    name: "Redis Queue",
    type: "queue",
    status: "connected",
    description: "Background job processing queue",
    lastSync: "Active",
    recordCount: 12,
  },
};

export const Disconnected: Story = {
  args: {
    name: "MongoDB Replica",
    type: "database",
    status: "disconnected",
    description: "Analytics read replica",
    lastSync: "3 days ago",
    recordCount: 0,
  },
};

export const Error: Story = {
  args: {
    name: "Legacy MySQL",
    type: "database",
    status: "error",
    description: "Deprecated legacy database",
    lastSync: "Failed 10 minutes ago",
    recordCount: 0,
  },
};

export const Syncing: Story = {
  args: {
    name: "Data Warehouse",
    type: "database",
    status: "syncing",
    description: "Full sync in progress",
    lastSync: "Syncing...",
    recordCount: 154320,
  },
};

export const Minimal: Story = {
  args: {
    name: "Quick Source",
    type: "api",
    status: "connected",
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[640px]">
      <SourceCard
        name="PostgreSQL"
        type="database"
        status="connected"
        description="Primary DB"
        lastSync="2m ago"
        recordCount={154320}
      />
      <SourceCard
        name="REST API"
        type="api"
        status="connected"
        description="Payments API"
        lastSync="Just now"
        recordCount={0}
      />
      <SourceCard
        name="Kafka"
        type="stream"
        status="syncing"
        description="Event stream"
        lastSync="Syncing..."
        recordCount={999999}
      />
      <SourceCard
        name="Legacy DB"
        type="database"
        status="error"
        description="Deprecated"
        lastSync="Failed"
        recordCount={0}
      />
    </div>
  ),
};
