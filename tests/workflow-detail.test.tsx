import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ─────────────────────────── Next.js mocks ─────────────────────────── */

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: "wf_lithium_miners" }),
  usePathname: () => "/w/wf_lithium_miners",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (fn: any, _opts: any) => {
    const Component = () => {
      const [mod, setMod] = vi.fn() as any;
      React.useEffect(() => {
        fn().then((m: any) => setMod(m));
      }, []);
      if (!mod) return <div data-testid="dynamic-loading">Loading...</div>;
      const C = mod.default ?? mod;
      return <C />;
    };
    return Component;
  },
}));

/* ─────────────────────────── Framer motion mock ─────────────────────── */

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

/* ─────────────────────────── Lucide icons mock ───────────────────────── */

vi.mock("lucide-react", () => ({
  Loader2: ({ "aria-label": label }: any) => <svg data-testid="icon-loader" aria-label={label} />,
  Activity: ({ className }: any) => <svg data-testid="icon-activity" className={className} />,
  PanelRightClose: () => <svg data-testid="icon-panel-right-close" />,
  PanelRightOpen: () => <svg data-testid="icon-panel-right-open" />,
  ChevronRight: () => <svg data-testid="icon-chevron-right" />,
  Pencil: () => <svg data-testid="icon-pencil" />,
  Share2: () => <svg data-testid="icon-share" />,
  Clock: () => <svg data-testid="icon-clock" />,
  Zap: () => <svg data-testid="icon-zap" />,
  X: () => <svg data-testid="icon-x" />,
  ArrowLeft: () => <svg data-testid="icon-arrow-left" />,
  Coins: () => <svg data-testid="icon-coins" />,
  ListChecks: () => <svg data-testid="icon-list-checks" />,
  XCircle: () => <svg data-testid="icon-x-circle" />,
  AlertCircle: () => <svg data-testid="icon-alert" />,
  Inbox: () => <svg data-testid="icon-inbox" />,
  Search: () => <svg data-testid="icon-search" />,
  Box: () => <svg data-testid="icon-box" />,
  FileQuestion: () => <svg data-testid="icon-file-question" />,
  GitFork: () => <svg data-testid="icon-git-fork" />,
  Archive: () => <svg data-testid="icon-archive" />,
  ExternalLink: () => <svg data-testid="icon-external-link" />,
  DollarSign: () => <svg data-testid="icon-dollar" />,
  CheckSquare: () => <svg data-testid="icon-check-square" />,
  User: () => <svg data-testid="icon-user" />,
  Mail: () => <svg data-testid="icon-mail" />,
  Globe: () => <svg data-testid="icon-globe" />,
  CreditCard: () => <svg data-testid="icon-credit-card" />,
  Cpu: () => <svg data-testid="icon-cpu" />,
  Shield: () => <svg data-testid="icon-shield" />,
  Brain: () => <svg data-testid="icon-brain" />,
  Bell: () => <svg data-testid="icon-bell" />,
  KeyRound: () => <svg data-testid="icon-key" />,
  Users: () => <svg data-testid="icon-users" />,
  Copy: () => <svg data-testid="icon-copy" />,
  RefreshCw: () => <svg data-testid="icon-refresh" />,
  Plus: () => <svg data-testid="icon-plus" />,
  Check: () => <svg data-testid="icon-check" />,
  Trash2: () => <svg data-testid="icon-trash" />,
  ShieldCheck: () => <svg data-testid="icon-shield-check" />,
  Server: () => <svg data-testid="icon-server" />,
  ArrowUpRight: () => <svg data-testid="icon-arrow-up-right" />,
  SlidersHorizontal: () => <svg data-testid="icon-sliders" />,
}));

/* ─────────────────────────── UI component mocks ─────────────────────── */

vi.mock("@/src/components/ui/badge", () => ({
  Badge: ({ children, variant, size }: any) => (
    <span data-variant={variant} data-size={size}>{children}</span>
  ),
}));

vi.mock("@/src/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, asChild, variant, size, className, ...props }: any) => {
    if (asChild && React.Children.count(children) === 1) {
      const child = React.Children.only(children);
      return React.cloneElement(child, { className: `${child.props.className ?? ""} ${className ?? ""}`.trim(), ...props });
    }
    return (
      <button onClick={onClick} disabled={disabled} className={className} {...props}>
        {children}
      </button>
    );
  },
}));

vi.mock("@/src/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/src/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  SkeletonText: ({ lines }: any) => (
    <div data-testid="skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} data-testid="skeleton-line" />
      ))}
    </div>
  ),
}));

/* ─────────────────────────── Workflow sub-component mocks ────────────── */

vi.mock("@/src/components/workflow/WorkflowHeader", () => ({
  WorkflowHeader: (props: any) => (
    <div data-testid="workflow-header">
      <span data-testid="wf-objective">{props.objective}</span>
      <span data-testid="wf-status">{props.status}</span>
    </div>
  ),
}));

vi.mock("@/src/components/workflow/ShareWorkflowDialog", () => ({
  ShareWorkflowDialog: ({ open }: any) => (
    open ? <div data-testid="share-dialog">Share Dialog</div> : null
  ),
}));

