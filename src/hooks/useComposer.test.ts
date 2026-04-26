import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useComposer } from "./useComposer";

// ------------------------------------------------------------------
// Mocks
// ------------------------------------------------------------------
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const createMockFile = (name: string, type: string, size: number): File => {
  const blob = new Blob(["test-content"], { type });
  return new File([blob], name, { type });
};

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe("useComposer", () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => ({ id: "wf-new-1" }),
        } as Response)
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initialises with empty text and no attachments", () => {
    const { result } = renderHook(() => useComposer());

    expect(result.current.text).toBe("");
    expect(result.current.attachments).toEqual([]);
    expect(result.current.isFocused).toBe(false);
    expect(result.current.webSearchEnabled).toBe(false);
    expect(result.current.selectedConnectors).toEqual([]);
    expect(result.current.selectedSpace).toBeNull();
    expect(result.current.slashMenuOpen).toBe(false);
    expect(result.current.advancedOpen).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  it("updates text via setText", () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setText("hello world"));

    expect(result.current.text).toBe("hello world");
  });

  it("updates focus state", () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setIsFocused(true));
    expect(result.current.isFocused).toBe(true);

    act(() => result.current.setIsFocused(false));
    expect(result.current.isFocused).toBe(false);
  });

  it("canSubmit is true when text is non-empty and not submitting", () => {
    const { result } = renderHook(() => useComposer());

    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.setText("do something"));
    expect(result.current.canSubmit).toBe(true);
  });

  it("canSubmit is false while isSubmitting is true", () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setText("do something"));
    expect(result.current.canSubmit).toBe(true);

    // We can't directly set isSubmitting, but we can observe that
    // during submit() the flag flips and canSubmit goes false.
    const submitPromise = act(async () => {
      await result.current.submit();
    });

    // During submission
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    return submitPromise;
  });

  it("adds and removes attachments", () => {
    const { result } = renderHook(() => useComposer());

    const file = createMockFile("doc.pdf", "application/pdf", 1024);

    act(() => result.current.addAttachment(file));

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0]?.name).toBe("doc.pdf");
    expect(result.current.attachments[0]?.sizeBytes).toBe(1024);
    expect(result.current.attachments[0]?.mimeType).toBe("application/pdf");

    const id = result.current.attachments[0]?.id ?? "";

    act(() => result.current.removeAttachment(id));

    expect(result.current.attachments).toHaveLength(0);
  });

  it("assigns default mimeType when file.type is empty", () => {
    const { result } = renderHook(() => useComposer());

    const file = createMockFile("unknown.bin", "", 256);

    act(() => result.current.addAttachment(file));

    expect(result.current.attachments[0]?.mimeType).toBe(
      "application/octet-stream"
    );
  });

  it("toggles web search", () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setWebSearchEnabled(true));
    expect(result.current.webSearchEnabled).toBe(true);

    act(() => result.current.setWebSearchEnabled(false));
    expect(result.current.webSearchEnabled).toBe(false);
  });

  it("toggles connectors", () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.toggleConnector("slack"));
    expect(result.current.selectedConnectors).toEqual(["slack"]);

    act(() => result.current.toggleConnector("jira"));
    expect(result.current.selectedConnectors).toEqual(["slack", "jira"]);

    act(() => result.current.toggleConnector("slack"));
    expect(result.current.selectedConnectors).toEqual(["jira"]);
  });

  it("selects and clears space", () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setSelectedSpace("space-123" as any));
    expect(result.current.selectedSpace).toBe("space-123");

    act(() => result.current.setSelectedSpace(null));
    expect(result.current.selectedSpace).toBeNull();
  });

  it("manages slash menu state", () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setSlashMenuOpen(true));
    expect(result.current.slashMenuOpen).toBe(true);

    act(() => result.current.setSlashFilter("foo"));
    expect(result.current.slashFilter).toBe("foo");

    act(() => result.current.setSelectedSlashIndex(3));
    expect(result.current.selectedSlashIndex).toBe(3);
  });

  it("manages advanced options", () => {
    const { result } = renderHook(() => useComposer());

    expect(result.current.options).toMatchObject({
      budgetCredits: 100,
      deadline: null,
      deliverableKinds: [],
      modelPolicy: null,
    });

    act(() =>
      result.current.setOptions((prev: any) => ({
        ...prev,
        budgetCredits: 200,
      }))
    );
    expect(result.current.options.budgetCredits).toBe(200);
  });

  it("submits workflow and navigates on success", async () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setText("deploy app"));
    act(() => result.current.setSelectedSpace("space-1" as any));

    await act(async () => {
      await result.current.submit();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/workflows",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const fetchBody = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.body
    );
    expect(fetchBody.objective).toBe("deploy app");
    expect(fetchBody.space_id).toBe("space-1");
    expect(fetchBody.context.web_search).toBe(false);

    expect(mockPush).toHaveBeenCalledWith("/w/wf-new-1");
  });

  it("clears state after successful submit", async () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setText("do something"));
    act(() => result.current.setSlashFilter("search"));
    act(() => result.current.setSlashMenuOpen(true));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.text).toBe("");
    expect(result.current.slashFilter).toBe("");
    expect(result.current.slashMenuOpen).toBe(false);
    expect(result.current.attachments).toEqual([]);
  });

  it("sets error when API returns non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: false,
          status: 422,
          json: async () => ({ error: "Invalid request" }),
        } as Response)
      )
    );

    const { result } = renderHook(() => useComposer());

    act(() => result.current.setText("bad request"));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error).toBe("Invalid request");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("does not submit when canSubmit is false", async () => {
    const { result } = renderHook(() => useComposer());

    // text is empty by default, so canSubmit is false
    await act(async () => {
      await result.current.submit();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("includes attachments in submit payload", async () => {
    const { result } = renderHook(() => useComposer());

    const file = createMockFile("image.png", "image/png", 2048);

    act(() => result.current.setText("analyze image"));
    act(() => result.current.addAttachment(file));

    await act(async () => {
      await result.current.submit();
    });

    const fetchBody = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.body
    );

    expect(fetchBody.context.attached_artifacts).toHaveLength(1);
    expect(fetchBody.context.attached_artifacts[0]).toMatchObject({
      name: "image.png",
      size: 2048,
      mime_type: "image/png",
    });
  });

  it("includes options in submit payload", async () => {
    const { result } = renderHook(() => useComposer());

    act(() => result.current.setText("build something"));
    act(() =>
      result.current.setOptions((prev: any) => ({
        ...prev,
        budgetCredits: 250,
        modelPolicy: "pro" as any,
      }))
    );

    await act(async () => {
      await result.current.submit();
    });

    const fetchBody = JSON.parse(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]?.body
    );

    expect(fetchBody.budget_credits).toBe(250);
    expect(fetchBody.context.model_policy).toBe("pro");
  });
});
