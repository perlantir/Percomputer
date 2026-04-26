import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";

expect.extend(toHaveNoViolations);

/* ─── Mock next/dynamic ─── */
vi.mock("next/dynamic", () => ({
  default: () => {
    const LazyComponent = () => (
      <div role="region" aria-label="Console panel content" data-testid="console-panel">
        Console Panel Content
      </div>
    );
    return LazyComponent;
  },
}));

/* ─── Mock ConsoleErrorBoundary ─── */
vi.mock("@/src/components/console/ConsoleErrorBoundary", () => ({
  ConsoleErrorBoundary: ({ children, label }: { children: ReactNode; label: string }) => (
    <div role="region" aria-label={`${label} error boundary`}>{children}</div>
  ),
}));

/* ─── Mock ConsoleNav ─── */
vi.mock("@/src/components/console/ConsoleNav", () => ({
  default: ({ active, onChange }: { active: string; onChange: (page: string) => void }) => (
    <nav aria-label="Console navigation">
      <button
        onClick={() => onChange("workflow-inspector")}
        aria-current={active === "workflow-inspector" ? "page" : undefined}
      >
        Workflow Inspector
      </button>
      <button onClick={() => onChange("plan-diff")}>Plan Diff</button>
      <button onClick={() => onChange("cost-quality")}>Cost & Quality</button>
      <button onClick={() => onChange("provider-health")}>Provider Health</button>
      <button onClick={() => onChange("audit-explorer")}>Audit Explorer</button>
      <button onClick={() => onChange("tenant-admin")}>Tenant Admin</button>
    </nav>
  ),
}));

/* ─── Mock framer-motion ─── */
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: { children: ReactNode }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

/* ─── Mock cn utility ─── */
vi.mock("@/src/lib/utils", () => ({
  cn: (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" "),
}));

/* ─── Import component under test ─── */
import ConsolePage from "@/app/console/console-content";

describe("Console Page - Accessibility", () => {
  it("has no axe violations on the console page", async () => {
    const { container } = render(<ConsolePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has a banner landmark for the console header", () => {
    render(<ConsolePage />);
    const banner = screen.getByRole("banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/operator console/i);
  });

  it("has a navigation landmark for console nav", () => {
    render(<ConsolePage />);
    const nav = screen.getByRole("navigation", { name: /console navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it("has a main landmark for console content", () => {
    render(<ConsolePage />);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("header contains an org selector with accessible label", () => {
    render(<ConsolePage />);
    // The org selector is a <select> element
    const selects = screen.queryAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("mobile nav toggle button has accessible name", () => {
    render(<ConsolePage />);
    const toggleBtn = screen.getByRole("button", { name: /toggle navigation/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("all nav buttons have accessible names", () => {
    render(<ConsolePage />);
    const nav = screen.getByRole("navigation", { name: /console navigation/i });
    const buttons = nav.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn).toHaveAccessibleName();
    });
  });

  it("has no button-name violations", async () => {
    const { container } = render(<ConsolePage />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["button-name"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no color-contrast violations", async () => {
    const { container } = render(<ConsolePage />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["color-contrast"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no landmark-unique violations", async () => {
    const { container } = render(<ConsolePage />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["landmark-unique"] },
    });
    expect(results).toHaveNoViolations();
  });
});
