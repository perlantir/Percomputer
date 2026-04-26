import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWorkflowRun } from "./useWorkflowRun";
import type {
  CreateWorkflowRequest,
  CreateWorkflowResponse,
  ServerSentEvent,
  WorkflowQueuedEvent,
  WorkflowCompletedEvent,
  WorkflowFailedEvent,
  BudgetEvent,
  ClarificationStatusEvent,
  SynthesisTokenEvent,
} from "@/src/types";

// ------------------------------------------------------------------
// Mock EventSource
// ------------------------------------------------------------------
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: ((evt: Event) => void) | null = null;
  onmessage: ((evt: MessageEvent) => void) | null = null;
  onerror: ((evt: Event) => void) | null = null;
  readyState: number = 0;
  closed = false;

  constructor(url: string | URL, _opts?: EventSourceInit) {
    this.url = String(url);
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  simulateMessage(data: string) {
    this.onmessage?.(new MessageEvent("message", { data }));
  }

  simulateError() {
    this.onerror?.(new Event("error"));
  }
}

vi.stubGlobal("EventSource", MockEventSource);

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const createWorkflowResponse = (status: string): CreateWorkflowResponse => ({
  workflowId: "wf-abc-123",
  status: status as any,
  createdAt: "2024-01-01T00:00:00Z",
});

