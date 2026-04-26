import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * Vitest test setup — runs once before the test suite.
 *
 * - Registers jest-dom matchers (toBeInTheDocument, toHaveClass, etc.)
 * - Auto-cleanup DOM after each test (prevents state leaking between tests)
 * - Suppresses expected console noise during tests
 */

// Automatically clean up the DOM after each test
afterEach(() => {
  cleanup();
});

// ───────────────────────── Console noise suppression ─────────────────────────
// Tests intentionally trigger errors/warnings; suppress known noise to keep
// output readable. Remove entries when the underlying issue is fixed.

const suppressedWarnings = [
  // React 19 experimental / hydration warnings in test environment
  "act",
  // Next.js router warnings when navigation is mocked
  "router",
];

const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0]?.toString() ?? "";
  if (suppressedWarnings.some((sw) => message.includes(sw))) return;
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() ?? "";
  // Suppress React key warnings in tests (often from mocked arrays)
  if (message.includes("Each child in a list should have a unique")) return;
  originalError.apply(console, args);
};

// ───────────────────────── Global mocks ─────────────────────────

// Mock Next.js Image component globally — tests use a passthrough
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock window.matchMedia for responsive hooks / Radix UI
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for lazy-load / in-view components
class MockIntersectionObserver implements IntersectionObserver {
  root: Document | Element | null = null;
  rootMargin = "";
  thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(_callback: IntersectionObserverCallback) {
    // no-op
  }
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver for layout components
class MockResizeObserver implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: ResizeObserverCallback) {
    // no-op
  }
}
window.ResizeObserver = MockResizeObserver;

// Mock scrollTo for components that scroll
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
