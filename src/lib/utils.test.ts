import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
  it("merges class names into a single string", () => {
    const result = cn("foo", "bar", "baz");
    expect(result).toBe("foo bar baz");
  });

  it("returns empty string when no inputs are provided", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("filters out falsy values (null, undefined, false, 0, empty string)", () => {
    const result = cn("foo", null, undefined, false, "bar", "");
    expect(result).toBe("foo bar");
  });

  it("handles conditional class names with objects", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn("btn", { active: isActive, disabled: isDisabled });
    expect(result).toBe("btn active");
  });

  it("handles arrays of class names", () => {
    const result = cn(["foo", "bar"], "baz");
    expect(result).toBe("foo bar baz");
  });

  it("merges Tailwind classes correctly (last wins)", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("deduplicates conflicting Tailwind utilities", () => {
    const result = cn("text-sm text-red-500", "text-lg text-blue-500");
    expect(result).not.toContain("text-sm");
    expect(result).toContain("text-lg");
    expect(result).not.toContain("text-red-500");
    expect(result).toContain("text-blue-500");
  });

  it("handles deeply nested arrays", () => {
    const result = cn([["foo", ["bar"]], [["baz"]]]);
    expect(result).toBe("foo bar baz");
  });

  it("handles mixed types: strings, objects, arrays, and conditionals", () => {
    const condition = true;
    const result = cn(
      "base-class",
      condition && "conditional-class",
      !condition && "should-not-appear",
      ["array-class"],
      { "object-class": condition }
    );
    expect(result).toContain("base-class");
    expect(result).toContain("conditional-class");
    expect(result).not.toContain("should-not-appear");
    expect(result).toContain("array-class");
    expect(result).toContain("object-class");
  });

  it("handles string interpolation within class names", () => {
    const variant = "primary";
    const result = cn("btn", `btn--${variant}`);
    expect(result).toBe("btn btn--primary");
  });

  it("merges arbitrary values correctly", () => {
    const result = cn("w-[100px]", "w-[200px]");
    expect(result).not.toContain("w-[100px]");
    expect(result).toContain("w-[200px]");
  });

  it("preserves non-conflicting Tailwind classes from both inputs", () => {
    const result = cn("flex items-center gap-2", "justify-between p-4");
    expect(result).toBe("flex items-center gap-2 justify-between p-4");
  });
});

/**
 * formatDate — mirrors the pattern used across the codebase:
 * components use `new Date(iso).toLocaleDateString("en-US", { ... })`.
 * These tests document and verify the expected behavior.
 */
describe("formatDate() pattern", () => {
  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  it("formats ISO string to readable date", () => {
    const result = formatDate("2025-01-15T14:30:00Z");
    expect(result).toBe("Jan 15, 2025");
  });

  it("formats date at year boundary correctly", () => {
    const result = formatDate("2024-12-31T23:59:59Z");
    expect(result).toBe("Dec 31, 2024");
  });

  it("formats date at month start correctly", () => {
    const result = formatDate("2025-01-01T00:00:00Z");
    expect(result).toBe("Jan 1, 2025");
  });

  it("handles invalid date string gracefully", () => {
    const result = formatDate("invalid-date");
    expect(result).toBe("Invalid Date");
  });

  it("handles empty string by returning Invalid Date", () => {
    const result = formatDate("");
    expect(result).toBe("Invalid Date");
  });

  it("formats leap year date correctly", () => {
    const result = formatDate("2024-02-29T12:00:00Z");
    expect(result).toBe("Feb 29, 2024");
  });

  it("formats dates from different years correctly", () => {
    const result2023 = formatDate("2023-06-15T10:00:00Z");
    expect(result2023).toBe("Jun 15, 2023");
  });

  it("handles timestamps with timezone offsets", () => {
    const result = formatDate("2025-01-15T14:30:00+05:00");
    // Should convert to local representation
    expect(result).toContain("2025");
    expect(result).not.toBe("Invalid Date");
  });
});

/**
 * formatCurrency — standard currency formatting helper.
 * Used across the platform for credit/cost displays.
 */
describe("formatCurrency() pattern", () => {
  function formatCurrency(value: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  it("formats whole dollar amount with cents", () => {
    const result = formatCurrency(100);
    expect(result).toBe("$100.00");
  });

  it("formats decimal amount correctly", () => {
    const result = formatCurrency(49.99);
    expect(result).toBe("$49.99");
  });

  it("formats cents-only amount correctly", () => {
    const result = formatCurrency(0.5);
    expect(result).toBe("$0.50");
  });

  it("formats zero correctly", () => {
    const result = formatCurrency(0);
    expect(result).toBe("$0.00");
  });

  it("formats negative amount correctly", () => {
    const result = formatCurrency(-25.5);
    expect(result).toBe("-$25.50");
  });

  it("formats large amounts with commas", () => {
    const result = formatCurrency(1000000);
    expect(result).toBe("$1,000,000.00");
  });

  it("handles very small amounts", () => {
    const result = formatCurrency(0.01);
    expect(result).toBe("$0.01");
  });

  it("formats EUR currency correctly", () => {
    const result = formatCurrency(100, "EUR");
    expect(result).toBe("€100.00");
  });

  it("formats GBP currency correctly", () => {
    const result = formatCurrency(100, "GBP");
    expect(result).toBe("£100.00");
  });

  it("rounds to 2 decimal places", () => {
    const result = formatCurrency(10.999);
    expect(result).toBe("$11.00");
  });
});
