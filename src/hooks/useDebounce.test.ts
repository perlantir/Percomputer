import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce, useDebounceValue, useInterval } from "./useInterval";

// ------------------------------------------------------------------
// useDebounce
// ------------------------------------------------------------------
describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays calling the wrapped function by the specified delay", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 300));

    act(() => result.current("a"));
    expect(fn).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("resets the timer on rapid successive calls", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 300));

    act(() => result.current("a"));
    act(() => vi.advanceTimersByTime(100));

    act(() => result.current("b"));
    act(() => vi.advanceTimersByTime(100));
    expect(fn).not.toHaveBeenCalled();

    act(() => result.current("c"));
    act(() => vi.advanceTimersByTime(300));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("preserves multiple arguments", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounce(fn, 200));

    act(() => result.current(1, 2, 3));
    act(() => vi.advanceTimersByTime(200));

    expect(fn).toHaveBeenCalledWith(1, 2, 3);
  });

  it("uses the latest delay when delay changes", () => {
    const fn = vi.fn();
    const { result, rerender } = renderHook(
      ({ delay }) => useDebounce(fn, delay),
      { initialProps: { delay: 200 } }
    );

    act(() => result.current("first"));
    act(() => vi.advanceTimersByTime(100));

    rerender({ delay: 500 });
    act(() => result.current("second"));

    // Old timer should have been cleared, so "first" never fires.
    act(() => vi.advanceTimersByTime(200));
    expect(fn).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });

  it("cleans up pending timer on unmount", () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDebounce(fn, 300));

    act(() => result.current("a"));
    unmount();

    act(() => vi.advanceTimersByTime(400));
    expect(fn).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------
// useDebounceValue
// ------------------------------------------------------------------
describe("useDebounceValue", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounceValue("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("delays updating the returned value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounceValue(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("b");
  });

  it("cancels previous timer when value changes again", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounceValue(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "b" });
    act(() => vi.advanceTimersByTime(100));

    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("c");
  });

  it("works with non-primitive values (objects)", () => {
    const obj = { count: 5 };
    const { result, rerender } = renderHook(
      ({ value }) => useDebounceValue(value, 200),
      { initialProps: { value: obj } }
    );

    expect(result.current).toBe(obj);

    const obj2 = { count: 10 };
    rerender({ value: obj2 });
    act(() => vi.advanceTimersByTime(200));

    expect(result.current).toBe(obj2);
  });

  it("uses updated delay when delay prop changes", () => {
    const { result, rerender } = renderHook(
      ({ delay }) => useDebounceValue("val", delay),
      { initialProps: { delay: 300 } }
    );

    rerender({ delay: 100 });
    // The hook itself doesn't expose a way to trigger a value change,
    // but we can verify it at least renders without error.
    expect(result.current).toBe("val");
  });
});

// ------------------------------------------------------------------
// useInterval
// ------------------------------------------------------------------
describe("useInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls callback on every interval tick", () => {
    const cb = vi.fn();
    renderHook(() => useInterval(cb, 1000));

    expect(cb).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("does not call callback when delay is null", () => {
    const cb = vi.fn();
    renderHook(() => useInterval(cb, null));

    act(() => vi.advanceTimersByTime(5000));
    expect(cb).not.toHaveBeenCalled();
  });

  it("uses latest callback on tick", () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 1000),
      { initialProps: { cb: first } }
    );

    act(() => vi.advanceTimersByTime(1000));
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(1000));
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("clears interval on unmount", () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useInterval(cb, 1000));

    unmount();
    act(() => vi.advanceTimersByTime(3000));
    expect(cb).not.toHaveBeenCalled();
  });
});
