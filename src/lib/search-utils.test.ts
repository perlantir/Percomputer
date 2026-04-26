import { describe, it, expect } from "vitest";
import {
  fuzzyMatch,
  searchItems,
  escapeHtml,
  highlightMatches,
  highlightLiteral,
  getHighlightClasses,
} from "./search-utils";
import type { SearchableItem } from "./search-utils";

// ─────────────────────────────────────────────────────────────────────────────
// fuzzyMatch
// ─────────────────────────────────────────────────────────────────────────────

describe("fuzzyMatch", () => {
  it("returns null for empty query", () => {
    expect(fuzzyMatch("", "hello world")).toBeNull();
  });

  it("returns null for whitespace-only query", () => {
    expect(fuzzyMatch("   ", "hello world")).toBeNull();
  });

  it("matches exact substring with score 0", () => {
    const result = fuzzyMatch("hello", "hello world");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0);
    expect(result!.indices).toEqual([0, 1, 2, 3, 4]);
  });

  it("performs case-insensitive matching", () => {
    const result = fuzzyMatch("HELLO", "Hello World");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0);
  });

  it("matches non-consecutive characters", () => {
    const result = fuzzyMatch("hw", "hello world");
    expect(result).not.toBeNull();
    expect(result!.indices).toContain(0); // h
    expect(result!.indices).toContain(6); // w
  });

  it("returns null when not all query characters are found", () => {
    expect(fuzzyMatch("xyz", "hello world")).toBeNull();
  });

  it("assigns lower score to exact match vs fuzzy match", () => {
    const exact = fuzzyMatch("abc", "abcdef");
    const fuzzy = fuzzyMatch("acf", "abcdef");
    expect(exact).not.toBeNull();
    expect(fuzzy).not.toBeNull();
    expect(exact!.score).toBeLessThan(fuzzy!.score);
  });

  it("matches at word boundary with bonus", () => {
    const result = fuzzyMatch("wo", "hello world");
    expect(result).not.toBeNull();
    expect(result!.indices).toContain(6);
  });

  it("returns score >= 0.01 for non-exact matches", () => {
    const result = fuzzyMatch("abc", "axbxcx");
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(0.01);
  });

  it("handles single-character query", () => {
    const result = fuzzyMatch("a", "alphabet");
    expect(result).not.toBeNull();
    expect(result!.indices).toEqual([0]);
  });

  it("handles query longer than text", () => {
    expect(fuzzyMatch("abcdefgh", "abc")).toBeNull();
  });

  it("handles unicode characters", () => {
    const result = fuzzyMatch("emoji", "emojis are fun");
    expect(result).not.toBeNull();
  });

  it("handles text with special characters", () => {
    const result = fuzzyMatch("task-1", "task-1-status");
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// searchItems
// ─────────────────────────────────────────────────────────────────────────────

describe("searchItems", () => {
  const mockItems: SearchableItem[] = [
    {
      id: "1",
      type: "workflow",
      title: "Tesla Q3 Analysis",
      subtitle: "Financial analysis of Tesla Q3 earnings",
      searchableText: "tesla q3 earnings report financial analysis",
      href: "/workflows/1",
    },
    {
      id: "2",
      type: "workflow",
      title: "BYD Valuation",
      subtitle: "Complete valuation memo for BYD",
      searchableText: "byd valuation electric vehicle company",
      href: "/workflows/2",
    },
    {
      id: "3",
      type: "artifact",
      title: "Investment Memo",
      subtitle: "Draft investment memo",
      searchableText: "investment memo draft final version",
      href: "/artifacts/3",
    },
    {
      id: "4",
      type: "memory",
      title: "Lithium Research",
      searchableText: "lithium mining companies research",
      href: "/memory/4",
    },
  ];

  it("returns empty array for empty query", () => {
    const results = searchItems("", mockItems);
    expect(results).toEqual([]);
  });

  it("returns empty array for whitespace-only query", () => {
    const results = searchItems("   ", mockItems);
    expect(results).toEqual([]);
  });

  it("finds items matching title", () => {
    const results = searchItems("Tesla", mockItems);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("1");
  });

  it("finds items matching subtitle when title doesn't match", () => {
    const results = searchItems("valuation", mockItems);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.id === "2")).toBe(true);
  });

  it("finds items matching searchableText", () => {
    const results = searchItems("lithium", mockItems);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("4");
  });

  it("performs case-insensitive search", () => {
    const resultsLower = searchItems("tesla", mockItems);
    const resultsUpper = searchItems("TESLA", mockItems);
    expect(resultsLower.length).toBe(resultsUpper.length);
    expect(resultsLower[0].id).toBe(resultsUpper[0].id);
  });

  it("returns highlighted title in results", () => {
    const results = searchItems("Tesla", mockItems);
    expect(results[0].highlightedTitle).toContain("<mark");
  });

  it("returns highlighted subtitle when subtitle matched", () => {
    const results = searchItems("valuation", mockItems);
    const bydResult = results.find((r) => r.id === "2");
    expect(bydResult?.highlightedSubtitle).toContain("<mark");
  });

  it("respects limit option", () => {
    const results = searchItems("a", mockItems, { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("respects minScoreThreshold option", () => {
    const results = searchItems("zzzz", mockItems, {
      minScoreThreshold: 0.1,
    });
    expect(results.length).toBe(0);
  });

  it("sorts results by score ascending", () => {
    const results = searchItems("e", mockItems);
    if (results.length > 1) {
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].match.score).toBeLessThanOrEqual(
          results[i + 1].match.score
        );
      }
    }
  });

  it("returns empty array when no items match", () => {
    const results = searchItems("xyz123", mockItems);
    expect(results).toEqual([]);
  });

  it("includes all original item properties in result", () => {
    const results = searchItems("Tesla", mockItems);
    expect(results[0].type).toBe("workflow");
    expect(results[0].href).toBe("/workflows/1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// escapeHtml
// ─────────────────────────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes less-than sign", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater-than sign", () => {
    expect(escapeHtml(">")).toBe("&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("escapes all special characters in mixed content", () => {
    const input = '<a href="link" data-val=\'x\'>Tom & Jerry</a>';
    const expected =
      "&lt;a href=&quot;link&quot; data-val=&#039;x&#039;&gt;Tom &amp; Jerry&lt;/a&gt;";
    expect(escapeHtml(input)).toBe(expected);
  });

  it("returns plain text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// highlightMatches
// ─────────────────────────────────────────────────────────────────────────────

describe("highlightMatches", () => {
  it("returns escaped text when no indices provided", () => {
    const result = highlightMatches("hello world", []);
    expect(result).toBe("hello world");
  });

  it("wraps matched characters in mark tags", () => {
    const result = highlightMatches("hello world", [0, 1, 2]);
    expect(result).toContain("<mark class=\"search-highlight\">");
    expect(result).toContain("</mark>");
  });

  it("marks consecutive characters in a single tag", () => {
    const result = highlightMatches("hello", [0, 1, 2, 3, 4]);
    const markCount = (result.match(/<mark/g) || []).length;
    expect(markCount).toBe(1);
  });

  it("creates separate mark tags for non-consecutive matches", () => {
    const result = highlightMatches("hello world", [0, 6]);
    const markCount = (result.match(/<mark/g) || []).length;
    expect(markCount).toBe(2);
  });

  it("escapes HTML in text when escape=true", () => {
    const result = highlightMatches("<b>test</b>", [1], true);
    expect(result).toContain("&lt;");
    expect(result).not.toContain("<b>");
  });

  it("does not escape HTML when escape=false", () => {
    const result = highlightMatches("<b>test</b>", [1], false);
    expect(result).toContain("<b>");
  });

  it("handles empty string", () => {
    const result = highlightMatches("", []);
    expect(result).toBe("");
  });

  it("handles indices at boundaries", () => {
    const result = highlightMatches("hello", [0, 4]);
    expect(result).toContain(
      '<mark class="search-highlight">h</mark>'
    );
    expect(result).toContain(
      '<mark class="search-highlight">o</mark>'
    );
  });

  it("handles all characters matched", () => {
    const result = highlightMatches("hi", [0, 1]);
    expect(result).toBe(
      '<mark class="search-highlight">hi</mark>'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// highlightLiteral
// ─────────────────────────────────────────────────────────────────────────────

describe("highlightLiteral", () => {
  it("returns escaped text when query is empty", () => {
    expect(highlightLiteral("hello", "")).toBe("hello");
  });

  it("returns escaped text when query is whitespace", () => {
    expect(highlightLiteral("hello", "   ")).toBe("hello");
  });

  it("wraps literal query match in mark tags", () => {
    const result = highlightLiteral("hello world", "world");
    expect(result).toContain('<mark class="search-highlight">world</mark>');
  });

  it("is case-insensitive", () => {
    const result1 = highlightLiteral("Hello World", "hello");
    const result2 = highlightLiteral("Hello World", "HELLO");
    expect(result1).toContain("<mark");
    expect(result2).toContain("<mark");
  });

  it("highlights all occurrences", () => {
    const result = highlightLiteral("hello hello hello", "hello");
    const markCount = (result.match(/<mark/g) || []).length;
    expect(markCount).toBe(3);
  });

  it("escapes HTML in the text", () => {
    const result = highlightLiteral("<script>alert(1)</script>", "script");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("handles special regex characters in query safely", () => {
    const result = highlightLiteral("price is $5.00", "$5");
    expect(result).toContain("<mark");
  });

  it("uses custom className when provided", () => {
    const result = highlightLiteral("test query", "query", "custom-highlight");
    expect(result).toContain('<mark class="custom-highlight">');
  });

  it("returns unchanged text when query is not found", () => {
    const result = highlightLiteral("hello world", "xyz");
    expect(result).toBe("hello world");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getHighlightClasses
// ─────────────────────────────────────────────────────────────────────────────

describe("getHighlightClasses", () => {
  it("returns a non-empty string", () => {
    const result = getHighlightClasses();
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns Tailwind classes as a space-separated string", () => {
    const result = getHighlightClasses();
    expect(result).toContain("bg-yellow-200/80");
  });

  it("includes light mode classes", () => {
    const result = getHighlightClasses();
    expect(result).toContain("text-yellow-900");
    expect(result).toContain("rounded-sm");
    expect(result).toContain("px-0.5");
  });

  it("includes dark mode classes", () => {
    const result = getHighlightClasses();
    expect(result).toContain("dark:bg-yellow-400/20");
    expect(result).toContain("dark:text-yellow-200");
  });

  it("returns multiple space-separated classes", () => {
    const result = getHighlightClasses();
    const parts = result.split(" ");
    expect(parts.length).toBeGreaterThan(1);
  });
});
