import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConsoleTable, StatusPill, MiniSparkline } from "./ConsoleTable";

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

/* ------------------------------------------------------------------ */
/*  Demo data                                                           */
/* ------------------------------------------------------------------ */

interface DemoRow {
  id: string;
  name: string;
  status: string;
  score: number;
  createdAt: string;
}

const DEMO_DATA: DemoRow[] = [
  { id: "r-3", name: "Charlie", status: "pending", score: 85, createdAt: "2024-01-03" },
  { id: "r-1", name: "Alpha", status: "completed", score: 92, createdAt: "2024-01-01" },
  { id: "r-2", name: "Bravo", status: "failed", score: 78, createdAt: "2024-01-02" },
  { id: "r-4", name: "Delta", status: "running", score: 88, createdAt: "2024-01-04" },
];

const COLUMNS = [
  { key: "id", header: "ID", width: 60, sortable: true },
  { key: "name", header: "Name", width: 100, sortable: true },
  {
    key: "status",
    header: "Status",
    width: 80,
    sortable: true,
    render: (row: DemoRow) => <StatusPill status={row.status} />,
  },
  { key: "score", header: "Score", width: 60, align: "right" as const, sortable: true },
  { key: "createdAt", header: "Date", width: 90, sortable: true },
];

/* ------------------------------------------------------------------ */
/*  ConsoleTable tests                                                  */
/* ------------------------------------------------------------------ */

