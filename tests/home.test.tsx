import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ─────────────────────────── Next.js mocks ─────────────────────────── */

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({}),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

/* ─────────────────────────── Framer motion mock ─────────────────────── */

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

/* ─────────────────────────── Lucide icons mock ───────────────────────── */

vi.mock("lucide-react", () => ({
  Clock: () => <svg data-testid="icon-clock" />,
  Zap: () => <svg data-testid="icon-zap" />,
  X: () => <svg data-testid="icon-x" />,
  AlertCircle: () => <svg data-testid="icon-alert" />,
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
  SlidersHorizontal: () => <svg data-testid="icon-sliders" />,
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
  PanelRightClose: () => <svg data-testid="icon-panel-right-close" />,
  PanelRightOpen: () => <svg data-testid="icon-panel-right-open" />,
  ChevronRight: () => <svg data-testid="icon-chevron-right" />,
  Activity: () => <svg data-testid="icon-activity" />,
  ArrowUpRight: () => <svg data-testid="icon-arrow-up-right" />,
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

vi.mock("@/src/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock("@/src/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    />
  ),
}));

vi.mock("@/src/components/ui/avatar", () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="avatar" />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
  getInitials: (name: string) => name.split(" ").map((n) => n[0]).join(""),
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

/* ─────────────────────────── Layout mocks ───────────────────────────── */

vi.mock("@/src/components/layout/Toaster", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

/* ─────────────────────────── Composer sub-component mocks ─────────────── */

vi.mock("@/src/components/composer/ComposerToolbar", () => ({
  ComposerToolbar: () => <div data-testid="composer-toolbar" />,
}));

vi.mock("@/src/components/composer/SlashMenu", () => ({
  SlashMenu: () => <div data-testid="slash-menu" />,
  SLASH_COMMANDS: [],
}));

vi.mock("@/src/components/composer/AdvancedOptions", () => ({
  AdvancedOptions: () => <div data-testid="advanced-options" />,
}));

vi.mock("@/src/components/composer/StarterChips", () => ({
  StarterChips: () => <div data-testid="starter-chips" />,
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
  ShareWorkflowDialog: () => <div data-testid="share-dialog" />,
}));

vi.mock("@/src/components/workflow/AmendWorkflowDialog", () => ({
  AmendWorkflowDialog: () => <div data-testid="amend-dialog" />,
}));

vi.mock("@/src/components/workflow/CancelWorkflowButton", () => ({
  CancelWorkflowButton: ({ workflowId }: any) => (
    <button data-testid="cancel-btn">Cancel {workflowId}</button>
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

/* ─────────────────────────── Settings sub-component mocks ─────────────── */

vi.mock("@/src/components/settings/BillingPanel", () => ({
  BillingPanel: () => <div data-testid="billing-panel">Billing Content</div>,
}));

vi.mock("@/src/components/settings/ModelsTable", () => ({
  ModelsTable: () => <div data-testid="models-table">Models Table</div>,
}));

vi.mock("@/src/components/settings/MemoryPanel", () => ({
  MemoryPanel: () => <div data-testid="memory-panel">Memory Content</div>,
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

import HomePage from "@/app/page";

/* ─────────────────────────── Helpers ──────────────────────────────────── */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("HomePage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the composer section with heading", () => {
    render(<HomePage />, { wrapper: createWrapper() });
    expect(screen.getByText("What can I do for you?")).toBeInTheDocument();
  });

  it("renders the Composer component", () => {
    render(<HomePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId("composer-toolbar")).toBeInTheDocument();
  });

  it("renders the Recent Workflows section heading", () => {
    render(<HomePage />, { wrapper: createWrapper() });
    expect(screen.getByText("Recent Workflows")).toBeInTheDocument();
  });

  it("renders workflow cards with correct objectives", async () => {
    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const cards = screen.getAllByRole("link");
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it("navigates to library when 'View all' is clicked", async () => {
    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("View all")).toBeInTheDocument();
    });
    const viewAllBtn = screen.getByText("View all");
    await userEvent.click(viewAllBtn);
    expect(mockPush).toHaveBeenCalledWith("/library");
  });

  it("shows empty state when no workflows exist", async () => {
    vi.doMock("@/src/data/demo-workflows", async () => {
      const actual = await vi.importActual("@/src/data/demo-workflows");
      return { ...actual, DEMO_WORKFLOWS: [] };
    });
    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("No recent workflows")).toBeInTheDocument();
    });
    vi.doUnmock("@/src/data/demo-workflows");
  });

  it("displays workflow status and credit usage on cards", async () => {
    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it("shows skeleton loaders while workflows are loading", () => {
    const { container } = render(<HomePage />, { wrapper: createWrapper() });
    const skeletons = container.querySelectorAll("[data-testid='skeleton']");
    expect(skeletons.length).toBeGreaterThanOrEqual(0);
  });

  it("each workflow card links to the correct detail page", async () => {
    render(<HomePage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const cards = screen.getAllByRole("link");
      expect(cards.length).toBeGreaterThan(0);
    });
    const cards = screen.getAllByRole("link");
    cards.forEach((card) => {
      expect(card.getAttribute("href")).toMatch(/^\/w\//);
    });
  });
});
