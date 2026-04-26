import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactNode } from "react";

expect.extend(toHaveNoViolations);

/* ─── Mock next/navigation ─── */
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "tab" ? "profile" : null),
    has: () => false,
    entries: () => [],
    forEach: () => {},
    keys: () => [],
    values: () => [],
    toString: () => "",
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
    span: ({ children, ...props }: { children: ReactNode }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

/* ─── Mock @tanstack/react-query ─── */
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ initialData }: { initialData?: unknown }) => ({
    data: initialData,
    isLoading: false,
    error: null,
  }),
}));

/* ─── Mock toast ─── */
vi.mock("@/src/components/layout/Toaster", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}));

/* ─── Mock UI components ─── */
vi.mock("@/src/components/ui/card", () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <div role="heading" aria-level={3}>{children}</div>,
  CardDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/src/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/src/components/ui/textarea", () => ({
  default: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

vi.mock("@/src/components/ui/switch", () => ({
  Switch: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <button role="switch" aria-checked={props.checked ?? false} {...props}>
      {props.children}
    </button>
  ),
}));

vi.mock("@/src/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children, id }: { children: ReactNode; id?: string }) => <button id={id}>{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
}));

vi.mock("@/src/components/ui/skeleton", () => ({
  Skeleton: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} data-testid="skeleton" />,
}));

vi.mock("@/src/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

vi.mock("@/src/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarImage: ({ src }: { src?: string }) => <img src={src ?? ""} alt="" />,
  AvatarFallback: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  getInitials: (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase(),
}));

vi.mock("@/src/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock("@/src/components/ui/table", () => ({
  Table: ({ children }: { children: ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: ReactNode }) => <tbody>{children}</tbody>,
  TableHead: ({ children }: { children: ReactNode }) => <th>{children}</th>,
  TableRow: ({ children }: { children: ReactNode }) => <tr>{children}</tr>,
  TableCell: ({ children }: { children: ReactNode }) => <td>{children}</td>,
}));

vi.mock("@/src/components/ui/empty-state", () => ({
  EmptyState: (props: Record<string, unknown>) => (
    <div role="region" aria-label={String(props.title ?? "empty")}>
      {props.title && <p>{String(props.title)}</p>}
      {props.description && <p>{String(props.description)}</p>}
    </div>
  ),
}));

vi.mock("@/src/components/ui/loading-skeleton", () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
  SettingsSkeleton: ({ cards }: { cards?: number }) => (
    <div data-testid="settings-skeleton">
      {Array.from({ length: cards ?? 3 }, (_, i) => (
        <div key={i}>Skeleton card</div>
      ))}
    </div>
  ),
}));

/* ─── Mock settings sub-components ─── */
vi.mock("@/src/components/settings/SettingsNav", () => ({
  SettingsNav: ({ activeTab }: { activeTab?: string }) => (
    <nav aria-label="Settings navigation">
      <a href="/settings?tab=profile" aria-current={activeTab === "profile" ? "page" : undefined}>
        Profile
      </a>
      <a href="/settings?tab=billing">Billing</a>
      <a href="/settings?tab=models">Models</a>
      <a href="/settings?tab=api">API Keys</a>
      <a href="/settings?tab=team">Team</a>
    </nav>
  ),
  SETTINGS_TABS: [
    { id: "profile", label: "Profile", icon: () => null, href: "/settings?tab=profile" },
    { id: "billing", label: "Billing", icon: () => null, href: "/settings?tab=billing" },
    { id: "models", label: "Models", icon: () => null, href: "/settings?tab=models" },
    { id: "api", label: "API Keys", icon: () => null, href: "/settings?tab=api" },
    { id: "team", label: "Team", icon: () => null, href: "/settings?tab=team" },
  ],
}));

vi.mock("@/src/components/settings/ModelsTable", () => ({
  ModelsTable: () => (
    <table aria-label="Models table">
      <thead>
        <tr><th>Model</th><th>Enabled</th></tr>
      </thead>
      <tbody>
        <tr><td>GPT-4</td><td><input type="checkbox" checked readOnly /></td></tr>
      </tbody>
    </table>
  ),
}));

vi.mock("@/src/components/settings/BillingPanel", () => ({
  BillingPanel: () => (
    <div role="region" aria-label="Billing panel">
      <h3>Usage</h3>
      <p>Plan: Pro</p>
      <p>Balance: 48,760 credits</p>
    </div>
  ),
}));

vi.mock("@/src/components/settings/MemoryPanel", () => ({
  MemoryPanel: () => (
    <div role="region" aria-label="Memory panel">
      <h3>Memory Entries</h3>
      <input type="search" placeholder="Search memory..." aria-label="Search memory" />
    </div>
  ),
}));

/* ─── Import component under test ─── */
import SettingsPage from "@/app/settings/settings-content";

describe("Settings Page - Accessibility", () => {
  it("has no axe violations on default profile tab", async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has a navigation landmark for settings tabs", () => {
    render(<SettingsPage />);
    const nav = screen.getByRole("navigation", { name: /settings navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it("has an aside landmark for sidebar", () => {
    render(<SettingsPage />);
    const aside = screen.queryByRole("complementary");
    expect(aside).toBeInTheDocument();
  });

  it("has a main landmark for content area", () => {
    render(<SettingsPage />);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("has a heading level 1 for current tab title", () => {
    render(<SettingsPage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent(/profile/i);
  });

  it("profile form has labels associated with inputs", async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["label"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no color-contrast violations", async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["color-contrast"] },
    });
    expect(results).toHaveNoViolations();
  });

  it("has no landmark-unique violations (one main, one aside)", async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container, {
      runOnly: { type: "rule", values: ["landmark-unique"] },
    });
    expect(results).toHaveNoViolations();
  });
});
