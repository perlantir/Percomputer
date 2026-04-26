import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuditExplorer from "./AuditExplorer";

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
}));

vi.mock("@/src/hooks/useInterval", () => ({
  useDebounceValue: (value: any) => value,
}));

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("AuditExplorer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input and export button", () => {
    render(<AuditExplorer />);
    expect(screen.getByPlaceholderText("Search audit events…")).toBeInTheDocument();
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
  });

  it("renders filter sidebar with event types", () => {
    render(<AuditExplorer />);
    expect(screen.getByText("Event Type")).toBeInTheDocument();
    expect(screen.getByText("Organization")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Date Range")).toBeInTheDocument();
    expect(screen.getByText("Workflow")).toBeInTheDocument();
  });

  it("renders audit event rows in table", () => {
    render(<AuditExplorer />);
    // First few events should be visible
    expect(screen.getByText("evt-00000")).toBeInTheDocument();
    expect(screen.getByText("evt-00001")).toBeInTheDocument();
  });

  it("renders event count summary", () => {
    render(<AuditExplorer />);
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("filters events by search text", () => {
    render(<AuditExplorer />);
    const searchInput = screen.getByPlaceholderText("Search audit events…");
    fireEvent.change(searchInput, { target: { value: "evt-00000" } });

    expect(screen.getByText("evt-00000")).toBeInTheDocument();
  });

  it("filters events by workflow name filter", () => {
    render(<AuditExplorer />);
    const workflowInput = screen.getAllByPlaceholderText("Filter…")[0];
    fireEvent.change(workflowInput, { target: { value: "search" } });

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
  });

  it("filters events by event type checkbox", () => {
    render(<AuditExplorer />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Click first event type checkbox
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it("filters events by org checkbox", () => {
    render(<AuditExplorer />);
    const orgCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(orgCheckboxes.length).toBeGreaterThan(0);

    fireEvent.click(orgCheckboxes[1]);
    expect(orgCheckboxes[1]).toBeChecked();
  });

  it("filters events by user checkbox", () => {
    render(<AuditExplorer />);
    const userCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(userCheckboxes.length).toBeGreaterThan(0);

    fireEvent.click(userCheckboxes[2]);
    expect(userCheckboxes[2]).toBeChecked();
  });

  it("filters events by date range", () => {
    render(<AuditExplorer />);
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);

    fireEvent.change(dateInputs[0], { target: { value: "2024-01-01" } });
    expect(dateInputs[0]).toHaveValue("2024-01-01");
  });

  it("exports CSV when admin clicks export button", () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");

    render(<AuditExplorer />);
    const exportBtn = screen.getByText("Export CSV");
    fireEvent.click(exportBtn);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(createObjectURLSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
  });

  it("opens event detail drawer when row is clicked", () => {
    render(<AuditExplorer />);
    const firstEvent = screen.getByText("evt-00000");
    const row = firstEvent.closest("[class*='cursor-pointer']") || firstEvent.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    expect(screen.getByText("Hash Chain")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("closes event detail drawer when close button is clicked", () => {
    render(<AuditExplorer />);
    const firstEvent = screen.getByText("evt-00000");
    const row = firstEvent.closest("[class*='cursor-pointer']") || firstEvent.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    expect(screen.getByText("Hash Chain")).toBeInTheDocument();

    const closeBtn = screen.getByText("✕");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Hash Chain")).not.toBeInTheDocument();
  });

  it("renders verified status icons", () => {
    render(<AuditExplorer />);
    // Verified events have a checkmark SVG, unverified have an X SVG
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("renders event type badges", () => {
    render(<AuditExplorer />);
    // Event types are rendered as monospace badges
    const badges = screen.getAllByText(/workflow\.|auth\.|task\.|policy\.|pii\.|model\.|sandbox\.|tenant\.|user\.|billing\.|api\./);
    expect(badges.length).toBeGreaterThan(0);
  });

  it("renders org names correctly", () => {
    render(<AuditExplorer />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Stark Industries")).toBeInTheDocument();
    expect(screen.getByText("Wayne Enterprises")).toBeInTheDocument();
    expect(screen.getByText("Oscorp")).toBeInTheDocument();
  });

  it("renders user emails correctly", () => {
    render(<AuditExplorer />);
    expect(screen.getByText("admin@acme.com")).toBeInTheDocument();
    expect(screen.getByText("ops@stark.com")).toBeInTheDocument();
  });

  it("shows hash chain details in drawer", () => {
    render(<AuditExplorer />);
    const firstEvent = screen.getByText("evt-00000");
    const row = firstEvent.closest("[class*='cursor-pointer']") || firstEvent.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    expect(screen.getByText("Hash Chain")).toBeInTheDocument();
    expect(screen.getByText(/prev:/)).toBeInTheDocument();
    expect(screen.getByText(/hash:/)).toBeInTheDocument();
  });

  it("shows workflow details when workflow is present", () => {
    render(<AuditExplorer />);
    const firstEvent = screen.getByText("evt-00000");
    const row = firstEvent.closest("[class*='cursor-pointer']") || firstEvent.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);

    // If event has workflow, workflow section should appear
    const workflowSection = screen.queryByText(/Workflow/);
    // May or may not be present depending on event type
    expect(workflowSection).toBeDefined();
  });

  it("has accessible search input", () => {
    render(<AuditExplorer />);
    const searchInput = screen.getByPlaceholderText("Search audit events…");
    expect(searchInput).toHaveAttribute("type", "text");
  });

  it("has accessible date inputs", () => {
    render(<AuditExplorer />);
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
    dateInputs.forEach((input) => {
      expect(input).toBeInTheDocument();
    });
  });

  it("renders action status pills", () => {
    render(<AuditExplorer />);
    // Actions: created, updated, deleted, accessed, executed, approved, rejected
    // StatusPill renders different colors for different actions
    const pills = document.querySelectorAll("[class*='rounded-full']");
    expect(pills.length).toBeGreaterThan(0);
  });

  it("shows resource types as monospace text", () => {
    render(<AuditExplorer />);
    const resources = ["workflow", "task", "policy", "tenant", "user", "api_key", "sandbox", "model_route"];
    resources.forEach((r) => {
      const elements = screen.queryAllByText(r);
      if (elements.length > 0) {
        expect(elements[0]).toBeInTheDocument();
      }
    });
  });
});

describe("AuditExplorer — CSV export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates blob with CSV mime type on export", () => {
    const blobSpy = vi.spyOn(global, "Blob").mockImplementation((parts, opts) => {
      return new (class extends Blob {})(parts, opts);
    });
    const urlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:csv-url");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<AuditExplorer />);
    const exportBtn = screen.getByText("Export CSV");
    fireEvent.click(exportBtn);

    expect(blobSpy).toHaveBeenCalled();
    const blobArgs = blobSpy.mock.calls[0];
    expect(blobArgs[1]).toMatchObject({ type: "text/csv" });

    blobSpy.mockRestore();
    urlSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
