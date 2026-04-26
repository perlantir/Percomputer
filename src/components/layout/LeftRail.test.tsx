import * as React from "react";
import { describe, it, expect, vi, type Mock, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeftRail } from "./LeftRail";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockToggle = vi.fn();
const mockPathname = "/";

vi.mock("@/src/hooks/useRailStore", () => ({
  useRailStore: vi.fn(() => ({
    isCollapsed: false,
    toggle: mockToggle,
    setCollapsed: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => mockPathname),
}));

vi.mock("next/link", () => ({
  default: React.forwardRef(({ children, href, ...props }: any, ref: any) =>
    React.createElement("a", { href, ref, ...props }, children)
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }: any) => React.createElement("span", props, children),
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
    ul: ({ children, ...props }: any) => React.createElement("ul", props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

const mockMatchMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });
  mockMatchMedia.mockReturnValue({ matches: false });
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

import { useRailStore } from "@/src/hooks/useRailStore";
import { usePathname } from "next/navigation";

function setupMock({ pathname = "/", collapsed = false } = {}) {
  (usePathname as Mock).mockReturnValue(pathname);
  (useRailStore as Mock).mockReturnValue({
    isCollapsed: collapsed,
    toggle: mockToggle,
    setCollapsed: vi.fn(),
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("LeftRail", () => {
  it("renders with aria-label for main navigation", () => {
    setupMock();
    render(<LeftRail />);
    expect(screen.getByLabelText(/main navigation/i)).toBeInTheDocument();
  });

  it("renders logo link to home", () => {
    setupMock();
    render(<LeftRail />);
    const logo = screen.getByRole("link", { name: /multimodel/i });
    expect(logo).toHaveAttribute("href", "/");
  });

  it("renders all primary nav items", () => {
    setupMock();
    render(<LeftRail />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /connectors/i })).toBeInTheDocument();
  });

  it("marks active nav item based on pathname", () => {
    setupMock({ pathname: "/discover" });
    render(<LeftRail />);
    const discoverLink = screen.getByRole("link", { name: /discover/i });
    expect(discoverLink.className).toContain("accent-primary");
  });

  it("marks home as active only on exact match", () => {
    setupMock({ pathname: "/" });
    render(<LeftRail />);
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink.className).toContain("accent-primary");
  });

  it("does not mark home active on sub-pages", () => {
    setupMock({ pathname: "/library" });
    render(<LeftRail />);
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink.className).not.toContain("accent-primary");
  });

  it("renders Spaces dropdown trigger", () => {
    setupMock();
    render(<LeftRail />);
    const spacesBtn = screen.getByRole("button", { name: /spaces/i });
    expect(spacesBtn).toBeInTheDocument();
    expect(spacesBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("expands spaces submenu when clicked", async () => {
    setupMock();
    render(<LeftRail />);
    const spacesBtn = screen.getByRole("button", { name: /spaces/i });
    await userEvent.click(spacesBtn);
    expect(screen.getByRole("link", { name: /engineering/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /product/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /design/i })).toBeInTheDocument();
  });

  it("marks active space based on exact pathname match", () => {
    setupMock({ pathname: "/spaces/engineering" });
    render(<LeftRail />);
    const spaceLink = screen.getByRole("link", { name: /engineering/i });
    expect(spaceLink.className).toContain("accent-primary");
  });

  it("does not expand spaces when collapsed", async () => {
    setupMock({ collapsed: true });
    render(<LeftRail />);
    const spacesBtn = screen.getByRole("button", { name: /spaces/i });
    await userEvent.click(spacesBtn);
    expect(screen.queryByRole("link", { name: /engineering/i })).not.toBeInTheDocument();
  });

  it("renders Settings link", () => {
    setupMock();
    render(<LeftRail />);
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/settings");
  });

  it("renders User / Console link", () => {
    setupMock();
    render(<LeftRail />);
    expect(screen.getByRole("link", { name: /alex chen/i })).toHaveAttribute("href", "/console");
  });

  it("displays credit balance", () => {
    setupMock();
    render(<LeftRail />);
    expect(screen.getByText("8,420 / 10,000")).toBeInTheDocument();
  });

  it("hides credit text when collapsed", () => {
    setupMock({ collapsed: true });
    render(<LeftRail />);
    expect(screen.queryByText("8,420 / 10,000")).not.toBeInTheDocument();
  });

  it("toggles sidebar collapse on collapse button click", async () => {
    setupMock();
    render(<LeftRail />);
    const collapseBtn = screen.getByRole("button", { name: /collapse sidebar/i });
    await userEvent.click(collapseBtn);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("shows expand label when collapsed", () => {
    setupMock({ collapsed: true });
    render(<LeftRail />);
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it("applies collapsed width class", () => {
    setupMock({ collapsed: true });
    render(<LeftRail />);
    const aside = screen.getByLabelText(/main navigation/i);
    expect(aside.className).toContain("w-16");
  });

  it("applies expanded width class", () => {
    setupMock({ collapsed: false });
    render(<LeftRail />);
    const aside = screen.getByLabelText(/main navigation/i);
    expect(aside.className).toContain("w-60");
  });

  it("renders nav icons for each item", () => {
    setupMock();
    render(<LeftRail />);
    const nav = screen.getByLabelText(/main navigation/i).querySelector("nav");
    const icons = nav?.querySelectorAll("svg");
    expect(icons && icons.length > 0).toBe(true);
  });

  it("spaces button has cursor-default when collapsed", () => {
    setupMock({ collapsed: true });
    render(<LeftRail />);
    const spacesBtn = screen.getByRole("button", { name: /spaces/i });
    expect(spacesBtn.className).toContain("cursor-default");
  });

  it("marks spaces button active when on a space page", () => {
    setupMock({ pathname: "/spaces/product" });
    render(<LeftRail />);
    const spacesBtn = screen.getByRole("button", { name: /spaces/i });
    expect(spacesBtn.className).toContain("accent-primary");
  });
});