const makeEvent = (type: string, overrides: Record<string, unknown> = {}): ServerSentEvent =>
  ({
    workflowId: "wf-abc-123",
    type,
    emittedAt: new Date().toISOString(),
    ...overrides,
  } as ServerSentEvent);

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe("useWorkflowRun", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    MockEventSource.instances.forEach((es) => es.close());
    MockEventSource.instances = [];
    vi.restoreAllMocks();
  });

  it("returns initial idle state", () => {
    const { result } = renderHook(() => useWorkflowRun());

    expect(result.current.workflow).toBeNull();
    expect(result.current.events).toEqual([]);
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.pendingClarifications).toEqual([]);
    expect(result.current.budget).toBeNull();
    expect(result.current.synthesisTokenCount).toBe(0);
  });

  it("transitions to submitting then queued after run()", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "POST" && url === "/api/workflows") {
          return {
            ok: true,
            json: async () => createWorkflowResponse("queued"),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      })
    );

    const { result } = renderHook(() => useWorkflowRun());

    const request: CreateWorkflowRequest = {
      prompt: "test prompt",
      spaceId: "space-1" as any,
    };

    let runPromise: Promise<void> | undefined;

    act(() => {
      runPromise = result.current.run(request);
    });

    expect(result.current.status).toBe("submitting");

    await act(async () => {
      await runPromise;
    });

    expect(result.current.status).toBe("queued");
    expect(result.current.workflow).not.toBeNull();
    expect(result.current.workflow?.workflowId).toBe("wf-abc-123");
  });

  it("accumulates SSE events during run", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("running"),
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    const request: CreateWorkflowRequest = {
      prompt: "test",
      spaceId: "space-1" as any,
    };

    let runPromise: Promise<void> | undefined;

    act(() => {
      runPromise = result.current.run(request);
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.simulateOpen();
      es.simulateMessage(
        JSON.stringify(
          makeEvent("workflow_queued", {
            positionInQueue: 3,
          } as Partial<WorkflowQueuedEvent>)
        )
      );
      es.simulateMessage(
        JSON.stringify(
          makeEvent("budget", {
            currentCostCents: 50,
            budgetCents: 1000,
            percentUsed: 5,
          } as Partial<BudgetEvent>)
        )
      );
      es.simulateMessage(
        JSON.stringify(
          makeEvent("workflow_completed", {
            durationMs: 12000,
          } as Partial<WorkflowCompletedEvent>)
        )
      );
    });

    await act(async () => {
      await runPromise;
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.status).toBe("succeeded");
    expect(result.current.isRunning).toBe(false);
  });

  it("tracks pending clarifications", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("running"),
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    const request: CreateWorkflowRequest = {
      prompt: "test",
      spaceId: "space-1" as any,
    };

    let runPromise: Promise<void> | undefined;

    act(() => {
      runPromise = result.current.run(request);
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.simulateOpen();
      es.simulateMessage(
        JSON.stringify(
          makeEvent("clarification_status", {
            clarificationId: "clar-1",
            status: "pending",
            answer: null,
          } as Partial<ClarificationStatusEvent>)
        )
      );
    });

    await waitFor(() => {
      expect(result.current.pendingClarifications).toHaveLength(1);
    });

    expect(result.current.pendingClarifications[0]?.clarificationId).toBe("clar-1");
  });

  it("tracks budget events", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("running"),
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    act(() => {
      result.current.run({ prompt: "test", spaceId: "space-1" as any });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.simulateOpen();
      es.simulateMessage(
        JSON.stringify(
          makeEvent("budget", {
            currentCostCents: 200,
            budgetCents: 500,
            percentUsed: 40,
          } as Partial<BudgetEvent>)
        )
      );
      es.simulateMessage(
        JSON.stringify(
          makeEvent("workflow_completed", {
            durationMs: 5000,
          } as Partial<WorkflowCompletedEvent>)
        )
      );
    });

    await waitFor(() => {
      expect(result.current.budget).not.toBeNull();
    });

    expect(result.current.budget).toMatchObject({
      currentCostCents: 200,
      budgetCents: 500,
      percentUsed: 40,
    });
  });

  it("counts synthesis tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("running"),
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    act(() => {
      result.current.run({ prompt: "test", spaceId: "space-1" as any });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.simulateOpen();
      es.simulateMessage(
        JSON.stringify(
          makeEvent("synthesis_token", {
            token: "Hello",
            taskId: "t-1",
          } as Partial<SynthesisTokenEvent>)
        )
      );
      es.simulateMessage(
        JSON.stringify(
          makeEvent("synthesis_token", {
            token: " world",
            taskId: "t-1",
          } as Partial<SynthesisTokenEvent>)
        )
      );
      es.simulateMessage(
        JSON.stringify(
          makeEvent("workflow_completed", {
            durationMs: 1000,
          } as Partial<WorkflowCompletedEvent>)
        )
      );
    });

    await waitFor(() => {
      expect(result.current.status).toBe("succeeded");
    });

    expect(result.current.synthesisTokenCount).toBe(2);
  });

  it("transitions to failed on workflow_failed event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("running"),
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    act(() => {
      result.current.run({ prompt: "test", spaceId: "space-1" as any });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.simulateOpen();
      es.simulateMessage(
        JSON.stringify(
          makeEvent("workflow_failed", {
            reason: "Task timed out",
            failingTaskId: "t-fail",
          } as Partial<WorkflowFailedEvent>)
        )
      );
    });

    await waitFor(() => {
      expect(result.current.status).toBe("failed");
    });

    expect(result.current.workflow?.status).toBe("failed");
    expect(result.current.isRunning).toBe(false);
  });

  it("sets error when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    await act(async () => {
      await result.current.run({
        prompt: "test",
        spaceId: "space-1" as any,
      });
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toContain("500");
    expect(result.current.isRunning).toBe(false);
  });

  it("cleans up EventSource and abort on unmount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("running"),
      } as Response))
    );

    const { result, unmount } = renderHook(() => useWorkflowRun());

    act(() => {
      result.current.run({ prompt: "test", spaceId: "space-1" as any });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    unmount();

    expect(MockEventSource.instances[0].closed).toBe(true);
  });

  it("can cancel a running workflow", async () => {
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST" && url === "/api/workflows") {
        return {
          ok: true,
          json: async () => createWorkflowResponse("running"),
        } as Response;
      }
      if (init?.method === "DELETE" && url.startsWith("/api/workflows/")) {
        return { ok: true, status: 200 } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useWorkflowRun());

    let runPromise: Promise<void> | undefined;

    act(() => {
      runPromise = result.current.run({
        prompt: "test",
        spaceId: "space-1" as any,
      });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
      result.current.cancel();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("cancelling");
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/workflows/wf-abc-123",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("answers clarification and optimistically removes it", async () => {
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST" && url === "/api/workflows") {
        return {
          ok: true,
          json: async () => createWorkflowResponse("running"),
        } as Response;
      }
      if (init?.method === "POST" && url.includes("/api/clarifications/")) {
        return { ok: true, status: 200 } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useWorkflowRun());

    act(() => {
      result.current.run({ prompt: "test", spaceId: "space-1" as any });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.simulateOpen();
      es.simulateMessage(
        JSON.stringify(
          makeEvent("clarification_status", {
            clarificationId: "clar-1",
            status: "pending",
            answer: null,
          } as Partial<ClarificationStatusEvent>)
        )
      );
    });

    await waitFor(() => {
      expect(result.current.pendingClarifications).toHaveLength(1);
    });

    await act(async () => {
      await result.current.answerClarification("clar-1", "Yes, please proceed.");
    });

    expect(result.current.pendingClarifications).toHaveLength(0);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/clarifications/clar-1/answer",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "Yes, please proceed." }),
      })
    );
  });

  it("sets error on failed clarification answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "POST" && url === "/api/workflows") {
          return {
            ok: true,
            json: async () => createWorkflowResponse("running"),
          } as Response;
        }
        return {
          ok: false,
          status: 422,
          json: async () => ({}),
        } as Response;
      })
    );

    const { result } = renderHook(() => useWorkflowRun());

    act(() => {
      result.current.run({ prompt: "test", spaceId: "space-1" as any });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    // Need a workflowId to answer, which requires a successful run
    await act(async () => {
      await result.current.answerClarification("clar-1", "answer");
    });

    expect(result.current.error).toContain("Failed to answer clarification");
  });

  it("ignores malformed SSE messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("running"),
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    act(() => {
      result.current.run({ prompt: "test", spaceId: "space-1" as any });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const es = MockEventSource.instances[0];

    act(() => {
      es.simulateOpen();
      es.simulateMessage("not valid json");
      es.simulateMessage(
        JSON.stringify(
          makeEvent("workflow_completed", {
            durationMs: 1000,
          } as Partial<WorkflowCompletedEvent>)
        )
      );
    });

    await waitFor(() => {
      expect(result.current.status).toBe("succeeded");
    });

    expect(result.current.events).toHaveLength(1);
  });

  it("aborts previous run before starting a new one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => createWorkflowResponse("queued"),
      } as Response))
    );

    const { result } = renderHook(() => useWorkflowRun());

    let firstRun: Promise<void> | undefined;

    act(() => {
      firstRun = result.current.run({
        prompt: "first",
        spaceId: "space-1" as any,
      });
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const firstEs = MockEventSource.instances[0];
    expect(firstEs.closed).toBe(false);

    // Start a second run
    act(() => {
      result.current.run({
        prompt: "second",
        spaceId: "space-1" as any,
      });
    });

    // First EventSource should have been closed
    expect(firstEs.closed).toBe(true);
  });
});
