import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockMatchMedia = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });
  mockMatchMedia.mockReturnValue({ matches: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Demo data                                                           */
/* ------------------------------------------------------------------ */

const MODELS = [
  "Claude Opus 4.7",
  "Claude Sonnet 4.6",
  "Gemini 2.5 Pro",
  "GPT-5.2",
  "O1 Pro",
  "DeepSeek-V3",
] as const;

const MODEL_COLORS: Record<(typeof MODELS)[number], string> = {
  "Claude Opus 4.7": "#d97757",
  "Claude Sonnet 4.6": "#e5a158",
  "Gemini 2.5 Pro": "#4f8ef7",
  "GPT-5.2": "#10a37f",
  "O1 Pro": "#a855f7",
  "DeepSeek-V3": "#6366f1",
};

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("ProgressBar", () => {
  it("renders segmented mode by default", () => {
    render(<ProgressBar progress={0.5} model="GPT-5.2" />);
    const container = screen.getByLabelText(/GPT-5\.2 progress/);
    expect(container).toBeInTheDocument();
  });

  it("displays correct percentage label", () => {
    render(<ProgressBar progress={0.42} model="GPT-5.2" />);
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("uses custom label when provided", () => {
    render(<ProgressBar progress={0.75} model="O1 Pro" label="3 / 4 steps" />);
    expect(screen.getByText("3 / 4 steps")).toBeInTheDocument();
    expect(screen.queryByText("75%")).not.toBeInTheDocument();
  });

  it("clamps progress to [0, 1]", () => {
    const { rerender } = render(<ProgressBar progress={-0.2} model="GPT-5.2" />);
    expect(screen.getByText("0%")).toBeInTheDocument();

    rerender(<ProgressBar progress={1.5} model="GPT-5.2" />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders smooth mode when smooth=true", () => {
    render(<ProgressBar progress={0.6} model="Gemini 2.5 Pro" smooth />);
    const label = screen.getByLabelText(/Gemini 2\.5 Pro progress/);
    expect(label).toBeInTheDocument();
  });

  it("calls onClick when bar is clicked", () => {
    const handleClick = vi.fn();
    render(<ProgressBar progress={0.33} model="DeepSeek-V3" onClick={handleClick} />);
    fireEvent.click(screen.getByLabelText(/DeepSeek-V3 progress/));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Enter is pressed", () => {
    const handleClick = vi.fn();
    render(<ProgressBar progress={0.33} model="DeepSeek-V3" onClick={handleClick} />);
    fireEvent.keyDown(screen.getByLabelText(/DeepSeek-V3 progress/), {
      key: "Enter",
    });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Space is pressed", () => {
    const handleClick = vi.fn();
    render(<ProgressBar progress={0.33} model="DeepSeek-V3" onClick={handleClick} />);
    fireEvent.keyDown(screen.getByLabelText(/DeepSeek-V3 progress/), {
      key: " ",
    });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does NOT add role=button when onClick is absent", () => {
    render(<ProgressBar progress={0.5} model="GPT-5.2" />);
    expect(screen.getByLabelText(/GPT-5\.2 progress/)).not.toHaveAttribute("role");
  });

  it("adds role=button and tabIndex when interactive", () => {
    render(<ProgressBar progress={0.5} model="GPT-5.2" onClick={vi.fn()} />);
    const bar = screen.getByLabelText(/GPT-5\.2 progress/);
    expect(bar).toHaveAttribute("role", "button");
    expect(bar).toHaveAttribute("tabIndex", "0");
  });

  it("does not add cursor-pointer when not interactive", () => {
    render(<ProgressBar progress={0.5} model="GPT-5.2" />);
    expect(screen.getByLabelText(/GPT-5\.2 progress/)).not.toHaveClass("cursor-pointer");
  });

  it("adds cursor-pointer when interactive", () => {
    render(<ProgressBar progress={0.5} model="GPT-5.2" onClick={vi.fn()} />);
    expect(screen.getByLabelText(/GPT-5\.2 progress/)).toHaveClass("cursor-pointer");
  });

  it("disables transition when prefers-reduced-motion is true", () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    render(<ProgressBar progress={0.5} model="GPT-5.2" smooth />);
    const fill = screen.getByLabelText(/GPT-5\.2 progress/).querySelector("div > div");
    expect(fill).toHaveStyle({ transition: "none" });
  });

  it("has correct aria-label for accessibility", () => {
    render(<ProgressBar progress={0.87} model="Claude Opus 4.7" />);
    expect(screen.getByLabelText("Claude Opus 4.7 progress 87%")).toBeInTheDocument();
  });

  it("applies custom height", () => {
    render(<ProgressBar progress={0.5} model="GPT-5.2" height={12} />);
    const inner = screen.getByLabelText(/GPT-5\.2 progress/).querySelector("div > div");
    expect(inner).toHaveStyle({ height: "12px" });
  });

  it("uses fallback color for unknown model", () => {
    render(
      // @ts-expect-error — testing runtime fallback
      <ProgressBar progress={0.5} model="Unknown Model" />
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
