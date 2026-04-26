import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CitationLink } from "./CitationLink";

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("CitationLink", () => {
  it("renders children inside a button", () => {
    render(
      <CitationLink sourceId="src-1">
        <span data-testid="child">[1]</span>
      </CitationLink>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("calls onNavigate with sourceId on click", () => {
    const onNavigate = vi.fn();
    render(
      <CitationLink sourceId="src-42" onNavigate={onNavigate}>
        View source
      </CitationLink>
    );
    fireEvent.click(screen.getByRole("button", { name: /View source/i }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("src-42");
  });

  it("prevents default click behaviour and stops propagation", () => {
    const parentClick = vi.fn();
    const onNavigate = vi.fn();
    render(
      <div onClick={parentClick}>
        <CitationLink sourceId="src-7" onNavigate={onNavigate}>
          Citation
        </CitationLink>
      </div>
    );
    const btn = screen.getByRole("button", { name: /Citation/i });
    fireEvent.click(btn);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("does not throw when onNavigate is absent", () => {
    render(
      <CitationLink sourceId="src-99">
        <span>Safe click</span>
      </CitationLink>
    );
    const btn = screen.getByRole("button");
    expect(() => fireEvent.click(btn)).not.toThrow();
  });

  it("is accessible as a button", () => {
    render(
      <CitationLink sourceId="src-1" onNavigate={vi.fn()}>
        Reference
      </CitationLink>
    );
    const btn = screen.getByRole("button", { name: /Reference/i });
    expect(btn).toHaveAttribute("type", "button");
  });

  it("passes unique sourceId for each citation", () => {
    const onNavigate = vi.fn();
    render(
      <>
        <CitationLink sourceId="alpha" onNavigate={onNavigate}>
          [a]
        </CitationLink>
        <CitationLink sourceId="beta" onNavigate={onNavigate}>
          [b]
        </CitationLink>
      </>
    );
    const [a, b] = screen.getAllByRole("button");
    fireEvent.click(a);
    expect(onNavigate).toHaveBeenLastCalledWith("alpha");
    fireEvent.click(b);
    expect(onNavigate).toHaveBeenLastCalledWith("beta");
  });

  it("renders complex children (nested elements)", () => {
    render(
      <CitationLink sourceId="src-3" onNavigate={vi.fn()}>
        <strong>Bold</strong> and <em>italic</em>
      </CitationLink>
    );
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
  });
});
