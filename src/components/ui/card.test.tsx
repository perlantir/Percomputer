import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
} from "./card";

describe("Card", () => {
  it("renders with default variant", () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText("Card content").parentElement;
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("bg-[var(--bg-surface)]");
    expect(card).toHaveClass("rounded-lg");
    expect(card).toHaveClass("shadow-low");
    expect(card).toHaveClass("hover:shadow-glow");
    expect(card).toHaveClass("hover:border-[var(--accent-primary)]/20");
  });

  it("renders elevated variant with hover shadow", () => {
    render(<Card variant="elevated">Elevated</Card>);
    const card = screen.getByText("Elevated").parentElement;
    expect(card).toHaveClass("shadow-medium");
    expect(card).toHaveClass("hover:shadow-glow-lg");
    expect(card).toHaveClass("hover:border-[var(--accent-primary)]/25");
    expect(card).toHaveClass("hover:-translate-y-0.5");
  });

  it("renders ghost variant without shadow", () => {
    render(<Card variant="ghost">Ghost</Card>);
    const card = screen.getByText("Ghost").parentElement;
    expect(card).toHaveClass("bg-[var(--bg-surface-2)]");
    expect(card).not.toHaveClass("shadow-low");
    expect(card).not.toHaveClass("shadow-medium");
  });

  it("renders complete card layout with all subcomponents", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();
  });

  it("CardTitle renders as h3 with correct styling", () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText("Title");
    expect(title.tagName).toBe("H3");
    expect(title).toHaveClass("font-display");
    expect(title).toHaveClass("text-lg");
    expect(title).toHaveClass("font-semibold");
    expect(title).toHaveClass("text-[var(--text-primary)]");
  });

  it("CardDescription renders with secondary text color", () => {
    render(<CardDescription>Description</CardDescription>);
    const desc = screen.getByText("Description");
    expect(desc.tagName).toBe("P");
    expect(desc).toHaveClass("text-sm");
    expect(desc).toHaveClass("text-[var(--text-secondary)]");
  });

  it("CardHeader renders with flex column layout and padding", () => {
    render(
      <CardHeader data-testid="header">Header</CardHeader>
    );
    const header = screen.getByTestId("header");
    expect(header).toHaveClass("flex");
    expect(header).toHaveClass("flex-col");
    expect(header).toHaveClass("p-6");
  });

  it("CardContent renders with padding and no top padding", () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    const content = screen.getByTestId("content");
    expect(content).toHaveClass("p-6");
    expect(content).toHaveClass("pt-0");
  });

  it("CardFooter renders with flex row and padding", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveClass("flex");
    expect(footer).toHaveClass("items-center");
    expect(footer).toHaveClass("p-6");
    expect(footer).toHaveClass("pt-0");
  });

  it("accepts custom className", () => {
    render(<Card className="my-custom-class">Custom</Card>);
    const card = screen.getByText("Custom").parentElement;
    expect(card).toHaveClass("my-custom-class");
  });

  it("cardVariants generates correct classes", () => {
    expect(cardVariants({ variant: "default" })).toContain("bg-[var(--bg-surface)]");
    expect(cardVariants({ variant: "default" })).toContain("hover:shadow-glow");
    expect(cardVariants({ variant: "elevated" })).toContain("shadow-medium");
    expect(cardVariants({ variant: "elevated" })).toContain("hover:shadow-glow-lg");
    expect(cardVariants({ variant: "ghost" })).toContain("bg-[var(--bg-surface-2)]");
    expect(cardVariants({ className: "custom" })).toContain("custom");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Card ref={ref}>Ref</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
