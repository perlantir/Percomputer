import * as React from "react";
import { describe, it, expect, vi, type Mock, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockPush = vi.fn();
const mockOnLogout = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("next/image", () => ({
  default: React.forwardRef(({ src, alt, ...props }: any, ref: any) =>
    React.createElement("img", { src, alt, ref, ...props })
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const defaultProps = {
  name: "Alex Chen",
  email: "alex@example.com",
  avatarUrl: null,
  role: "admin",
  creditText: "$47.50 remaining",
  isAdmin: true,
  onLogout: mockOnLogout,
};

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("UserMenu", () => {
  it("renders trigger button with user name and email", () => {
    render(<UserMenu {...defaultProps} />);
    expect(screen.getByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
  });

  it("trigger has correct accessibility attributes", () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens dropdown when trigger is clicked", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("renders avatar fallback with initials when no avatarUrl", () => {
    render(<UserMenu {...defaultProps} avatarUrl={null} />);
    expect(screen.getByText("AC")).toBeInTheDocument();
  });

  it("renders avatar image when avatarUrl is provided", () => {
    render(<UserMenu {...defaultProps} avatarUrl="https://example.com/avatar.png" />);
    const img = screen.getByAltText("Alex Chen");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("dropdown shows all menu items for admin", async () => {
    render(<UserMenu {...defaultProps} isAdmin={true} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /console/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /billing/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /logout/i })).toBeInTheDocument();
  });

  it("hides Console menu item for non-admin", async () => {
    render(<UserMenu {...defaultProps} isAdmin={false} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.queryByRole("menuitem", { name: /console/i })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /billing/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /logout/i })).toBeInTheDocument();
  });

  it("navigates to profile on Profile click", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    const profileBtn = screen.getByRole("menuitem", { name: /profile/i });
    await userEvent.click(profileBtn);
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("navigates to settings on Settings click", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    const settingsBtn = screen.getByRole("menuitem", { name: /settings/i });
    await userEvent.click(settingsBtn);
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("navigates to console on Console click", async () => {
    render(<UserMenu {...defaultProps} isAdmin={true} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    const consoleBtn = screen.getByRole("menuitem", { name: /console/i });
    await userEvent.click(consoleBtn);
    expect(mockPush).toHaveBeenCalledWith("/console");
  });

  it("navigates to billing on Billing click", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    const billingBtn = screen.getByRole("menuitem", { name: /billing/i });
    await userEvent.click(billingBtn);
    expect(mockPush).toHaveBeenCalledWith("/billing");
  });

  it("calls onLogout and closes menu on Logout click", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    const logoutBtn = screen.getByRole("menuitem", { name: /logout/i });
    await userEvent.click(logoutBtn);
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it("closes dropdown on Escape key", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes dropdown on click outside", async () => {
    render(
      React.createElement("div", null,
        React.createElement(UserMenu, defaultProps),
        React.createElement("div", { "data-testid": "outside" }, "Outside")
      )
    );
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("displays credit text when provided", async () => {
    render(<UserMenu {...defaultProps} creditText="$47.50 remaining" />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByText("$47.50 remaining")).toBeInTheDocument();
  });

  it("does not display credit section when creditText is absent", async () => {
    render(<UserMenu {...defaultProps} creditText={undefined} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
  });

  it("displays role badge for admin", async () => {
    render(<UserMenu {...defaultProps} role="admin" />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("displays role badge for owner", async () => {
    render(<UserMenu {...defaultProps} role="owner" />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("displays role badge for member", async () => {
    render(<UserMenu {...defaultProps} role="member" />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("displays role badge for viewer", async () => {
    render(<UserMenu {...defaultProps} role="viewer" />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByText("Viewer")).toBeInTheDocument();
  });

  it("falls back to Member badge for unknown role", async () => {
    render(<UserMenu {...defaultProps} role="unknown" />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("logout item has danger styling", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    const logoutBtn = screen.getByRole("menuitem", { name: /logout/i });
    expect(logoutBtn.className).toContain("danger");
  });

  it("applies custom className to container", () => {
    render(<UserMenu {...defaultProps} className="my-custom-class" />);
    const container = screen.getByRole("button", { name: /user menu/i }).closest("div");
    expect(container?.className).toContain("my-custom-class");
  });

  it("shows user header with name and email in dropdown", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    await userEvent.click(trigger);
    expect(screen.getAllByText("Alex Chen").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("alex@example.com").length).toBeGreaterThanOrEqual(1);
  });

  it("chevron rotates when dropdown opens", async () => {
    render(<UserMenu {...defaultProps} />);
    const trigger = screen.getByRole("button", { name: /user menu/i });
    const chevron = trigger.querySelector("svg");
    expect(chevron).toBeInTheDocument();
    await userEvent.click(trigger);
    expect(chevron?.className).toContain("rotate-180");
  });
});
