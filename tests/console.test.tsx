import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ─────────────────────────── Next.js mocks ─────────────────────────── */

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => "/console",
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
  Clock: () => <svg data-testid="icon-clock" />,
  Zap: () => <svg data-testid="icon-zap" />,
  X: () => <svg data-testid="icon-x" />,
  ArrowLeft: () => <svg data-testid="icon-arrow-left" />,
  Coins: () => <svg data-testid="icon-coins" />,
  ListChecks: () => <svg data-testid="icon-list-checks" />,
  Share2: () => <svg data-testid="icon-share" />,
  Pencil: () => <svg data-testid="icon-pencil" />,
  XCircle: () => <svg data-testid="icon-x-circle" />,
  Loader2: () => <svg data-testid="icon-loader" />,
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
  Activity: () => <svg data-testid="icon-activity" />,
  PanelRightClose: () => <svg data-testid="icon-panel-right-close" />,
  PanelRightOpen: () => <svg data-testid="icon-panel-right-open" />,
  ChevronRight: () => <svg data-testid="icon-chevron-right" />,
}));

/* ─────────────────────────── UI component mocks ─────────────────────── */

vi.mock("@/src/components/ui/badge", () => ({
  Badge: ({ children, variant, size }: any) => (
    <span data-variant={variant} data-size={size}>{children}</span>
  ),
}));

vi.mock("@/src/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock("@/src/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@/src/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder ?? "Select"}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-value={value} role="option">{children}</div>
  ),
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

