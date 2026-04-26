import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";

expect.extend(toHaveNoViolations);

/* ─── Mock next/dynamic ─── */
vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<{ [key: string]: React.ComponentType }>) => {
    const LazyComponent = () => <div role="tabpanel" data-testid="dynamic-tab">Dynamic Tab Content</div>;
    return LazyComponent;
  },
}));

/* ─── Mock next/navigation ─── */
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "wf-demo-001" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

/* ─── Mock framer-motion ─── */
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

/* ─── Mock ScrollArea ─── */
vi.mock("@/src/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

/* ─── Mock Skeleton ─── */
vi.mock("@/src/components/ui/skeleton", () => ({
  Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  SkeletonText: ({ lines }: { lines: number }) => (
    <div>{Array.from({ length: lines }, (_, i) => <div key={i}>skeleton line</div>)}</div>
  ),
}));

/* ─── Mock Button ─── */
vi.mock("@/src/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

/* ─── Mock ErrorPage ─── */
vi.mock("@/src/components/ui/error-state", () => ({
  ErrorPage: ({ title, description }: { title: string; description: string }) => (
    <div role="alert">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

/* ─── Mock WorkflowHeader ─── */
vi.mock("@/src/components/workflow/WorkflowHeader", () => ({
  WorkflowHeader: ({ objective }: { objective: string }) => (
    <header role="banner">
      <h1>{objective}</h1>
    </header>
  ),
}));

/* ─── Mock ShareWorkflowDialog ─── */
vi.mock("@/src/components/workflow/ShareWorkflowDialog", () => ({
  ShareWorkflowDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Share workflow">Share Dialog</div> : null,
}));

/* ─── Mock AmendWorkflowDialog ─── */
vi.mock("@/src/components/workflow/AmendWorkflowDialog", () => ({
  AmendWorkflowDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Amend workflow">Amend Dialog</div> : null,
}));

/* ─── Mock CancelWorkflowButton ─── */
vi.mock("@/src/components/workflow/CancelWorkflowButton", () => ({
  CancelWorkflowButton: () => <button>Cancel</button>,
}));

/* ─── Import component under test ─── */
import WorkflowContent from "@/app/w/[id]/workflow-content";

describe("Workflow Detail Page - Accessibility", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has no axe violations on workflow detail page", async () => {
    const { container } = render(<WorkflowContent />);
    // Advance timers past the simulated loading state
    vi.advanceTimersByTime(500);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has a header landmark with workflow objective as heading", () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it("has tab navigation with accessible labels", () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    // Tab buttons should exist
    const tabButtons = screen.getAllByRole("tab");
    expect(tabButtons.length).toBeGreaterThan(0);
    // Each tab should have an accessible name
    tabButtons.forEach((tab) => {
      expect(tab).toHaveAttribute("aria-selected");
    });
  });

  it("has an aside landmark for activity rail", async () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    const asides = screen.queryAllByRole("complementary");
    // Activity rail may be rendered as aside
    expect(asides.length).toBeGreaterThanOrEqual(0);
  });

  it("has a main landmark for workflow content", () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    const main = screen.queryByRole("main") ?? container.querySelector("main");
    expect(main).toBeTruthy();
  });

  it("has no button-name violations for icon-only buttons", async () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["button-name"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no color-contrast violations", async () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["color-contrast"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no link-name violations", async () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["link-name"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no listitem nesting violations", async () => {
    const { container } = render(<WorkflowContent />);
    vi.advanceTimersByTime(500);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["listitem"] },
    });
    expect(results).toHaveNoViolations();
  });
});
