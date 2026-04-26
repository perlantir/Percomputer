import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";

/**
 * WorkflowStatusBadge displays the current status of a workflow or task
 * with color-coded indicators for quick visual scanning.
 */
const meta: Meta<typeof WorkflowStatusBadge> = {
  title: "Workflow/WorkflowStatusBadge",
  component: WorkflowStatusBadge,
  parameters: {
    layout: "centered",
    themes: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["idle", "running", "completed", "failed", "cancelled", "pending", "paused"],
      description: "The workflow execution status to display",
    },
    showLabel: {
      control: "boolean",
      description: "Show the text label alongside the status indicator",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the badge",
    },
    animate: {
      control: "boolean",
      description: "Enable pulse animation for active states",
    },
  },
  args: {
    status: "idle",
    showLabel: true,
    size: "md",
    animate: true,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: "idle",
  },
};

export const Running: Story = {
  args: {
    status: "running",
    animate: true,
  },
};

export const Completed: Story = {
  args: {
    status: "completed",
  },
};

export const Failed: Story = {
  args: {
    status: "failed",
  },
};

export const Cancelled: Story = {
  args: {
    status: "cancelled",
  },
};

export const Pending: Story = {
  args: {
    status: "pending",
  },
};

export const Paused: Story = {
  args: {
    status: "paused",
  },
};

export const WithoutLabel: Story = {
  args: {
    status: "running",
    showLabel: false,
    animate: true,
  },
};

export const Small: Story = {
  args: {
    status: "completed",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    status: "failed",
    size: "lg",
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["idle", "running", "completed", "failed", "cancelled", "pending", "paused"] as const).map(
        (status) => (
          <div key={status} className="flex items-center gap-4">
            <WorkflowStatusBadge status={status} size="md" showLabel />
            <WorkflowStatusBadge status={status} size="md" showLabel={false} />
          </div>
        )
      )}
    </div>
  ),
};

export const Pipeline: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <WorkflowStatusBadge status="completed" size="sm" />
      <span className="text-muted-foreground">&#8594;</span>
      <WorkflowStatusBadge status="completed" size="sm" />
      <span className="text-muted-foreground">&#8594;</span>
      <WorkflowStatusBadge status="running" size="sm" animate />
      <span className="text-muted-foreground">&#8594;</span>
      <WorkflowStatusBadge status="pending" size="sm" />
      <span className="text-muted-foreground">&#8594;</span>
      <WorkflowStatusBadge status="idle" size="sm" />
    </div>
  ),
};