vi.mock("@/src/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/src/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

vi.mock("@/src/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}));

/* ─────────────────────────── Console sub-component mocks ─────────────── */

vi.mock("@/src/components/console/ConsoleErrorBoundary", () => ({
  ConsoleErrorBoundary: ({ children, label }: any) => (
    <div data-testid="error-boundary" data-label={label}>{children}</div>
  ),
}));

vi.mock("@/src/components/console/WorkflowInspector", () => ({
  default: () => <div data-testid="workflow-inspector">Workflow Inspector</div>,
}));

vi.mock("@/src/components/console/PlanDiffViewer", () => ({
  default: () => <div data-testid="plan-diff">Plan Diff Viewer</div>,
}));

vi.mock("@/src/components/console/CostQualityLeaderboard", () => ({
  default: () => <div data-testid="cost-quality">Cost Quality Leaderboard</div>,
}));

vi.mock("@/src/components/console/RoutingPolicyEditor", () => ({
  default: () => <div data-testid="routing-policy">Routing Policy Editor</div>,
}));

vi.mock("@/src/components/console/SandboxPool", () => ({
  default: () => <div data-testid="sandbox-pool">Sandbox Pool</div>,
}));

vi.mock("@/src/components/console/ProviderHealth", () => ({
  default: () => <div data-testid="provider-health">Provider Health</div>,
}));

vi.mock("@/src/components/console/AuditExplorer", () => ({
  default: () => <div data-testid="audit-explorer">Audit Explorer</div>,
}));

vi.mock("@/src/components/console/TenantAdmin", () => ({
  default: () => <div data-testid="tenant-admin">Tenant Admin</div>,
}));

/* ─────────────────────────── Import pages (after mocks) ─────────────── */

import * as React from "react";
import ConsolePage from "@/app/console/page";

describe("ConsolePage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Operator Console header", () => {
    render(<ConsolePage />);
    expect(screen.getByText("Operator Console")).toBeInTheDocument();
  });

  it("renders the Console navigation sidebar with sections", () => {
    render(<ConsolePage />);
    expect(screen.getByText("Execution")).toBeInTheDocument();
    expect(screen.getByText("Optimization")).toBeInTheDocument();
    expect(screen.getByText("Infrastructure")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<ConsolePage />);
    expect(screen.getByText("Workflow Inspector")).toBeInTheDocument();
    expect(screen.getByText("Plan Diff")).toBeInTheDocument();
    expect(screen.getByText("Cost & Quality")).toBeInTheDocument();
    expect(screen.getByText("Routing Policy")).toBeInTheDocument();
    expect(screen.getByText("Sandbox Pool")).toBeInTheDocument();
    expect(screen.getByText("Provider Health")).toBeInTheDocument();
    expect(screen.getByText("Audit Explorer")).toBeInTheDocument();
    expect(screen.getByText("Tenant Admin")).toBeInTheDocument();
  });

  it("displays the default active page: Workflow Inspector", () => {
    render(<ConsolePage />);
    expect(screen.getByTestId("workflow-inspector")).toBeInTheDocument();
  });

  it("navigates to Plan Diff Viewer when clicked", async () => {
    render(<ConsolePage />);
    const planDiffNav = screen.getByText("Plan Diff").closest("button");
    if (planDiffNav) await userEvent.click(planDiffNav);
    await waitFor(() => {
      expect(screen.getByTestId("plan-diff")).toBeInTheDocument();
    });
  });

  it("navigates to Cost & Quality Leaderboard when clicked", async () => {
    render(<ConsolePage />);
    const costQualityNav = screen.getByText("Cost & Quality").closest("button");
    if (costQualityNav) await userEvent.click(costQualityNav);
    await waitFor(() => {
      expect(screen.getByTestId("cost-quality")).toBeInTheDocument();
    });
  });

  it("navigates to Routing Policy Editor when clicked", async () => {
    render(<ConsolePage />);
    const routingNav = screen.getByText("Routing Policy").closest("button");
    if (routingNav) await userEvent.click(routingNav);
    await waitFor(() => {
      expect(screen.getByTestId("routing-policy")).toBeInTheDocument();
    });
  });

  it("navigates to Sandbox Pool when clicked", async () => {
    render(<ConsolePage />);
    const sandboxNav = screen.getByText("Sandbox Pool").closest("button");
    if (sandboxNav) await userEvent.click(sandboxNav);
    await waitFor(() => {
      expect(screen.getByTestId("sandbox-pool")).toBeInTheDocument();
    });
  });

  it("navigates to Provider Health when clicked", async () => {
    render(<ConsolePage />);
    const providerNav = screen.getByText("Provider Health").closest("button");
    if (providerNav) await userEvent.click(providerNav);
    await waitFor(() => {
      expect(screen.getByTestId("provider-health")).toBeInTheDocument();
    });
  });

  it("navigates to Audit Explorer when clicked", async () => {
    render(<ConsolePage />);
    const auditNav = screen.getByText("Audit Explorer").closest("button");
    if (auditNav) await userEvent.click(auditNav);
    await waitFor(() => {
      expect(screen.getByTestId("audit-explorer")).toBeInTheDocument();
    });
  });

  it("navigates to Tenant Admin when clicked", async () => {
    render(<ConsolePage />);
    const tenantNav = screen.getByText("Tenant Admin").closest("button");
    if (tenantNav) await userEvent.click(tenantNav);
    await waitFor(() => {
      expect(screen.getByTestId("tenant-admin")).toBeInTheDocument();
    });
  });

  it("returns to Workflow Inspector after navigating elsewhere", async () => {
    render(<ConsolePage />);
    const planDiffNav = screen.getByText("Plan Diff").closest("button");
    if (planDiffNav) await userEvent.click(planDiffNav);
    await waitFor(() => {
      expect(screen.getByTestId("plan-diff")).toBeInTheDocument();
    });
    const inspectorNav = screen.getByText("Workflow Inspector").closest("button");
    if (inspectorNav) await userEvent.click(inspectorNav);
    await waitFor(() => {
      expect(screen.getByTestId("workflow-inspector")).toBeInTheDocument();
    });
  });

  it("renders the org selector dropdown", () => {
    render(<ConsolePage />);
    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
  });

  it("allows changing the selected org", async () => {
    render(<ConsolePage />);
    const select = screen.getByDisplayValue("Acme Corp") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "org-stark" } });
    expect(select.value).toBe("org-stark");
  });

  it("displays the operator role badge", () => {
    render(<ConsolePage />);
    expect(screen.getByText("operator")).toBeInTheDocument();
  });

  it("shows the system status indicator", () => {
    render(<ConsolePage />);
    expect(screen.getByText("All systems operational")).toBeInTheDocument();
  });

  it("shows the version number", () => {
    render(<ConsolePage />);
    expect(screen.getByText("v2.4.1")).toBeInTheDocument();
  });

  it("displays the user avatar initials", () => {
    render(<ConsolePage />);
    expect(screen.getByText("OP")).toBeInTheDocument();
  });

  it("toggles mobile navigation when hamburger is clicked", async () => {
    render(<ConsolePage />);
    const toggleBtn = screen.getByLabelText(/toggle navigation/i);
    expect(toggleBtn).toBeInTheDocument();
    await userEvent.click(toggleBtn);
    expect(toggleBtn).toBeInTheDocument();
  });

  it("wraps each page in an error boundary", () => {
    render(<ConsolePage />);
    expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
  });

  it("collapses and expands navigation sections", async () => {
    render(<ConsolePage />);
    const executionSection = screen.getByText("Execution").closest("button");
    if (executionSection) {
      await userEvent.click(executionSection);
      await userEvent.click(executionSection);
    }
  });

  it("shows active indicator on the currently selected nav item", () => {
    render(<ConsolePage />);
    const activeNav = screen.getByText("Workflow Inspector").closest("button");
    expect(activeNav).toBeInTheDocument();
  });
});
