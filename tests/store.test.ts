/**
 * Zustand store unit tests
 *
 * Covers:
 * - useAppStore     (src/lib/store.ts)
 * - useCitationStore (src/store/citationStore.ts)
 * - useNotificationStore (src/store/notificationStore.ts)
 *
 * Strategy:
 * - Import store hooks and access internal state via getState()
 * - Reset store to initial state before each test
 * - Test initial state, every action, derived getters, and edge cases
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { useAppStore } from "@/src/lib/store";
import { useCitationStore } from "@/src/store/citationStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import type { Notification, NotificationCategory } from "@/src/types/frontend";

// ─────────────────────────────── helpers ───────────────────────────────

/** Create a notification fixture with sensible defaults. */
function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-1",
    category: "workflow_complete" as NotificationCategory,
    title: "Workflow complete",
    message: "Your workflow finished successfully.",
    createdAt: "2024-01-15T10:00:00.000Z",
    read: false,
    actionHref: "/workflows/wf-1",
    entityId: "wf-1",
    entityType: "workflow",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// useAppStore
// ─────────────────────────────────────────────────────────────────────────

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      sidebarOpen: true,
      activeWorkflowId: null,
      isComposing: false,
    });
  });

  // ── initial state ──
  describe("initial state", () => {
    it("has sidebarOpen as true", () => {
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });

    it("has activeWorkflowId as null", () => {
      expect(useAppStore.getState().activeWorkflowId).toBeNull();
    });

    it("has isComposing as false", () => {
      expect(useAppStore.getState().isComposing).toBe(false);
    });
  });

  // ── sidebar actions ──
  describe("toggleSidebar", () => {
    it("flips sidebarOpen from true to false", () => {
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });

    it("flips sidebarOpen from false to true", () => {
      useAppStore.setState({ sidebarOpen: false });
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });

    it("toggles twice and returns to original state", () => {
      useAppStore.getState().toggleSidebar();
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe("setSidebarOpen", () => {
    it("sets sidebarOpen to the given boolean", () => {
      useAppStore.getState().setSidebarOpen(false);
      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });

    it("is idempotent when setting same value", () => {
      useAppStore.getState().setSidebarOpen(true);
      expect(useAppStore.getState().sidebarOpen).toBe(true);
    });
  });

  // ── workflow actions ──
  describe("setActiveWorkflowId", () => {
    it("sets activeWorkflowId to a string", () => {
      useAppStore.getState().setActiveWorkflowId("wf-123");
      expect(useAppStore.getState().activeWorkflowId).toBe("wf-123");
    });

    it("sets activeWorkflowId to null", () => {
      useAppStore.setState({ activeWorkflowId: "wf-123" });
      useAppStore.getState().setActiveWorkflowId(null);
      expect(useAppStore.getState().activeWorkflowId).toBeNull();
    });
  });

  // ── composing actions ──
  describe("setIsComposing", () => {
    it("sets isComposing to true", () => {
      useAppStore.getState().setIsComposing(true);
      expect(useAppStore.getState().isComposing).toBe(true);
    });

    it("sets isComposing to false", () => {
      useAppStore.setState({ isComposing: true });
      useAppStore.getState().setIsComposing(false);
      expect(useAppStore.getState().isComposing).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// useCitationStore
// ─────────────────────────────────────────────────────────────────────────

describe("useCitationStore", () => {
  beforeEach(() => {
    useCitationStore.setState({
      activeTab: "answer",
      highlightedSourceId: null,
    });
  });

  // ── initial state ──
  describe("initial state", () => {
    it("has activeTab set to 'answer'", () => {
      expect(useCitationStore.getState().activeTab).toBe("answer");
    });

    it("has highlightedSourceId as null", () => {
      expect(useCitationStore.getState().highlightedSourceId).toBeNull();
    });
  });

  // ── setActiveTab ──
  describe("setActiveTab", () => {
    it("changes the activeTab value", () => {
      useCitationStore.getState().setActiveTab("sources");
      expect(useCitationStore.getState().activeTab).toBe("sources");
    });

    it("can switch back and forth", () => {
      const { setActiveTab } = useCitationStore.getState();
      setActiveTab("sources");
      expect(useCitationStore.getState().activeTab).toBe("sources");
      setActiveTab("answer");
      expect(useCitationStore.getState().activeTab).toBe("answer");
    });
  });

  // ── highlightSource ──
  describe("highlightSource", () => {
    it("sets highlightedSourceId and switches tab to 'sources'", () => {
      useCitationStore.getState().highlightSource("src-42");
      const state = useCitationStore.getState();
      expect(state.highlightedSourceId).toBe("src-42");
      expect(state.activeTab).toBe("sources");
    });

    it("overwrites the previous highlightedSourceId", () => {
      const { highlightSource } = useCitationStore.getState();
      highlightSource("src-1");
      highlightSource("src-2");
      expect(useCitationStore.getState().highlightedSourceId).toBe("src-2");
    });
  });

  // ── clearHighlight ──
  describe("clearHighlight", () => {
    it("resets highlightedSourceId to null", () => {
      useCitationStore.setState({
        highlightedSourceId: "src-42",
        activeTab: "sources",
      });
      useCitationStore.getState().clearHighlight();
      expect(useCitationStore.getState().highlightedSourceId).toBeNull();
    });

    it("does not change activeTab", () => {
      useCitationStore.setState({ highlightedSourceId: "src-42", activeTab: "sources" });
      useCitationStore.getState().clearHighlight();
      // activeTab should stay as-is after clear
      expect(useCitationStore.getState().activeTab).toBe("sources");
    });

    it("is safe to call when no highlight is active", () => {
      useCitationStore.getState().clearHighlight();
      expect(useCitationStore.getState().highlightedSourceId).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// useNotificationStore
// ─────────────────────────────────────────────────────────────────────────

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({
      items: [],
      isOpen: false,
      isLoading: false,
      error: null,
      lastFetchedAt: null,
    });
  });

  // ── initial state ──
  describe("initial state", () => {
    it("has empty items array", () => {
      expect(useNotificationStore.getState().items).toEqual([]);
    });

    it("has isOpen as false", () => {
      expect(useNotificationStore.getState().isOpen).toBe(false);
    });

    it("has isLoading as false", () => {
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it("has error as null", () => {
      expect(useNotificationStore.getState().error).toBeNull();
    });

    it("has lastFetchedAt as null", () => {
      expect(useNotificationStore.getState().lastFetchedAt).toBeNull();
    });
  });

  // ── derived getters ──
  describe("derived getters", () => {
    it("unreadCount returns 0 when no items", () => {
      expect(useNotificationStore.getState().unreadCount()).toBe(0);
    });

    it("unreadCount returns number of unread items", () => {
      useNotificationStore.setState({
        items: [
          makeNotification({ id: "n1", read: false }),
          makeNotification({ id: "n2", read: true }),
          makeNotification({ id: "n3", read: false }),
        ],
      });
      expect(useNotificationStore.getState().unreadCount()).toBe(2);
    });

    it("unreadItems returns only unread notifications", () => {
      const unread = makeNotification({ id: "n1", read: false });
      useNotificationStore.setState({
        items: [unread, makeNotification({ id: "n2", read: true })],
      });
      const result = useNotificationStore.getState().unreadItems();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("n1");
    });

    it("readItems returns only read notifications", () => {
      const read = makeNotification({ id: "n2", read: true });
      useNotificationStore.setState({
        items: [makeNotification({ id: "n1", read: false }), read],
      });
      const result = useNotificationStore.getState().readItems();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("n2");
    });

    it("handles all-read items correctly", () => {
      useNotificationStore.setState({
        items: [
          makeNotification({ id: "n1", read: true }),
          makeNotification({ id: "n2", read: true }),
        ],
      });
      expect(useNotificationStore.getState().unreadCount()).toBe(0);
      expect(useNotificationStore.getState().unreadItems()).toHaveLength(0);
      expect(useNotificationStore.getState().readItems()).toHaveLength(2);
    });
  });

  // ── setItems ──
  describe("setItems", () => {
    it("replaces the items array", () => {
      const items = [makeNotification({ id: "a" })];
      useNotificationStore.getState().setItems(items);
      expect(useNotificationStore.getState().items).toHaveLength(1);
      expect(useNotificationStore.getState().items[0].id).toBe("a");
    });

    it("sorts items by createdAt descending", () => {
      const older = makeNotification({ id: "older", createdAt: "2024-01-10T08:00:00.000Z" });
      const newer = makeNotification({ id: "newer", createdAt: "2024-01-15T12:00:00.000Z" });
      useNotificationStore.getState().setItems([older, newer]);
      const state = useNotificationStore.getState();
      expect(state.items[0].id).toBe("newer");
      expect(state.items[1].id).toBe("older");
    });

    it("handles empty array", () => {
      useNotificationStore.getState().setItems([]);
      expect(useNotificationStore.getState().items).toEqual([]);
    });
  });

  // ── appendItems ──
  describe("appendItems", () => {
    it("adds new items to existing ones", () => {
      useNotificationStore.setState({ items: [makeNotification({ id: "existing" })] });
      useNotificationStore.getState().appendItems([makeNotification({ id: "new" })]);
      expect(useNotificationStore.getState().items).toHaveLength(2);
    });

    it("deduplicates items by id", () => {
      useNotificationStore.setState({ items: [makeNotification({ id: "dup" })] });
      useNotificationStore.getState().appendItems([makeNotification({ id: "dup", title: "Duplicate" })]);
      expect(useNotificationStore.getState().items).toHaveLength(1);
    });

    it("only adds items with unique ids", () => {
      useNotificationStore.setState({
        items: [makeNotification({ id: "existing" })],
      });
      useNotificationStore.getState().appendItems([
        makeNotification({ id: "existing" }), // duplicate, should be skipped
        makeNotification({ id: "fresh" }),
      ]);
      expect(useNotificationStore.getState().items).toHaveLength(2);
      // Verify existing item was not overwritten
      expect(useNotificationStore.getState().items.some((i) => i.id === "existing")).toBe(true);
      expect(useNotificationStore.getState().items.some((i) => i.id === "fresh")).toBe(true);
    });

    it("sorts after appending", () => {
      useNotificationStore.setState({
        items: [makeNotification({ id: "old", createdAt: "2024-01-01T00:00:00.000Z" })],
      });
      useNotificationStore.getState().appendItems([
        makeNotification({ id: "new", createdAt: "2024-12-31T23:59:59.000Z" }),
      ]);
      expect(useNotificationStore.getState().items[0].id).toBe("new");
    });

    it("handles appending empty array", () => {
      useNotificationStore.setState({ items: [makeNotification({ id: "a" })] });
      useNotificationStore.getState().appendItems([]);
      expect(useNotificationStore.getState().items).toHaveLength(1);
    });
  });

  // ── markAsRead ──
  describe("markAsRead", () => {
    it("sets read=true for the matching notification", () => {
      useNotificationStore.setState({
        items: [
          makeNotification({ id: "n1", read: false }),
          makeNotification({ id: "n2", read: false }),
        ],
      });
      useNotificationStore.getState().markAsRead("n1");
      const n1 = useNotificationStore.getState().items.find((n) => n.id === "n1");
      expect(n1?.read).toBe(true);
    });

    it("does not modify non-matching notifications", () => {
      useNotificationStore.setState({
        items: [
          makeNotification({ id: "n1", read: false }),
          makeNotification({ id: "n2", read: false }),
        ],
      });
      useNotificationStore.getState().markAsRead("n1");
      const n2 = useNotificationStore.getState().items.find((n) => n.id === "n2");
      expect(n2?.read).toBe(false);
    });

    it("is safe to call with non-existent id", () => {
      useNotificationStore.setState({ items: [makeNotification({ id: "n1" })] });
      useNotificationStore.getState().markAsRead("non-existent");
      expect(useNotificationStore.getState().items).toHaveLength(1);
      expect(useNotificationStore.getState().items[0].read).toBe(false);
    });
  });

  // ── markAllAsRead ──
  describe("markAllAsRead", () => {
    it("sets read=true for all notifications", () => {
      useNotificationStore.setState({
        items: [
          makeNotification({ id: "n1", read: false }),
          makeNotification({ id: "n2", read: false }),
          makeNotification({ id: "n3", read: false }),
        ],
      });
      useNotificationStore.getState().markAllAsRead();
      const allRead = useNotificationStore.getState().items.every((n) => n.read);
      expect(allRead).toBe(true);
    });

    it("works on an already-empty list", () => {
      useNotificationStore.getState().markAllAsRead();
      expect(useNotificationStore.getState().items).toEqual([]);
    });

    it("works when some items are already read", () => {
      useNotificationStore.setState({
        items: [
          makeNotification({ id: "n1", read: true }),
          makeNotification({ id: "n2", read: false }),
        ],
      });
      useNotificationStore.getState().markAllAsRead();
      expect(useNotificationStore.getState().items.every((n) => n.read)).toBe(true);
    });
  });

  // ── deleteItem ──
  describe("deleteItem", () => {
    it("removes the notification with matching id", () => {
      useNotificationStore.setState({
        items: [makeNotification({ id: "n1" }), makeNotification({ id: "n2" })],
      });
      useNotificationStore.getState().deleteItem("n1");
      expect(useNotificationStore.getState().items).toHaveLength(1);
      expect(useNotificationStore.getState().items[0].id).toBe("n2");
    });

    it("is safe to delete a non-existent id", () => {
      useNotificationStore.setState({ items: [makeNotification({ id: "n1" })] });
      useNotificationStore.getState().deleteItem("ghost");
      expect(useNotificationStore.getState().items).toHaveLength(1);
    });

    it("handles deleting from empty list", () => {
      useNotificationStore.getState().deleteItem("anything");
      expect(useNotificationStore.getState().items).toEqual([]);
    });
  });

  // ── panel UI actions ──
  describe("setOpen", () => {
    it("sets isOpen to true", () => {
      useNotificationStore.getState().setOpen(true);
      expect(useNotificationStore.getState().isOpen).toBe(true);
    });

    it("sets isOpen to false", () => {
      useNotificationStore.setState({ isOpen: true });
      useNotificationStore.getState().setOpen(false);
      expect(useNotificationStore.getState().isOpen).toBe(false);
    });
  });

  describe("toggleOpen", () => {
    it("flips isOpen from false to true", () => {
      useNotificationStore.setState({ isOpen: false });
      useNotificationStore.getState().toggleOpen();
      expect(useNotificationStore.getState().isOpen).toBe(true);
    });

    it("flips isOpen from true to false", () => {
      useNotificationStore.setState({ isOpen: true });
      useNotificationStore.getState().toggleOpen();
      expect(useNotificationStore.getState().isOpen).toBe(false);
    });
  });

  describe("setLoading", () => {
    it("sets isLoading to true", () => {
      useNotificationStore.getState().setLoading(true);
      expect(useNotificationStore.getState().isLoading).toBe(true);
    });

    it("sets isLoading to false", () => {
      useNotificationStore.setState({ isLoading: true });
      useNotificationStore.getState().setLoading(false);
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("sets error to a string", () => {
      useNotificationStore.getState().setError("Network failure");
      expect(useNotificationStore.getState().error).toBe("Network failure");
    });

    it("clears error when passed null", () => {
      useNotificationStore.setState({ error: "Previous error" });
      useNotificationStore.getState().setError(null);
      expect(useNotificationStore.getState().error).toBeNull();
    });
  });

  describe("markFetched", () => {
    it("sets lastFetchedAt to a timestamp", () => {
      const before = Date.now();
      useNotificationStore.getState().markFetched();
      const after = Date.now();
      const ts = useNotificationStore.getState().lastFetchedAt;
      expect(ts).not.toBeNull();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  // ── integration-style flows ──
  describe("notification workflow integration", () => {
    it("full lifecycle: set -> mark read -> delete", () => {
      const store = useNotificationStore.getState();

      // Receive notifications
      store.setItems([
        makeNotification({ id: "n1", read: false }),
        makeNotification({ id: "n2", read: false }),
      ]);
      expect(store.unreadCount()).toBe(2);

      // Mark one as read
      store.markAsRead("n1");
      expect(store.unreadCount()).toBe(1);
      expect(store.readItems()).toHaveLength(1);
      expect(store.unreadItems()).toHaveLength(1);

      // Mark all as read
      store.markAllAsRead();
      expect(store.unreadCount()).toBe(0);

      // Delete one
      store.deleteItem("n1");
      expect(useNotificationStore.getState().items).toHaveLength(1);
    });

    it("fetch flow: setLoading -> setItems -> markFetched -> setLoading(false)", () => {
      const store = useNotificationStore.getState();

      store.setLoading(true);
      store.setError(null);
      expect(useNotificationStore.getState().isLoading).toBe(true);
      expect(useNotificationStore.getState().error).toBeNull();

      store.setItems([makeNotification({ id: "fetched" })]);
      store.markFetched();
      store.setLoading(false);

      const state = useNotificationStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.items).toHaveLength(1);
      expect(state.lastFetchedAt).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it("error flow: setLoading -> setError -> setLoading(false)", () => {
      const store = useNotificationStore.getState();

      store.setLoading(true);
      store.setError("Request timed out");
      store.setLoading(false);

      const state = useNotificationStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Request timed out");
    });
  });
});
