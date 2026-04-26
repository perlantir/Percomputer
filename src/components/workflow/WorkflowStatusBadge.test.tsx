import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";
import type { WorkflowStatus } from "@/src/types";

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

const ALL_STATUSES: WorkflowStatus[] = [
  "queued",
  "planning",
  "running",
  "paused",
  "succeeded",
  "failed",
  "cancelling",
  "cancelled",
];

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  queued: "Queued",
  planning: "Planning",
  running: "Running",
  paused: "Paused",
  succeeded: "Succeeded",
  failed: "Failed",
  cancelling: "Cancelling",
  cancelled: "Cancelled",
};

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("WorkflowStatusBadge", () => {
  it("renders label text for every workflow status", () => {
    ALL_STATUSES.forEach((status) => {
      const { unmount } = render(<WorkflowStatusBadge status={status} />);
      expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
      unmount();
    });
  });

  it("exposes correct aria-label", () => {
    render(<WorkflowStatusBadge status="running" />);
    expect(screen.getByLabelText("Workflow status: Running")).toBeInTheDocument();
  });

  it("hides label when showLabel=false", () => {
    render(<WorkflowStatusBadge status="succeeded" showLabel={false} />);
    expect(screen.queryByText("Succeeded")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Workflow status: Succeeded")).toBeInTheDocument();
  });

  it("applies size classes correctly (sm, md, lg)", () => {
    const { rerender } = render(<WorkflowStatusBadge status="queued" size="sm" />);
    expect(screen.getByLabelText("Workflow status: Queued")).toHaveClass("text-[11px]");

    rerender(<WorkflowStatusBadge status="queued" size="md" />);
    expect(screen.getByLabelText("Workflow status: Queued")).toHaveClass("text-xs");

    rerender(<WorkflowStatusBadge status="queued" size="lg" />);
    expect(screen.getByLabelText("Workflow status: Queued")).toHaveClass("text-sm");
  });

  it("applies custom className", () => {
    render(<WorkflowStatusBadge status="failed" className="my-custom-class" />);
    expect(screen.getByLabelText("Workflow status: Failed")).toHaveClass("my-custom-class");
  });

  it("adds animate-pulse for active states (running, planning, cancelling)", () => {
    const activeStatuses: WorkflowStatus[] = ["running", "planning", "cancelling"];
    activeStatuses.forEach((status) => {
      const { unmount } = render(<WorkflowStatusBadge status={status} />);
      expect(screen.getByLabelText(`Workflow status: ${STATUS_LABELS[status]}`)).toHaveClass(
        "animate-pulse"
      );
      unmount();
    });
  });

  it("does NOT add animate-pulse for inactive states", () => {
    const inactiveStatuses: WorkflowStatus[] = ["queued", "paused", "succeeded", "failed", "cancelled"];
    inactiveStatuses.forEach((status) => {
      const { unmount } = render(<WorkflowStatusBadge status={status} />);
      const badge = screen.getByLabelText(`Workflow status: ${STATUS_LABELS[status]}`);
      expect(badge).not.toHaveClass("animate-pulse");
      unmount();
    });
  });

  it("disables animation when prefers-reduced-motion is true", () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    render(<WorkflowStatusBadge status="running" />);
    const badge = screen.getByLabelText("Workflow status: Running");
    expect(badge).not.toHaveClass("animate-pulse");
  });

  it("spins the running icon when motion is not reduced", () => {
    render(<WorkflowStatusBadge status="running" />);
    const icon = screen.getByLabelText("Workflow status: Running").querySelector("svg");
    expect(icon).toHaveClass("animate-spin");
  });

  it("does NOT spin the running icon when motion is reduced", () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    render(<WorkflowStatusBadge status="running" />);
    const icon = screen.getByLabelText("Workflow status: Running").querySelector("svg");
    expect(icon).not.toHaveClass("animate-spin");
  });

  it("falls back to queued meta for unknown status", () => {
    render(
      // @ts-expect-error — testing runtime fallback
      <WorkflowStatusBadge status="unknown_status" />
    );
    expect(screen.getByText("Queued")).toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(<WorkflowStatusBadge status="succeeded" ref={ref} />);
    expect(ref).toHaveBeenCalled();
    const el = ref.mock.calls[0][0] as HTMLElement;
    expect(el.tagName).toBe("SPAN");
  });
});
