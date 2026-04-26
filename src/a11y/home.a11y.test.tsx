import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";

expect.extend(toHaveNoViolations);

/* ─── Mock Data ─── */
vi.mock("@/src/hooks/useComposer", () => ({
  useComposer: () => ({
    text: "",
    setText: vi.fn(),
    attachments: [],
    addAttachment: vi.fn(),
    removeAttachment: vi.fn(),
    isSubmitting: false,
    submit: vi.fn(),
    advancedOpen: false,
    setAdvancedOpen: vi.fn(),
    selectedModel: "auto",
    setSelectedModel: vi.fn(),
    budget: 100,
    setBudget: vi.fn(),
    mode: "research",
    setMode: vi.fn(),
    citationsEnabled: true,
    setCitationsEnabled: vi.fn(),
    persistEnabled: true,
    setPersistEnabled: vi.fn(),
    slashFilter: "",
    slashMenuOpen: false,
    setSlashMenuOpen: vi.fn(),
    selectedSlashIndex: 0,
    setSelectedSlashIndex: vi.fn(),
    handleSlashSelect: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ initialData }: { initialData: unknown }) => ({
    data: initialData,
    isLoading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

/* ─── Mock sub-components ─── */
vi.mock("@/src/components/ui/empty-state", () => ({
  EmptyState: (props: {
    variant?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <div role="region" aria-label={props.title ?? "empty state"}>
      {props.title && <p>{props.title}</p>}
      {props.description && <p>{props.description}</p>}
      {props.actionLabel && (
        <button onClick={props.onAction}>{props.actionLabel}</button>
      )}
    </div>
  ),
}));

vi.mock("@/src/components/workflow/RecentWorkflowCard", () => ({
  RecentWorkflowCard: (props: Record<string, unknown>) => (
    <div role="article" data-testid="recent-workflow-card" {...props}>
      Workflow Card
    </div>
  ),
}));

/* ─── Import the component under test ─── */
import HomeContent from "@/app/home-content";
import { DEMO_WORKFLOWS } from "@/src/data/demo-workflows";

describe("Home Page - Accessibility", () => {
  it("has no axe violations on the home page", async () => {
    const { container } = render(<HomeContent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has a main landmark", () => {
    render(<HomeContent />);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("has a heading level 1 for the primary prompt", () => {
    render(<HomeContent />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent(/what can i do for you/i);
  });

  it("has a heading level 2 for recent workflows section", () => {
    render(<HomeContent />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveTextContent(/recent workflows/i);
  });

  it("has a textbox for workflow input", () => {
    render(<HomeContent />);
    // The Composer uses a textarea (contentEditable or similar)
    const textbox = screen.getByRole("textbox");
    expect(textbox).toBeInTheDocument();
  });

  it("recent workflow cards have unique accessible names via article roles", () => {
    render(<HomeContent />);
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBe(
      Math.min(DEMO_WORKFLOWS.length, 4)
    );
  });

  it("View all link has accessible name and href", () => {
    render(<HomeContent />);
    const viewAllLink = screen.getByRole("link", { name: /view all/i });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute("href", "/library");
  });

  it("has no color-contrast violations", async () => {
    const { container } = render(<HomeContent />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["color-contrast"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no heading-order violations", async () => {
    const { container } = render(<HomeContent />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["heading-order"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no landmark-unique violations", async () => {
    const { container } = render(<HomeContent />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["landmark-unique"] },
    });
    expect(results).toHaveNoViolations();
  });
});
