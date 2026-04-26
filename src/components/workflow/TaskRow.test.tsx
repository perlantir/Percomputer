import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskRow } from "./TaskRow";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

vi.mock("lucide-react", () => ({
  ChevronDown: () => <svg data-testid="chevron-down" />,
  ChevronRight: () => <svg data-testid="chevron-right" />,
  Clock: () => <svg data-testid="icon-clock" />,
  Wrench: () => <svg data-testid="icon-wrench" />,
  RotateCcw: () => <svg data-testid="icon-retry" />,
  Terminal: () => <svg data-testid="icon-terminal" />,
}));

vi.mock("@/src/components/ui/badge", () => ({
  Badge: ({ children, variant, size }: any) => (
    <span data-variant={variant} data-size={size}>{children}</span>
  ),
}));

/* ------------------------------------------------------------------ */
/*  Demo data                                                           */
/* ------------------------------------------------------------------ */

const DEMO_TASK = {
  id: "task-01",
  index: 0,
  kind: "research" as const,
  name: "Research market trends",
  description: "Gather latest industry reports and competitor analysis.",
  status: "succeeded" as const,
  assignedModel: "Claude Opus 4.7",
  durationMs: 12_340,
  toolCalls: [
    { tool: "web_search", calls: 3 },
    { tool: "pdf_reader", calls: 1 },
  ],
  retryCount: 2,
  dependencies: ["task-00"],
  isActive: false,
};

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("TaskRow", () => {
  it("renders task name and description", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.getByText(DEMO_TASK.name)).toBeInTheDocument();
    expect(screen.getByText(DEMO_TASK.description)).toBeInTheDocument();
  });

  it("renders kind label and assigned model", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.getByText("Research")).toBeInTheDocument();
    expect(screen.getByText(DEMO_TASK.assignedModel)).toBeInTheDocument();
  });

  it("renders formatted duration", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.getByText("12.3s")).toBeInTheDocument();
  });

  it("renders tool call summary", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.getByText(/4 tools/)).toBeInTheDocument();
  });

  it("renders retry count", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.getByText(/2 retry/)).toBeInTheDocument();
  });

  it("renders status text", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.getByText("succeeded")).toBeInTheDocument();
  });

  it("does NOT expand detail by default", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.queryByText("Objective")).not.toBeInTheDocument();
    expect(screen.queryByText("Tool Calls")).not.toBeInTheDocument();
  });

  it("expands detail section when header is clicked", () => {
    render(<TaskRow {...DEMO_TASK} />);
    const header = screen.getByText(DEMO_TASK.name).closest("button");
    if (!header) throw new Error("Header button not found");
    fireEvent.click(header);
    expect(screen.getByText("Objective")).toBeInTheDocument();
    expect(screen.getByText("Tool Calls")).toBeInTheDocument();
  });

  it("collapses detail section when header is clicked again", () => {
    render(<TaskRow {...DEMO_TASK} />);
    const header = screen.getByText(DEMO_TASK.name).closest("button");
    if (!header) throw new Error("Header button not found");
    fireEvent.click(header); // expand
    expect(screen.getByText("Objective")).toBeInTheDocument();
    fireEvent.click(header); // collapse
    expect(screen.queryByText("Objective")).not.toBeInTheDocument();
  });

  it("shows chevron-right when collapsed", () => {
    render(<TaskRow {...DEMO_TASK} />);
    expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
  });

  it("shows chevron-down when expanded", () => {
    render(<TaskRow {...DEMO_TASK} />);
    const header = screen.getByText(DEMO_TASK.name).closest("button");
    if (!header) throw new Error("Header button not found");
    fireEvent.click(header);
    expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
  });

  it("renders active state styles when isActive=true", () => {
    render(<TaskRow {...DEMO_TASK} isActive={true} />);
    const row = screen.getByText(DEMO_TASK.name).closest("div[class*='relative']");
    expect(row).toHaveClass("border-l-[var(--accent-primary)]");
  });

  it("does not show retry section when retryCount is 0", () => {
    render(<TaskRow {...DEMO_TASK} retryCount={0} />);
    const header = screen.getByText(DEMO_TASK.name).closest("button");
    if (!header) throw new Error("Header button not found");
    fireEvent.click(header);
    expect(screen.queryByText("Attempt History")).not.toBeInTheDocument();
  });

  it("does not show tool calls section when empty", () => {
    render(<TaskRow {...DEMO_TASK} toolCalls={[]} />);
    const header = screen.getByText(DEMO_TASK.name).closest("button");
    if (!header) throw new Error("Header button not found");
    fireEvent.click(header);
    expect(screen.queryByText("Tool Calls")).not.toBeInTheDocument();
  });

  it("renders attempt history with correct labels when expanded", () => {
    render(<TaskRow {...DEMO_TASK} retryCount={2} />);
    const header = screen.getByText(DEMO_TASK.name).closest("button");
    if (!header) throw new Error("Header button not found");
    fireEvent.click(header);
    expect(screen.getByText("Attempt 1")).toBeInTheDocument();
    expect(screen.getByText("Attempt 2")).toBeInTheDocument();
    expect(screen.getByText("Attempt 3")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("succeeded")).toBeInTheDocument();
  });

  it("renders status transition pipeline in expanded view", () => {
    render(<TaskRow {...DEMO_TASK} status="succeeded" />);
    const header = screen.getByText(DEMO_TASK.name).closest("button");
    if (!header) throw new Error("Header button not found");
    fireEvent.click(header);
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("formats milliseconds duration correctly", () => {
    render(<TaskRow {...DEMO_TASK} durationMs={800} />);
    expect(screen.getByText("800ms")).toBeInTheDocument();
  });

  it("formats minutes duration correctly", () => {
    render(<TaskRow {...DEMO_TASK} durationMs={125_000} />);
    expect(screen.getByText("2m 5s")).toBeInTheDocument();
  });

  it("is accessible via button role for expand/collapse", () => {
    render(<TaskRow {...DEMO_TASK} />);
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("type", "button");
  });
});