vi.mock("@/src/components/workflow/AmendWorkflowDialog", () => ({
  AmendWorkflowDialog: ({ open }: any) => (
    open ? <div data-testid="amend-dialog">Amend Dialog</div> : null
  ),
}));

vi.mock("@/src/components/workflow/CancelWorkflowButton", () => ({
  CancelWorkflowButton: ({ workflowId, size }: any) => (
    <button data-testid="cancel-btn" data-size={size}>Cancel {workflowId}</button>
  ),
}));

/* ─────────────────────────── Tab component mocks ────────────────────── */

vi.mock("@/src/components/workflow/AnswerTab", () => ({
  AnswerTab: () => <div data-testid="answer-tab">Answer Content</div>,
}));

vi.mock("@/src/components/workflow/StepsTab", () => ({
  StepsTab: () => <div data-testid="steps-tab">Steps Content</div>,
}));

vi.mock("@/src/components/workflow/SourcesTab", () => ({
  SourcesTab: () => <div data-testid="sources-tab">Sources Content</div>,
}));

vi.mock("@/src/components/workflow/ArtifactsTab", () => ({
  ArtifactsTab: () => <div data-testid="artifacts-tab">Artifacts Content</div>,
}));

/* ─────────────────────────── Import pages (after mocks) ─────────────── */

import * as React from "react";
import WorkflowDetailPage from "@/app/w/[id]/page";

describe("WorkflowDetailPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the workflow header with objective and status", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId("workflow-header")).toBeInTheDocument();
    });
    expect(screen.getByTestId("wf-objective")).toBeInTheDocument();
    expect(screen.getByTestId("wf-status")).toBeInTheDocument();
  });

  it("displays all four tabs: Answer, Steps, Sources, Artifacts", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: /workflow tabs/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /answer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /steps/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sources/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /artifacts/i })).toBeInTheDocument();
  });

  it("shows the Answer tab content by default", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId("answer-tab")).toBeInTheDocument();
    });
    expect(screen.getByText("Answer Content")).toBeInTheDocument();
  });

  it("switches to Steps tab when clicked", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /steps/i })).toBeInTheDocument();
    });
    const stepsTab = screen.getByRole("button", { name: /steps/i });
    await userEvent.click(stepsTab);
    await waitFor(() => {
      expect(screen.getByTestId("steps-tab")).toBeInTheDocument();
    });
  });

  it("switches to Sources tab when clicked", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sources/i })).toBeInTheDocument();
    });
    const sourcesTab = screen.getByRole("button", { name: /sources/i });
    await userEvent.click(sourcesTab);
    await waitFor(() => {
      expect(screen.getByTestId("sources-tab")).toBeInTheDocument();
    });
  });

  it("switches to Artifacts tab when clicked", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /artifacts/i })).toBeInTheDocument();
    });
    const artifactsTab = screen.getByRole("button", { name: /artifacts/i });
    await userEvent.click(artifactsTab);
    await waitFor(() => {
      expect(screen.getByTestId("artifacts-tab")).toBeInTheDocument();
    });
  });

  it("shows the active tab indicator on the currently selected tab", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      const answerTab = screen.getByRole("button", { name: /answer/i });
      expect(answerTab).toHaveAttribute("aria-current", "page");
    });
  });

  it("displays action buttons: Amend and Share", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/amend/i)).toBeInTheDocument();
      expect(screen.getByText(/share/i)).toBeInTheDocument();
    });
  });

  it("opens the share dialog when Share button is clicked", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/share/i)).toBeInTheDocument();
    });
    const shareBtn = screen.getByText(/share/i).closest("button");
    if (shareBtn) await userEvent.click(shareBtn);
    await waitFor(() => {
      expect(screen.getByTestId("share-dialog")).toBeInTheDocument();
    });
  });

  it("opens the amend dialog when Amend button is clicked", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/amend/i)).toBeInTheDocument();
    });
    const amendBtn = screen.getByText(/amend/i).closest("button");
    if (amendBtn) await userEvent.click(amendBtn);
    await waitFor(() => {
      expect(screen.getByTestId("amend-dialog")).toBeInTheDocument();
    });
  });

  it("displays the live activity rail with workflow links", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it("shows workflow items in the activity rail with status info", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Activity")).toBeInTheDocument();
    });
  });

  it("toggles the activity rail collapse state", async () => {
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Activity")).toBeInTheDocument();
    });
    const toggleBtn = screen.getByLabelText(/toggle/i);
    await userEvent.click(toggleBtn);
  });

  it("shows the cancel button for running workflows", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({ id: "wf_regulatory_monitor" }),
      usePathname: () => "/w/wf_regulatory_monitor",
      useSearchParams: () => new URLSearchParams(),
    }));
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId("cancel-btn")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("shows a skeleton loader initially then transitions to content", async () => {
    const { container } = render(<WorkflowDetailPage />);
    expect(container.querySelector("[data-testid='skeleton']")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("workflow-header")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("renders not-found state for invalid workflow id", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({ id: "nonexistent" }),
      usePathname: () => "/w/nonexistent",
      useSearchParams: () => new URLSearchParams(),
    }));
    render(<WorkflowDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/workflow not found/i)).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });
});