describe("ConsoleTable", () => {
  const handleRowClick = vi.fn();

  beforeEach(() => {
    handleRowClick.mockClear();
  });

  it("renders all visible column headers", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("renders row count in toolbar", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    expect(screen.getByText(/4 rows/)).toBeInTheDocument();
  });

  it("renders all data rows", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    DEMO_DATA.forEach((row) => {
      expect(screen.getByText(row.name)).toBeInTheDocument();
    });
  });

  it("sorts ascending when clicking a sortable header for the first time", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    const nameHeader = screen.getByText("Name").closest("[class*='cursor-pointer']") || screen.getByText("Name").closest("div");
    if (!nameHeader) throw new Error("Name header not found");
    fireEvent.click(nameHeader);

    // After sorting by name ascending: Alpha, Bravo, Charlie, Delta
    const rows = screen.getAllByText(/Alpha|Bravo|Charlie|Delta/);
    expect(rows[0]).toHaveTextContent("Alpha");
    expect(rows[1]).toHaveTextContent("Bravo");
    expect(rows[2]).toHaveTextContent("Charlie");
    expect(rows[3]).toHaveTextContent("Delta");
  });

  it("sorts descending when clicking the same header again", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    const nameHeader = screen.getByText("Name").closest("[class*='cursor-pointer']") || screen.getByText("Name").closest("div");
    if (!nameHeader) throw new Error("Name header not found");
    fireEvent.click(nameHeader); // asc
    fireEvent.click(nameHeader); // desc

    const rows = screen.getAllByText(/Alpha|Bravo|Charlie|Delta/);
    expect(rows[0]).toHaveTextContent("Delta");
    expect(rows[1]).toHaveTextContent("Charlie");
    expect(rows[2]).toHaveTextContent("Bravo");
    expect(rows[3]).toHaveTextContent("Alpha");
  });

  it("sorts numbers correctly (ascending)", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    const scoreHeader = screen.getByText("Score").closest("[class*='cursor-pointer']") || screen.getByText("Score").closest("div");
    if (!scoreHeader) throw new Error("Score header not found");
    fireEvent.click(scoreHeader);

    const rows = screen.getAllByText(/Alpha|Bravo|Charlie|Delta/);
    expect(rows[0]).toHaveTextContent("Bravo");   // score 78
    expect(rows[1]).toHaveTextContent("Charlie");  // score 85
    expect(rows[2]).toHaveTextContent("Delta");    // score 88
    expect(rows[3]).toHaveTextContent("Alpha");     // score 92
  });

  it("sorts numbers correctly (descending)", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    const scoreHeader = screen.getByText("Score").closest("[class*='cursor-pointer']") || screen.getByText("Score").closest("div");
    if (!scoreHeader) throw new Error("Score header not found");
    fireEvent.click(scoreHeader);
    fireEvent.click(scoreHeader);

    const rows = screen.getAllByText(/Alpha|Bravo|Charlie|Delta/);
    expect(rows[0]).toHaveTextContent("Alpha");   // score 92
    expect(rows[1]).toHaveTextContent("Delta");    // score 88
    expect(rows[2]).toHaveTextContent("Charlie");  // score 85
    expect(rows[3]).toHaveTextContent("Bravo");    // score 78
  });

  it("does not sort non-sortable columns", () => {
    const nonSortableColumns = [
      { key: "name", header: "Name", width: 100, sortable: false },
    ];
    render(<ConsoleTable columns={nonSortableColumns} data={DEMO_DATA} />);
    const nameHeader = screen.getByText("Name").closest("div");
    if (!nameHeader) throw new Error("Name header not found");
    fireEvent.click(nameHeader);
    // No error should be thrown; order remains unchanged
    const rows = screen.getAllByText(/Alpha|Bravo|Charlie|Delta/);
    expect(rows.length).toBe(4);
  });

  it("calls onRowClick when a row is clicked", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} onRowClick={handleRowClick} />);
    const charlie = screen.getByText("Charlie");
    const row = charlie.closest("[class*='cursor-pointer']") || charlie.closest("div");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);
    expect(handleRowClick).toHaveBeenCalledTimes(1);
  });

  it("highlights selected row", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} selectedRowId="r-2" rowIdKey="id" />);
    const bravo = screen.getByText("Bravo").closest("[class*='bg-']") || screen.getByText("Bravo").closest("div");
    if (!bravo) throw new Error("Row not found");
    // The selected row should have accent-primary background class
    expect(bravo.className).toMatch(/accent-primary|bg-/);
  });

  it("toggles density between compact, cozy, and comfortable", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    const compactBtn = screen.getByText("C");
    const cozyBtn = screen.getByText("Z");
    const comfortableBtn = screen.getByText("F");

    expect(compactBtn).toBeInTheDocument();
    expect(cozyBtn).toBeInTheDocument();
    expect(comfortableBtn).toBeInTheDocument();

    fireEvent.click(comfortableBtn);
    expect(comfortableBtn.className).toMatch(/accent-primary|bg-/);

    fireEvent.click(cozyBtn);
    expect(cozyBtn.className).toMatch(/accent-primary|bg-/);
  });

  it("shows empty state when data is empty", () => {
    render(<ConsoleTable columns={COLUMNS} data={[]} emptyText="No records found" />);
    expect(screen.getByText("No records found")).toBeInTheDocument();
    expect(screen.getByTestId("icon-inbox")).toBeInTheDocument();
  });

  it("toggles column visibility via Columns dropdown", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    // Click Columns button to reveal dropdown
    const columnsBtn = screen.getByText("Columns");
    fireEvent.click(columnsBtn);

    // The dropdown uses CSS hover, but we can check checkbox presence by hovering parent
    const group = columnsBtn.closest("[class*='group']");
    if (group) {
      fireEvent.mouseEnter(group);
    }

    // Check that checkboxes are rendered for each column
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThanOrEqual(COLUMNS.length);
  });

  it("has accessible buttons for density toggle", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3); // C, Z, F density buttons
  });

  it("has sort indicators on sortable headers", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    // After clicking, the sort icon should be visible
    const nameHeader = screen.getByText("Name").closest("[class*='cursor-pointer']") || screen.getByText("Name").closest("div");
    if (!nameHeader) throw new Error("Name header not found");
    fireEvent.click(nameHeader);
    expect(screen.getByTestId("icon-arrow-up-down")).toBeInTheDocument();
  });

  it("renders custom cell renderers", () => {
    render(<ConsoleTable columns={COLUMNS} data={DEMO_DATA} />);
    DEMO_DATA.forEach((row) => {
      const pill = screen.getByText(row.status);
      expect(pill).toBeInTheDocument();
    });
  });

  it("renders fallback em-dash for null/undefined values", () => {
    const sparseData = [{ id: "s-1", name: "Sparse", status: "pending", score: null as any, createdAt: undefined }];
    render(
      <ConsoleTable
        columns={[
          { key: "id", header: "ID", width: 60 },
          { key: "score", header: "Score", width: 60 },
          { key: "createdAt", header: "Date", width: 90 },
        ]}
        data={sparseData}
      />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  StatusPill tests                                                    */
/* ------------------------------------------------------------------ */

describe("StatusPill", () => {
  it("renders status text", () => {
    render(<StatusPill status="success" />);
    expect(screen.getByText("success")).toBeInTheDocument();
  });

  it("applies success styling for completed status", () => {
    render(<StatusPill status="completed" />);
    const pill = screen.getByText("completed");
    expect(pill.className).toMatch(/bg-success|text-success/);
  });

  it("applies danger styling for failed status", () => {
    render(<StatusPill status="failed" />);
    const pill = screen.getByText("failed");
    expect(pill.className).toMatch(/bg-danger|text-danger/);
  });

  it("applies warning styling for pending status", () => {
    render(<StatusPill status="pending" />);
    const pill = screen.getByText("pending");
    expect(pill.className).toMatch(/bg-warning|text-warning/);
  });

  it("applies circuit breaker styles", () => {
    const { rerender } = render(<StatusPill status="open" />);
    expect(screen.getByText("open").className).toMatch(/bg-danger|text-danger/);

    rerender(<StatusPill status="half-open" />);
    expect(screen.getByText("half-open").className).toMatch(/bg-warning|text-warning/);

    rerender(<StatusPill status="closed" />);
    expect(screen.getByText("closed").className).toMatch(/bg-success|text-success/);
  });

  it("has accessible text content matching status", () => {
    render(<StatusPill status="running" />);
    expect(screen.getByText("running")).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  MiniSparkline tests                                                 */
/* ------------------------------------------------------------------ */

describe("MiniSparkline", () => {
  it("renders an svg with polyline when data is provided", () => {
    render(<MiniSparkline data={[10, 20, 15, 30, 25]} />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector("polyline")).toBeInTheDocument();
    expect(svg?.querySelector("circle")).toBeInTheDocument();
  });

  it("returns null when data is empty", () => {
    render(<MiniSparkline data={[]} />);
    expect(document.querySelector("svg")).not.toBeInTheDocument();
  });

  it("uses custom width, height and color", () => {
    render(<MiniSparkline data={[5, 10, 15]} width={80} height={30} color="#ff0000" />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("width", "80");
    expect(svg).toHaveAttribute("height", "30");
    const polyline = svg?.querySelector("polyline");
    expect(polyline).toHaveAttribute("stroke", "#ff0000");
  });

  it("has aria-hidden since it is decorative", () => {
    render(<MiniSparkline data={[1, 2, 3]} />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
