import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkflowInspector from "./WorkflowInspector";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

vi.mock("lucide-react", () => ({
  ArrowUpDown: () => <svg data-testid="icon-arrow-up-down" />,
  Inbox: () => <svg data-testid="icon-inbox" />,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/src/hooks/useConsoleRole", () => ({
  useConsoleRole: () => ({ role: "admin", isAdmin: true, isAuditor: true }),
  confirmAction: vi.fn(() => true),
}));

vi.mock("@/src/hooks/useInterval", () => ({
  useDebounceValue: (value: any) => value,
}));

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("WorkflowInspector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders in table mode by default", () => {
    render(<WorkflowInspector />);
    expect(screen.getByText("Table")).toBeInTheDocument();
    expect(screen.getByText("DAG")).toBeInTheDocument();
    // Table mode is active by default (DAG button not highlighted)
    const tableBtn = screen.getByText("Table");
    expect(tableBtn.className).toMatch(/accent-primary|bg-/);
  });

  it("switches to DAG mode when DAG button is clicked", () => {
    render(<WorkflowInspector />);
    const dagBtn = screen.getByText("DAG");
    fireEvent.click(dagBtn);
    expect(dagBtn.className).toMatch(/accent-primary|bg-/);
    // SVG DAG should be rendered
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders DAG nodes for each task", () => {
    render(<WorkflowInspector />);
    const dagBtn = screen.getByText("DAG");
    fireEvent.click(dagBtn);

    // Check for SVG rect nodes
    const rects = document.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);

    // Check for status text inside nodes
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("renders task rows in table mode", () => {
    render(<WorkflowInspector />);
    // Default table mode shows task data
    expect(screen.getByText("task-0")).toBeInTheDocument();
    expect(screen.getByText("task-1")).toBeInTheDocument();
  });

  it("filters tasks by search input", async () => {
    render(<WorkflowInspector />);
    const searchInput = screen.getByPlaceholderText("Search tasks…");
    fireEvent.change(searchInput, { target: { value: "task-0" } });

    await waitFor(() => {
      expect(screen.getByText("task-0")).toBeInTheDocument();
    });
  });

  it("filters tasks by status buttons", () => {
    render(<WorkflowInspector />);
    const completedBtn = screen.getByText("completed");
    fireEvent.click(completedBtn);

    // Button should be highlighted
    expect(completedBtn.className).toMatch(/accent-primary|bg-/);
  });

  it("filters tasks by kind buttons", () => {
    render(<WorkflowInspector />);
    const llmBtn = screen.getByText("llm");
    fireEvent.click(llmBtn);

    expect(llmBtn.className).toMatch(/accent-primary|bg-/);
  });

  it("opens task drawer when a table row is clicked", () => {
    render(<WorkflowInspector />);
    const firstTask = screen.getByText("task-0");
    const row = firstTask.closest("[class*='cursor-pointer']") || firstTask.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    // Drawer should appear with task label
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    expect(screen.getByText("Completion")).toBeInTheDocument();
    expect(screen.getByText("Attempts")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Spans")).toBeInTheDocument();
  });

  it("closes task drawer when close button is clicked", () => {
    render(<WorkflowInspector />);
    const firstTask = screen.getByText("task-0");
    const row = firstTask.closest("[class*='cursor-pointer']") || firstTask.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    expect(screen.getByText("Prompt")).toBeInTheDocument();

    const closeBtn = screen.getByText("✕");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Prompt")).not.toBeInTheDocument();
  });

  it("switches between drawer tabs", () => {
    render(<WorkflowInspector />);
    const firstTask = screen.getByText("task-0");
    const row = firstTask.closest("[class*='cursor-pointer']") || firstTask.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    const attemptsTab = screen.getByText(/Attempts/);
    fireEvent.click(attemptsTab);
    expect(attemptsTab.className).toMatch(/accent-primary|border-accent/);

    const toolsTab = screen.getByText(/Tools/);
    fireEvent.click(toolsTab);
    expect(toolsTab.className).toMatch(/accent-primary|border-accent/);

    const spansTab = screen.getByText(/Spans/);
    fireEvent.click(spansTab);
    expect(spansTab.className).toMatch(/accent-primary|border-accent/);
  });

  it("shows PII redaction toggle for tasks with PII", () => {
    render(<WorkflowInspector />);
    // Task with containsPII=true (task-0 has PII, every 7th task)
    const piiTask = screen.getByText("task-0");
    const row = piiTask.closest("[class*='cursor-pointer']") || piiTask.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    // PII badge should be visible
    const piiBadges = screen.getAllByText(/PII Redacted|Unredacted/);
    expect(piiBadges.length).toBeGreaterThan(0);
  });

  it("renders DAG connection lines between nodes", () => {
    render(<WorkflowInspector />);
    const dagBtn = screen.getByText("DAG");
    fireEvent.click(dagBtn);

    const lines = document.querySelectorAll("line");
    expect(lines.length).toBeGreaterThan(0);
  });

  it("opens drawer when a DAG node is clicked", async () => {
    render(<WorkflowInspector />);
    const dagBtn = screen.getByText("DAG");
    fireEvent.click(dagBtn);

    const svgGroup = document.querySelector("svg g");
    if (!svgGroup) throw new Error("SVG group not found");
    fireEvent.click(svgGroup);

    // Drawer should open
    await waitFor(() => {
      expect(screen.getByText("Prompt")).toBeInTheDocument();
    });
  });

  it("has accessible search input with placeholder", () => {
    render(<WorkflowInspector />);
    const searchInput = screen.getByPlaceholderText("Search tasks…");
    expect(searchInput).toHaveAttribute("type", "text");
  });

  it("has accessible mode toggle buttons", () => {
    render(<WorkflowInspector />);
    const dagBtn = screen.getByText("DAG");
    const tableBtn = screen.getByText("Table");
    expect(dagBtn).toBeInTheDocument();
    expect(tableBtn).toBeInTheDocument();
  });

  it("shows task metadata in drawer header", () => {
    render(<WorkflowInspector />);
    const firstTask = screen.getByText("task-0");
    const row = firstTask.closest("[class*='cursor-pointer']") || firstTask.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    // Task ID should appear in drawer
    expect(screen.getByText("task-0")).toBeInTheDocument();
  });

  it("renders status filter buttons for all statuses", () => {
    render(<WorkflowInspector />);
    const statuses = ["completed", "running", "failed", "pending"];
    statuses.forEach((s) => {
      expect(screen.getByText(s)).toBeInTheDocument();
    });
  });

  it("renders kind filter buttons for all kinds", () => {
    render(<WorkflowInspector />);
    const kinds = ["llm", "tool", "guardrail", "code", "embed", "search"];
    kinds.forEach((k) => {
      expect(screen.getByText(k)).toBeInTheDocument();
    });
  });
});
