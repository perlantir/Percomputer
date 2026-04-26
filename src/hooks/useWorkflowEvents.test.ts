import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useWorkflowEvents } from "./useWorkflowEvents";
import type { StreamingWorkflowEvent } from "@/types/workflow";

// ------------------------------------------------------------------
// Mock EventSource
// ------------------------------------------------------------------
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: ((evt: Event) => void) | null = null;
  onmessage: ((evt: MessageEvent) => void) | null = null;
  onerror: ((evt: Event) => void) | null = null;
  readyState: number = 0; // CONNECTING
  closed = false;

  constructor(url: string | URL, _opts?: EventSourceInit) {
    this.url = String(url);
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  /** Simulate a successful connection. */
  simulateOpen() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  /** Simulate a message from the server. */
  simulateMessage(data: string, lastEventId?: string) {
    const evt = new MessageEvent("message", {
      data,
      lastEventId: lastEventId ?? "",
    });
    this.onmessage?.(evt);
  }

  /** Simulate an error. */
  simulateError() {
    this.onerror?.(new Event("error"));
  }
}

vi.stubGlobal("EventSource", MockEventSource);

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const makeEvent = (overrides: Partial<StreamingWorkflowEvent> = {}): StreamingWorkflowEvent =>
  ({
    id: "evt-1",
    type: "workflow.started",
    timestamp: Date.now(),
    workflowId: "wf-1",
    data: { budget: 100 },
    ...overrides,
  } as StreamingWorkflowEvent);

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe("useWorkflowEvents", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    MockEventSource.instances.forEach((es) => es.close());
    MockEventSource.instances = [];
  });

  it("returns initial closed state", () => {
    const { result } = renderHook(() => useWorkflowEvents("wf-1"));

    expect(result.current.events).toEqual([]);
    expect(result.current.connection.state).toBe("closed");
    expect(result.current.error).toBeNull();
  });

  it("creates EventSource with correct URL when enabled", () => {
    renderHook(() => useWorkflowEvents("wf-1", true));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe("/api/workflows/wf-1/events");
  });

  it("does not create EventSource when disabled", () => {
    renderHook(() => useWorkflowEvents("wf-1", false));

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it("transitions to open on connection", async () => {
    const { result } = renderHook(() => useWorkflowEvents("wf-1"));

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
    });

    await waitFor(() => {
      expect(result.current.connection.state).toBe("open");
    });
    expect(result.current.error).toBeNull();
  });

  it("parses and buffers incoming events", async () => {
    const { result } = renderHook(() => useWorkflowEvents("wf-1"));

    const evt = makeEvent({ id: "evt-1", type: "task.started", data: { taskId: "t-1", name: "Test", model: "GPT-5.2" } });

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
      MockEventSource.instances[0]?.simulateMessage(JSON.stringify(evt), "evt-1");
    });

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    expect(result.current.events[0]).toMatchObject({
      id: "evt-1",
      type: "task.started",
    });
    expect(result.current.connection.lastEventId).toBe("evt-1");
  });

  it("ignores non-JSON heartbeat lines", async () => {
    const { result } = renderHook(() => useWorkflowEvents("wf-1"));

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
      MockEventSource.instances[0]?.simulateMessage(":heartbeat");
    });

    await waitFor(() => {
      expect(result.current.connection.state).toBe("open");
    });

    expect(result.current.events).toHaveLength(0);
  });

  it("caps the event buffer at EVENT_BUFFER_LIMIT", async () => {
    const { result } = renderHook(() => useWorkflowEvents("wf-1"));

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
      for (let i = 0; i < 502; i++) {
        MockEventSource.instances[0]?.simulateMessage(
          JSON.stringify(makeEvent({ id: `evt-${i}`, timestamp: i })),
          `evt-${i}`
        );
      }
    });

    await waitFor(() => {
      expect(result.current.events.length).toBeLessThanOrEqual(500);
    });
  });

  it("transitions to error and schedules reconnect on onerror", async () => {
    const { result } = renderHook(() => useWorkflowEvents("wf-1"));

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
      MockEventSource.instances[0]?.simulateError();
    });

    await waitFor(() => {
      expect(result.current.connection.state).toBe("error");
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("SSE connection lost");
    expect(MockEventSource.instances[0].closed).toBe(true);
  });

  it("reconnects with exponential backoff after error", async () => {
    renderHook(() => useWorkflowEvents("wf-1"));

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
      MockEventSource.instances[0]?.simulateError();
    });

    // First reconnect attempt scheduled at 500ms
    expect(MockEventSource.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(2);
    });
  });

  it("closes EventSource and clears timers on unmount", () => {
    const { unmount } = renderHook(() => useWorkflowEvents("wf-1"));

    expect(MockEventSource.instances).toHaveLength(1);

    act(() => {
      unmount();
    });

    expect(MockEventSource.instances[0].closed).toBe(true);
  });

  it("closes EventSource when enabled changes to false", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useWorkflowEvents("wf-1", enabled),
      { initialProps: { enabled: true } }
    );

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
    });

    await waitFor(() => {
      expect(result.current.connection.state).toBe("open");
    });

    rerender({ enabled: false });

    expect(MockEventSource.instances[0].closed).toBe(true);
    expect(result.current.connection.state).toBe("closed");
  });

  it("resets reconnectAttempt on successful open", async () => {
    const { result } = renderHook(() => useWorkflowEvents("wf-1"));

    act(() => {
      MockEventSource.instances[0]?.simulateOpen();
    });

    await waitFor(() => {
      expect(result.current.connection.reconnectAttempt).toBe(0);
    });
  });

  it("creates new EventSource when workflowId changes", () => {
    const { rerender } = renderHook(
      ({ id }) => useWorkflowEvents(id),
      { initialProps: { id: "wf-1" } }
    );

    expect(MockEventSource.instances[0].url).toBe("/api/workflows/wf-1/events");

    rerender({ id: "wf-2" });

    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].url).toBe("/api/workflows/wf-2/events");
  });
});
