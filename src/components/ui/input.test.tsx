import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, inputVariants } from "./input";

describe("Input", () => {
  it("renders a basic input element", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("renders with label and associates via htmlFor", () => {
    render(<Input label="Email" id="email" placeholder="email@example.com" />);
    const label = screen.getByText("Email");
    const input = screen.getByPlaceholderText("email@example.com");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "email");
    expect(input).toHaveAttribute("id", "email");
  });

  it("auto-generates id when not provided", () => {
    render(<Input label="Auto ID" />);
    const label = screen.getByText("Auto ID");
    expect(label).toHaveAttribute("for");
    const forAttr = label.getAttribute("for");
    expect(forAttr).toBeTruthy();
    const input = document.getElementById(forAttr!);
    expect(input).not.toBeNull();
  });

  it("renders helper text with aria-describedby", () => {
    render(<Input helperText="Use a strong password" />);
    const input = screen.getByRole("textbox");
    const helper = screen.getByText("Use a strong password");
    expect(helper).toHaveClass("text-[var(--text-secondary)]");
    const describedById = input.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    expect(helper).toHaveAttribute("id", describedById!);
  });

  it("renders error message and applies error styling", () => {
    render(<Input errorMessage="Field is required" />);
    const input = screen.getByRole("textbox");
    const error = screen.getByText("Field is required");

    expect(error).toBeInTheDocument();
    expect(error).toHaveClass("text-[var(--semantic-danger)]");
    expect(input).toHaveClass("border-[var(--semantic-danger)]");
    expect(input).toHaveClass("text-[var(--semantic-danger)]");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const describedById = input.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    expect(error).toHaveAttribute("id", describedById!);
  });

  it("errorMessage takes precedence over helperText", () => {
    render(<Input helperText="Helper" errorMessage="Error" />);
    expect(screen.queryByText("Helper")).not.toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("has correct focus styling classes", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("focus-visible:ring-2");
    expect(input).toHaveClass("focus-visible:ring-[var(--accent-primary)]");
    expect(input).toHaveClass("focus-visible:ring-offset-2");
  });

  it("has correct disabled styling classes", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("disabled:cursor-not-allowed");
    expect(input).toHaveClass("disabled:opacity-50");
  });

  it("applies correct default variant classes", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-[var(--border-default)]");
    expect(input).toHaveClass("bg-[var(--bg-surface)]");
    expect(input).toHaveClass("text-[var(--text-primary)]");
  });

  it("applies ghost variant classes", () => {
    render(<Input variant="ghost" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-transparent");
    expect(input).toHaveClass("bg-[var(--bg-surface-2)]");
    expect(input).toHaveClass("focus-visible:bg-[var(--bg-surface)]");
  });

  it("has correct dark mode color variable classes", () => {
    render(<Input placeholder="Dark" />);
    const input = screen.getByPlaceholderText("Dark");
    expect(input).toHaveClass("bg-[var(--bg-surface)]");
    expect(input).toHaveClass("text-[var(--text-primary)]");
    expect(input).toHaveClass("placeholder:text-[var(--text-tertiary)]");
  });

  it("accepts user typing", async () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "hello world");
    expect(input).toHaveValue("hello world");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("renders left icon with padding adjustment", () => {
    render(<Input iconLeft={<span data-testid="left-icon">L</span>} />);
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("pl-10");
  });

  it("renders right icon with padding adjustment", () => {
    render(<Input iconRight={<span data-testid="right-icon">R</span>} />);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("pr-10");
  });

  it("renders both icons with correct padding", () => {
    render(
      <Input
        iconLeft={<span data-testid="left">L</span>}
        iconRight={<span data-testid="right">R</span>}
      />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("pl-10");
    expect(input).toHaveClass("pr-10");
  });

  it("inputVariants generates correct classes", () => {
    expect(inputVariants({ variant: "default" })).toContain("border-[var(--border-default)]");
    expect(inputVariants({ variant: "ghost" })).toContain("border-transparent");
    expect(inputVariants({ variant: "error" })).toContain("border-[var(--semantic-danger)]");
    expect(inputVariants({ className: "custom" })).toContain("custom");
  });
});
