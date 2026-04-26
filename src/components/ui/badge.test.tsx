import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, badgeVariants } from "./badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveClass("bg-[var(--bg-surface-2)]");
    expect(badge).toHaveClass("text-[var(--text-secondary)]");
    expect(badge).toHaveClass("rounded-pill");
  });

  it("renders success variant", () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText("Success");
    expect(badge).toHaveClass("bg-[var(--semantic-success)]/15");
    expect(badge).toHaveClass("text-[var(--semantic-success)]");
    expect(badge).toHaveClass("border-[var(--semantic-success)]/25");
  });

  it("renders warning variant", () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText("Warning");
    expect(badge).toHaveClass("bg-[var(--semantic-warning)]/15");
    expect(badge).toHaveClass("text-[var(--semantic-warning)]");
  });

  it("renders danger variant", () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText("Danger");
    expect(badge).toHaveClass("bg-[var(--semantic-danger)]/15");
    expect(badge).toHaveClass("text-[var(--semantic-danger)]");
  });

  it("renders info variant", () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText("Info");
    expect(badge).toHaveClass("bg-[var(--semantic-info)]/15");
    expect(badge).toHaveClass("text-[var(--semantic-info)]");
  });

  it("renders accent variant", () => {
    render(<Badge variant="accent">Accent</Badge>);
    const badge = screen.getByText("Accent");
    expect(badge).toHaveClass("bg-[var(--accent-primary)]/15");
    expect(badge).toHaveClass("text-[var(--accent-primary)]");
  });

  it("renders all sizes", () => {
    const sizes = [
      { size: "sm" as const, className: "text-[11px]" },
      { size: "md" as const, className: "text-xs" },
      { size: "lg" as const, className: "text-sm" },
    ];

    for (const { size, className } of sizes) {
      const { unmount } = render(<Badge size={size}>size-{size}</Badge>);
      const badge = screen.getByText(`size-${size}`);
      expect(badge).toHaveClass(className);
      unmount();
    }
  });

  it("has inline-flex and center alignment", () => {
    render(<Badge>Align</Badge>);
    const badge = screen.getByText("Align");
    expect(badge).toHaveClass("inline-flex");
    expect(badge).toHaveClass("items-center");
    expect(badge).toHaveClass("justify-center");
  });

  it("accepts custom className", () => {
    render(<Badge className="my-badge-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge).toHaveClass("my-badge-class");
  });

  it("badgeVariants generates correct classes", () => {
    expect(badgeVariants({ variant: "default" })).toContain("bg-[var(--bg-surface-2)]");
    expect(badgeVariants({ variant: "success" })).toContain("text-[var(--semantic-success)]");
    expect(badgeVariants({ size: "sm" })).toContain("text-[11px]");
    expect(badgeVariants({ size: "lg" })).toContain("text-sm");
    expect(badgeVariants({ className: "extra" })).toContain("extra");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Badge ref={ref}>Ref</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
