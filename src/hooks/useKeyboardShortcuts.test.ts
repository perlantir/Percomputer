import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

// ------------------------------------------------------------------
// Mocks
// ------------------------------------------------------------------
const mockSetOpen = vi.fn();
const mockSetShortcutsOpen = vi.fn();

vi.mock("./CommandPaletteProvider", () => ({
  useCommandPalette: () => ({
    open: false,
    setOpen: mockSetOpen,
    toggle: vi.fn(),
  }),
}));

vi.mock("@/src/components/layout/KeyboardShortcutsStore", () => ({
  useKeyboardShortcutsStore: () => ({
    open: false,
    setOpen: mockSetShortcutsOpen,
    toggle: vi.fn(),
  }),
}));

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function fireKeyDown(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  window.dispatchEvent(event);
  return event;
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    mockSetOpen.mockClear();
    mockSetShortcutsOpen.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns helpers and platform info", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    expect(typeof result.current.openCommandPalette).toBe("function");
    expect(typeof result.current.openShortcuts).toBe("function");
    expect(result.current.modKeyLabel).toMatch(/⌘|Ctrl/);
  });

  it("opens command palette on Cmd+K", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = fireKeyDown("k", { metaKey: true });

    expect(mockSetOpen).toHaveBeenCalledWith(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens command palette on Ctrl+K", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = fireKeyDown("k", { ctrlKey: true });

    expect(mockSetOpen).toHaveBeenCalledWith(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens command palette on '/' when not in input", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = fireKeyDown("/");

    expect(mockSetOpen).toHaveBeenCalledWith(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not open command palette on '/' when in an input", () => {
    renderHook(() => useKeyboardShortcuts());

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = fireKeyDown("/");

    expect(mockSetOpen).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("opens shortcuts modal on '?' when not in input", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = fireKeyDown("?");

    expect(mockSetShortcutsOpen).toHaveBeenCalledWith(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("calls onSubmit on Cmd+Enter when in an input", () => {
    const onSubmit = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSubmit }));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    const event = fireKeyDown("Enter", { metaKey: true });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    document.body.removeChild(textarea);
  });

  it("calls onSubmit on Ctrl+Enter when in an input", () => {
    const onSubmit = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSubmit }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = fireKeyDown("Enter", { ctrlKey: true });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    document.body.removeChild(input);
  });

  it("does not call onSubmit on plain Enter in input", () => {
    const onSubmit = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSubmit }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireKeyDown("Enter");

    expect(onSubmit).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("blurs input on Escape when focused in an input", () => {
    renderHook(() => useKeyboardShortcuts());

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = fireKeyDown("Escape");

    expect(document.activeElement).not.toBe(input);
    expect(event.defaultPrevented).toBe(true);

    document.body.removeChild(input);
  });

  it("ignores Escape when not in an input", () => {
    renderHook(() => useKeyboardShortcuts());

    const event = fireKeyDown("Escape");

    expect(event.defaultPrevented).toBe(false);
  });

  it("navigates list with 'j' when listNavigationActive is true", () => {
    const onNavigateList = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        onNavigateList,
        listNavigationActive: true,
      })
    );

    const event = fireKeyDown("j");

    expect(onNavigateList).toHaveBeenCalledWith("down");
    expect(event.defaultPrevented).toBe(true);
  });

  it("navigates list with 'k' when listNavigationActive is true", () => {
    const onNavigateList = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        onNavigateList,
        listNavigationActive: true,
      })
    );

    const event = fireKeyDown("k");

    expect(onNavigateList).toHaveBeenCalledWith("up");
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not navigate list when listNavigationActive is false", () => {
    const onNavigateList = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        onNavigateList,
        listNavigationActive: false,
      })
    );

    fireKeyDown("j");

    expect(onNavigateList).not.toHaveBeenCalled();
  });

  it("does not navigate list when in an input", () => {
    const onNavigateList = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({
        onNavigateList,
        listNavigationActive: true,
      })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireKeyDown("j");

    expect(onNavigateList).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("removes listener on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts());

    unmount();

    fireKeyDown("k", { metaKey: true });

    expect(mockSetOpen).not.toHaveBeenCalled();
  });

  it("openCommandPalette helper works", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => result.current.openCommandPalette());

    expect(mockSetOpen).toHaveBeenCalledWith(true);
  });

  it("openShortcuts helper works", () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    act(() => result.current.openShortcuts());

    expect(mockSetShortcutsOpen).toHaveBeenCalledWith(true);
  });
});
