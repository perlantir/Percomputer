import * as React from "react";
import { describe, it, expect, vi, type Mock, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({
    theme: "light",
    setTheme: mockSetTheme,
    resolvedTheme: "light",
    systemTheme: "light",
  })),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
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

import { useTheme } from "next-themes";

function setupMock(theme: string, resolvedTheme?: string) {
  (useTheme as Mock).mockReturnValue({
    theme,
    setTheme: mockSetTheme,
    resolvedTheme: resolvedTheme ?? theme,
    systemTheme: "light",
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("ThemeToggle", () => {
  it("renders a button with aria-label", () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(btn).toBeInTheDocument();
  });

  it("shows sun icon in light mode", () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("shows moon icon in dark mode", () => {
    setupMock("dark");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /switch to light mode/i });
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("switches to dark when clicked in light mode", async () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /switch to dark mode/i });
    await userEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("switches to light when clicked in dark mode", async () => {
    setupMock("dark");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button", { name: /switch to light mode/i });
    await userEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("falls back to system theme when resolvedTheme is not light or dark", async () => {
    setupMock("system", "system");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });

  it("has correct aria-label in light mode", () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("has correct aria-label in dark mode", () => {
    setupMock("dark");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "Switch to light mode");
  });

  it("has correct title attribute in light mode", () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("title", "Switch to dark mode");
  });

  it("has correct title attribute in dark mode", () => {
    setupMock("dark");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("title", "Switch to light mode");
  });

  it("renders server-side fallback before mount", () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
  });

  it("applies custom className", () => {
    setupMock("light");
    render(<ThemeToggle className="my-toggle-class" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("my-toggle-class");
  });

  it("button has focus-visible ring styling", () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("focus-visible:ring-2");
    expect(btn.className).toContain("focus-visible:ring-[var(--accent-primary)]");
  });

  it("renders with border and background styling", () => {
    setupMock("light");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border");
    expect(btn.className).toContain("bg-[var(--bg-surface-2)]");
  });
});
