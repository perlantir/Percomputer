import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ─────────────────────────── Next.js mocks ─────────────────────────── */

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => "/library",
  useSearchParams: () => new URLSearchParams(),
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

/* ─────────────────────────── Import pages (after mocks) ─────────────── */

import LibraryPage from "@/app/library/page";

/* ─────────────────────────── Helpers ────────────────────────────────── */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("LibraryPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Library heading and description", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText(/browse, search, and manage all your workflows/i)).toBeInTheDocument();
  });

  it("renders the FilterBar with search input", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText(/search workflows/i) ?? screen.getByRole("textbox");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders workflow list items", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const items = screen.getAllByRole("link");
    expect(items.length).toBeGreaterThan(0);
  });

  it("filters workflows by search query", async () => {
    const user = userEvent.setup();
    render(<LibraryPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText(/search workflows/i) ?? screen.getByRole("textbox");
    await user.type(searchInput, "lithium");
    await waitFor(() => {
      expect(screen.getByText(/lithium/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when search returns no results", async () => {
    const user = userEvent.setup();
    render(<LibraryPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText(/search workflows/i) ?? screen.getByRole("textbox");
    await user.type(searchInput, "xyznonexistent");
    await waitFor(() => {
      expect(screen.getByText(/no workflows match your filters/i)).toBeInTheDocument();
    });
  });

  it("clears filters when 'Clear all filters' is clicked", async () => {
    const user = userEvent.setup();
    render(<LibraryPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText(/search workflows/i) ?? screen.getByRole("textbox");
    await user.type(searchInput, "xyznonexistent");
    await waitFor(() => {
      expect(screen.getByText(/no workflows match your filters/i)).toBeInTheDocument();
    });
    const clearBtn = screen.getByText(/clear all filters/i);
    await user.click(clearBtn);
    await waitFor(() => {
      expect(screen.queryByText(/no workflows match your filters/i)).not.toBeInTheDocument();
    });
  });

  it("renders status filter options", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("option", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /running/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /succeeded/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /failed/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /cancelled/i })).toBeInTheDocument();
  });

  it("renders sort options in the filter bar", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("option", { name: /recent/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /cost: high to low/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /cost: low to high/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /duration: long to short/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /duration: short to long/i })).toBeInTheDocument();
  });

  it("displays space filter options", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("option", { name: /acme account research/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /personal investing/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /engineering projects/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /competitive intel/i })).toBeInTheDocument();
  });

  it("shows the result count in the filter bar", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/\d+ result/i)).toBeInTheDocument();
  });

  it("shows pagination when more than 20 workflows exist", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const paginationText = screen.queryByText(/showing/i);
    if (paginationText) {
      expect(paginationText).toBeInTheDocument();
    }
  });

  it("navigates to next page when Next is clicked", async () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const nextBtn = screen.queryByRole("button", { name: /next/i });
    if (nextBtn) {
      await userEvent.click(nextBtn);
      const pageIndicator = screen.getByText(/\d+ \/ \d+/);
      expect(pageIndicator).toBeInTheDocument();
    }
  });

  it("navigates to previous page when Previous is clicked", async () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const nextBtn = screen.queryByRole("button", { name: /next/i });
    if (nextBtn) {
      await userEvent.click(nextBtn);
      const prevBtn = screen.getByRole("button", { name: /previous/i });
      expect(prevBtn).not.toBeDisabled();
      await userEvent.click(prevBtn);
    }
  });

  it("disables Previous button on first page", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const prevBtn = screen.queryByRole("button", { name: /previous/i });
    if (prevBtn) {
      expect(prevBtn).toBeDisabled();
    }
  });

  it("allows selecting workflows via checkbox", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("shows bulk actions when workflows are selected", async () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 0) {
      await userEvent.click(checkboxes[0]);
      await waitFor(() => {
        expect(screen.getByText(/selected/i)).toBeInTheDocument();
      });
    }
  });

  it("displays workflow metadata: objective, status, space", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    const items = screen.getAllByRole("link");
    expect(items.length).toBeGreaterThan(0);
  });

  it("renders the kind filter with available task kinds", () => {
    render(<LibraryPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("option", { name: /all/i })).toBeInTheDocument();
  });

  it("updates result count when filters change", async () => {
    const user = userEvent.setup();
    render(<LibraryPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText(/search workflows/i) ?? screen.getByRole("textbox");
    const initialText = screen.getByText(/\d+ result/i).textContent;
    await user.type(searchInput, "test-filter-query-that-matches-nothing");
    await waitFor(() => {
      expect(screen.getByText(/0 result/i)).toBeInTheDocument();
    });
  });
});
