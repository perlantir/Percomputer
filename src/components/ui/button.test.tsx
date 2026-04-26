import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-[var(--accent-primary)]"); // primary default
    expect(button).toHaveClass("h-10"); // md size
    expect(button).toHaveClass("px-4");
  });

  it("renders all supported variants", () => {
    const variants = ["primary", "secondary", "ghost", "danger", "warning"] as const;
    const variantClasses: Record<string, string> = {
      primary: "bg-[var(--accent-primary)]",
      secondary: "bg-[var(--bg-surface-2)]",
      ghost: "hover:bg-[var(--bg-surface-2)]",
      danger: "bg-[var(--semantic-danger)]",
      warning: "bg-[var(--semantic-warning)]",
    };

    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      const button = screen.getByRole("button", { name: variant });
      expect(button).toHaveClass(variantClasses[variant]);
      unmount();
    }
  });

  it("renders all sizes", () => {
    const sizes = [
      { size: "sm" as const, className: "h-8" },
      { size: "md" as const, className: "h-10" },
      { size: "lg" as const, className: "h-12" },
      { size: "icon" as const, className: "h-10 w-10" },
    ];

    for (const { size, className } of sizes) {
      const { unmount } = render(<Button size={size}>size-{size}</Button>);
      const button = screen.getByRole("button", { name: `size-${size}` });
      expect(button).toHaveClass(className);
      unmount();
    }
  });

  it("applies fullWidth class when fullWidth is true", () => {
    render(<Button fullWidth>Full</Button>);
    const button = screen.getByRole("button", { name: /full/i });
    expect(button).toHaveClass("w-full");
  });

  it("disables the button and applies disabled styling when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:pointer-events-none");
    expect(button).toHaveClass("disabled:opacity-50");
  });

  it("shows loading spinner and disables button when loading", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toBeDisabled();
    // The spinner is an svg with animate-spin class inside the button
    const spinner = button.querySelector("svg");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole("button", { name: /click/i });
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when loading", async () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);
    const button = screen.getByRole("button", { name: /loading/i });
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports asChild to render a different element", () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: /link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("bg-[var(--accent-primary)]");
  });

  it("has accessibility attributes", () => {
    render(<Button aria-label="Submit form">Submit</Button>);
    const button = screen.getByRole("button", { name: /submit form/i });
    expect(button).toHaveAttribute("aria-label", "Submit form");
  });

  it("has focus-visible ring styling", () => {
    render(<Button>Focus</Button>);
    const button = screen.getByRole("button", { name: /focus/i });
    expect(button).toHaveClass("focus-visible:ring-2");
    expect(button).toHaveClass("focus-visible:ring-[var(--accent-primary)]");
  });

  it("buttonVariants generates correct classes", () => {
    expect(buttonVariants({ variant: "primary" })).toContain("bg-[var(--accent-primary)]");
    expect(buttonVariants({ variant: "secondary" })).toContain("border");
    expect(buttonVariants({ size: "sm" })).toContain("h-8");
    expect(buttonVariants({ fullWidth: true })).toContain("w-full");
    expect(buttonVariants({ className: "custom-class" })).toContain("custom-class");
  });
});
