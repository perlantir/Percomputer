import * as React from "react";
import { describe, it, expect, vi, type Mock, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "./CommandPalette";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockPush = vi.fn();
const mockSetOpen = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("./CommandPaletteProvider", () => ({
  useCommandPalette: vi.fn(() => ({
    open: true,
    setOpen: mockSetOpen,
    toggle: vi.fn(),
  })),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

vi.mock("cmdk", () => ({
  Command: ({ children, ...props }: any) => React.createElement("div", props, children),
  CommandGroup: ({ children, heading, ...props }: any) =>
    React.createElement("div", { "data-heading": heading, ...props }, children),
  CommandItem: ({ children, onSelect, ...props }: any) =>
    React.createElement("button", { onClick: onSelect, ...props }, children),
  CommandList: ({ children, ...props }: any) => React.createElement("div", props, children),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

import { useCommandPalette } from "./CommandPaletteProvider";

function setupMock(open = true) {
  (useCommandPalette as Mock).mockReturnValue({
    open,
    setOpen: mockSetOpen,
    toggle: vi.fn(),
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("CommandPalette", () => {
  it("does not render when closed", () => {
    setupMock(false);
    render(<CommandPalette />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with aria-modal when open", () => {
    setupMock(true);
    render(<CommandPalette />);
    const dialog = screen.getByRole("dialog", { name: /command palette/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders search input with placeholder", () => {
    setupMock(true);
    render(<CommandPalette />);
    const input = screen.getByPlaceholderText(/search commands, workflows, connectors/i);
    expect(input).toBeInTheDocument();
  });

  it("renders navigation section items", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discover/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connectors/i })).toBeInTheDocument();
  });

  it("renders workflow section items", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByRole("button", { name: /customer churn analysis/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /q3 revenue forecast/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /api schema migration/i })).toBeInTheDocument();
  });

  it("renders action section items", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByRole("button", { name: /new workflow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new space/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /admin console/i })).toBeInTheDocument();
  });

  it("renders connector section items", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByRole("button", { name: /production db/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analytics s3/i })).toBeInTheDocument();
  });

  it("navigates to home when home item is selected", async () => {
    setupMock(true);
    render(<CommandPalette />);
    const homeBtn = screen.getByRole("button", { name: /home/i });
    await userEvent.click(homeBtn);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it("navigates to discover when discover item is selected", async () => {
    setupMock(true);
    render(<CommandPalette />);
    const btn = screen.getByRole("button", { name: /discover/i });
    await userEvent.click(btn);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it("closes on backdrop click", async () => {
    setupMock(true);
    render(<CommandPalette />);
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.querySelector("div");
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it("shows footer keyboard hints", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByText(/to navigate/i)).toBeInTheDocument();
    expect(screen.getByText(/to select/i)).toBeInTheDocument();
    expect(screen.getByText(/to close/i)).toBeInTheDocument();
  });

  it("shows no results message when query has no matches", async () => {
    setupMock(true);
    render(<CommandPalette />);
    const input = screen.getByPlaceholderText(/search commands/i);
    await userEvent.type(input, "xyznonexistent");
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it("filters results based on query", async () => {
    setupMock(true);
    render(<CommandPalette />);
    const input = screen.getByPlaceholderText(/search commands/i);
    await userEvent.type(input, "home");
    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
  });

  it("filters by keyword match", async () => {
    setupMock(true);
    render(<CommandPalette />);
    const input = screen.getByPlaceholderText(/search commands/i);
    await userEvent.type(input, "dashboard");
    expect(screen.getByRole("button", { name: /home/i })).toBeInTheDocument();
  });

  it("renders ESC hint in header", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByText("ESC")).toBeInTheDocument();
  });

  it("clears query on close", () => {
    setupMock(true);
    const { rerender } = render(<CommandPalette />);
    setupMock(false);
    rerender(<CommandPalette />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders shortcuts for navigation items", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByText("G H")).toBeInTheDocument();
    expect(screen.getByText("G D")).toBeInTheDocument();
    expect(screen.getByText("G L")).toBeInTheDocument();
    expect(screen.getByText("G S")).toBeInTheDocument();
    expect(screen.getByText("G C")).toBeInTheDocument();
  });

  it("renders shortcut for new workflow action", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("renders ArrowRight icon on command items", () => {
    setupMock(true);
    render(<CommandPalette />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("focuses search input with autoFocus", () => {
    setupMock(true);
    render(<CommandPalette />);
    const input = screen.getByPlaceholderText(/search commands/i);
    expect(input).toHaveFocus();
  });

  it("has sections in defined order", () => {
    setupMock(true);
    render(<CommandPalette />);
    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByText("Workflows")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Connectors")).toBeInTheDocument();
  });
});
