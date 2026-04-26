import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ─────────────────────────── Next.js mocks ─────────────────────────── */

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => "/settings",
  useSearchParams: () => new URLSearchParams("tab=profile"),
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

/* ─────────────────────────── Import pages (after mocks) ─────────────── */

import * as React from "react";
import SettingsPage from "@/app/settings/page";

/* ─────────────────────────── Helpers ────────────────────────────────── */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("SettingsPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Settings sidebar with all tabs", () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Models")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Memory")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("API Keys")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
  });

  it("renders the Profile tab by default", () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("displays the current user's name and email in profile form", () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(nameInput.value).toBeTruthy();
    expect(emailInput.value).toBeTruthy();
  });

  it("allows updating the profile name field", async () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated Name");
    expect((nameInput as HTMLInputElement).value).toBe("Updated Name");
  });

  it("allows updating the profile email field", async () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "updated@example.com");
    expect((emailInput as HTMLInputElement).value).toBe("updated@example.com");
  });

  it("shows timezone selector in profile tab", () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
  });

  it("triggers save action when Save Changes is clicked", async () => {
    const { toast } = await import("@/src/components/layout/Toaster");
    render(<SettingsPage />, { wrapper: createWrapper() });
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(saveBtn);
    expect(toast.success).toHaveBeenCalledWith("Profile saved", expect.any(String));
  });

  it("renders the Billing tab when navigated via query param", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=billing"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId("billing-panel")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("renders the Models tab when navigated via query param", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=models"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId("models-table")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("renders the Privacy tab with data residency settings", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=privacy"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Data Residency")).toBeInTheDocument();
      expect(screen.getByLabelText(/primary region/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/backup region/i)).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("renders the Memory tab", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=memory"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId("memory-panel")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("renders the Notifications tab with channel toggles", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=notifications"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Notification Channels")).toBeInTheDocument();
      expect(screen.getByText("Email Notifications")).toBeInTheDocument();
      expect(screen.getByText("Push Notifications")).toBeInTheDocument();
      expect(screen.getByText("In-App Notifications")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("toggles notification switches in the Notifications tab", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=notifications"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const switches = screen.getAllByRole("switch");
      expect(switches.length).toBeGreaterThan(0);
    });
    const switches = screen.getAllByRole("switch");
    const firstSwitch = switches[0];
    const initialChecked = firstSwitch.getAttribute("aria-checked") === "true";
    await userEvent.click(firstSwitch);
    expect(firstSwitch.getAttribute("aria-checked")).toBe(String(!initialChecked));
    vi.doUnmock("next/navigation");
  });

  it("renders the API Keys tab with key list", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=api"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Production API")).toBeInTheDocument();
      expect(screen.getByText("Staging Test")).toBeInTheDocument();
      expect(screen.getByText("CI/CD Deploy")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("renders the Team tab with member list", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=team"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
      expect(screen.getByText("Marcus Johnson")).toBeInTheDocument();
      expect(screen.getByText("Alex Patel")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("shows role badges in the team table", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=team"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("owner")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(screen.getByText("member")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("renders generate key button in API Keys tab", async () => {
    const { toast } = await import("@/src/components/layout/Toaster");
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=api"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Generate Key")).toBeInTheDocument();
    });
    const genBtn = screen.getByText("Generate Key");
    await userEvent.click(genBtn);
    expect(toast.info).toHaveBeenCalledWith("Generate Key", expect.any(String));
    vi.doUnmock("next/navigation");
  });

  it("renders privacy switches for memory and ZDR settings", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=privacy"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Episodic Memory")).toBeInTheDocument();
      expect(screen.getByText("Semantic Memory")).toBeInTheDocument();
      expect(screen.getByText("Auto-decay Old Memories")).toBeInTheDocument();
      expect(screen.getByText("Enable ZDR Mode")).toBeInTheDocument();
      expect(screen.getByText("Audit Data Retention")).toBeInTheDocument();
    });
    vi.doUnmock("next/navigation");
  });

  it("toggles privacy settings switches", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
      useParams: () => ({}),
      usePathname: () => "/settings",
      useSearchParams: () => new URLSearchParams("tab=privacy"),
    }));
    render(<SettingsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const switches = screen.getAllByRole("switch");
      expect(switches.length).toBeGreaterThan(0);
    });
    const zdrLabel = screen.getByText("Enable ZDR Mode").closest("div");
    if (zdrLabel) {
      const zdrSwitch = zdrLabel.querySelector('[role="switch"]');
      if (zdrSwitch) {
        const before = zdrSwitch.getAttribute("aria-checked");
        await userEvent.click(zdrSwitch);
        expect(zdrSwitch.getAttribute("aria-checked")).toBe(before === "true" ? "false" : "true");
      }
    }
    vi.doUnmock("next/navigation");
  });
});
