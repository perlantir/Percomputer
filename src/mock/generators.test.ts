import { describe, it, expect, beforeEach } from "vitest";
import {
  resetSeed,
  uuid,
  shortId,
  ago,
  between,
  addMs,
  iso,
  pick,
  pickN,
  randInt,
  randFloat,
  domain,
  faviconUrl,
  taskSpec,
  makeSources,
  makeArtifacts,
  makeModelUsage,
  lorem,
  sentence,
  paragraph,
  budget,
  randomObjective,
  allObjectives,
  generateId,
  generateWorkflowDAG,
} from "./generators";

// ─────────────────────────────────────────────────────────────────────────────
// Seed / UUID
// ─────────────────────────────────────────────────────────────────────────────

describe("resetSeed", () => {
  it("resets the random sequence for deterministic output", () => {
    resetSeed(42);
    const first = uuid();
    resetSeed(42);
    const second = uuid();
    expect(first).toBe(second);
  });

  it("produces different sequences with different seeds", () => {
    resetSeed(1);
    const first = uuid();
    resetSeed(2);
    const second = uuid();
    expect(first).not.toBe(second);
  });

  it("defaults to seed=1", () => {
    resetSeed();
    const first = uuid();
    resetSeed(1);
    const second = uuid();
    expect(first).toBe(second);
  });
});

describe("uuid", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a string", () => {
    const result = uuid();
    expect(typeof result).toBe("string");
  });

  it("returns a valid UUID v4 format", () => {
    const result = uuid();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(result).toMatch(uuidRegex);
  });

  it("always contains '4' at version position", () => {
    for (let i = 0; i < 10; i++) {
      const result = uuid();
      expect(result.charAt(14)).toBe("4");
    }
  });

  it("always has 'a' at variant position", () => {
    for (let i = 0; i < 10; i++) {
      const result = uuid();
      // position 19 (after the third hyphen) should be 'a'
      const parts = result.split("-");
      expect(parts[3].charAt(0)).toBe("a");
    }
  });

  it("produces different UUIDs on successive calls", () => {
    const u1 = uuid();
    const u2 = uuid();
    expect(u1).not.toBe(u2);
  });

  it("has correct hyphen positions", () => {
    const result = uuid();
    expect(result.charAt(8)).toBe("-");
    expect(result.charAt(13)).toBe("-");
    expect(result.charAt(18)).toBe("-");
    expect(result.charAt(23)).toBe("-");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// shortId
// ─────────────────────────────────────────────────────────────────────────────

describe("shortId", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a string", () => {
    const result = shortId("task");
    expect(typeof result).toBe("string");
  });

  it("starts with the given prefix", () => {
    const result = shortId("usr");
    expect(result.startsWith("usr_")).toBe(true);
  });

  it("is lowercase", () => {
    const result = shortId("ABC");
    expect(result).toBe(result.toLowerCase());
  });

  it("is deterministic with same seed", () => {
    resetSeed(42);
    const first = shortId("task");
    resetSeed(42);
    const second = shortId("task");
    expect(first).toBe(second);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Timestamps
// ─────────────────────────────────────────────────────────────────────────────

describe("ago", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a Date object", () => {
    const result = ago(0);
    expect(result).toBeInstanceOf(Date);
  });

  it("returns a date in the past", () => {
    const result = ago(5);
    const now = new Date("2025-01-15T14:30:00Z").getTime();
    expect(result.getTime()).toBeLessThan(now);
  });

  it("returns more recent date for smaller day values", () => {
    const result1 = ago(1);
    const result2 = ago(10);
    expect(result1.getTime()).toBeGreaterThan(result2.getTime());
  });

  it("is deterministic with same seed", () => {
    resetSeed(42);
    const first = ago(5);
    resetSeed(42);
    const second = ago(5);
    expect(first.getTime()).toBe(second.getTime());
  });
});

describe("between", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a Date object", () => {
    const result = between(1, 10);
    expect(result).toBeInstanceOf(Date);
  });

  it("returns a date between the two day ranges", () => {
    const now = new Date("2025-01-15T14:30:00Z").getTime();
    const result = between(1, 30);
    const minTime = now - 30 * 24 * 60 * 60 * 1000;
    const maxTime = now - 1 * 24 * 60 * 60 * 1000;
    expect(result.getTime()).toBeGreaterThanOrEqual(minTime);
    expect(result.getTime()).toBeLessThanOrEqual(maxTime);
  });

  it("handles reversed ranges correctly", () => {
    const result = between(10, 1);
    expect(result).toBeInstanceOf(Date);
    expect(!isNaN(result.getTime())).toBe(true);
  });
});

describe("addMs", () => {
  it("adds milliseconds to a date", () => {
    const base = new Date("2025-01-15T14:30:00Z");
    const result = addMs(base, 60000);
    expect(result.toISOString()).toBe("2025-01-15T14:31:00.000Z");
  });

  it("subtracts milliseconds with negative value", () => {
    const base = new Date("2025-01-15T14:30:00Z");
    const result = addMs(base, -60000);
    expect(result.toISOString()).toBe("2025-01-15T14:29:00.000Z");
  });

  it("returns a new Date instance", () => {
    const base = new Date("2025-01-15T14:30:00Z");
    const result = addMs(base, 0);
    expect(result).not.toBe(base);
    expect(result.getTime()).toBe(base.getTime());
  });
});

describe("iso", () => {
  it("returns ISO string representation of date", () => {
    const d = new Date("2025-01-15T14:30:00Z");
    expect(iso(d)).toBe("2025-01-15T14:30:00.000Z");
  });

  it("returns a string", () => {
    const result = iso(new Date());
    expect(typeof result).toBe("string");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pickers / Random
// ─────────────────────────────────────────────────────────────────────────────

describe("pick", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns an element from the array", () => {
    const arr = ["a", "b", "c", "d"];
    const result = pick(arr);
    expect(arr).toContain(result);
  });

  it("returns an element for single-item array", () => {
    const arr = ["only"];
    expect(pick(arr)).toBe("only");
  });

  it("is deterministic with same seed", () => {
    resetSeed(42);
    const arr = ["a", "b", "c", "d", "e"];
    const first = pick(arr);
    resetSeed(42);
    const second = pick(arr);
    expect(first).toBe(second);
  });
});

describe("pickN", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns N elements from the array", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = pickN(arr, 3);
    expect(result).toHaveLength(3);
    expect(result.every((item) => arr.includes(item))).toBe(true);
  });

  it("does not exceed array length", () => {
    const arr = [1, 2];
    const result = pickN(arr, 5);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for n=0", () => {
    const arr = [1, 2, 3];
    expect(pickN(arr, 0)).toEqual([]);
  });

  it("does not mutate original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    pickN(arr, 3);
    expect(arr).toEqual(original);
  });
});

describe("randInt", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns an integer", () => {
    const result = randInt(1, 100);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("returns a value within range", () => {
    const result = randInt(10, 20);
    expect(result).toBeGreaterThanOrEqual(10);
    expect(result).toBeLessThanOrEqual(20);
  });

  it("can return both min and max", () => {
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 100; i++) {
      const result = randInt(1, 2);
      if (result === 1) sawMin = true;
      if (result === 2) sawMax = true;
    }
    expect(sawMin || sawMax).toBe(true);
  });

  it("handles min === max", () => {
    expect(randInt(5, 5)).toBe(5);
  });
});

describe("randFloat", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a number", () => {
    const result = randFloat(0, 1);
    expect(typeof result).toBe("number");
  });

  it("returns a value within range", () => {
    const result = randFloat(10, 20);
    expect(result).toBeGreaterThanOrEqual(10);
    expect(result).toBeLessThanOrEqual(20);
  });

  it("respects decimal places", () => {
    const result = randFloat(0, 1, 2);
    const decimalStr = result.toString();
    const decimalPlaces = decimalStr.includes(".")
      ? decimalStr.split(".")[1].length
      : 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it("defaults to 2 decimal places", () => {
    const result = randFloat(1, 2);
    const match = result.toString().match(/\.(\d+)/);
    if (match) {
      expect(match[1].length).toBeLessThanOrEqual(2);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Domain / Source helpers
// ─────────────────────────────────────────────────────────────────────────────

describe("domain", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a string", () => {
    expect(typeof domain()).toBe("string");
  });

  it("returns a non-empty string", () => {
    expect(domain().length).toBeGreaterThan(0);
  });

  it("returns a domain with dots", () => {
    expect(domain()).toContain(".");
  });
});

describe("faviconUrl", () => {
  it("returns a URL string", () => {
    const result = faviconUrl("example.com");
    expect(result.startsWith("https://")).toBe(true);
  });

  it("includes the domain in the URL", () => {
    const result = faviconUrl("example.com");
    expect(result).toContain("domain=example.com");
  });

  it("includes the size parameter", () => {
    const result = faviconUrl("example.com");
    expect(result).toContain("sz=64");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// taskSpec
// ─────────────────────────────────────────────────────────────────────────────

describe("taskSpec", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a string", () => {
    const result = taskSpec("research", { topic: "AI" });
    expect(typeof result).toBe("string");
  });

  it("replaces placeholders with values", () => {
    const result = taskSpec("research", { topic: "Tesla" });
    expect(result).not.toContain("{topic}");
    expect(result).toContain("Tesla");
  });

  it("handles multiple replacements", () => {
    const result = taskSpec("code", { lang: "Python", task: "data analysis" });
    expect(result).not.toContain("{lang}");
    expect(result).not.toContain("{task}");
  });

  it("returns a task from the correct kind template", () => {
    const result = taskSpec("visualize", { chartType: "bar", dataset: "sales" });
    expect(result.toLowerCase()).toMatch(/chart|dashboard|infographic|export/i);
  });

  it("returns a non-empty string", () => {
    const result = taskSpec("synthesis", {});
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeSources
// ─────────────────────────────────────────────────────────────────────────────

describe("makeSources", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns an array of the requested length", () => {
    const result = makeSources(5, ["lithium", "tesla"]);
    expect(result).toHaveLength(5);
  });

  it("returns empty array for count 0", () => {
    expect(makeSources(0, ["topic"])).toEqual([]);
  });

  it("each source has required fields", () => {
    const result = makeSources(1, ["lithium"]);
    const source = result[0];
    expect(source.id).toBeDefined();
    expect(source.url).toContain("http");
    expect(source.domain).toBeDefined();
    expect(source.title).toBeDefined();
    expect(source.excerpt).toBeDefined();
    expect(typeof source.cited).toBe("number");
    expect(source.accessedAt).toBeDefined();
  });

  it("includes favicon URL", () => {
    const result = makeSources(1, ["tesla"]);
    expect(result[0].favicon).toContain("google.com/s2/favicons");
  });

  it("includes topic in excerpt", () => {
    const result = makeSources(2, ["lithium"]);
    expect(result[0].excerpt.toLowerCase()).toContain("lithium");
  });

  it("generates deterministic output with same seed", () => {
    resetSeed(42);
    const first = makeSources(3, ["topic"]);
    resetSeed(42);
    const second = makeSources(3, ["topic"]);
    expect(first.map((s) => s.id)).toEqual(second.map((s) => s.id));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeArtifacts
// ─────────────────────────────────────────────────────────────────────────────

describe("makeArtifacts", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns an array of the requested length", () => {
    const result = makeArtifacts(4, "memo");
    expect(result).toHaveLength(4);
  });

  it("returns empty array for count 0", () => {
    expect(makeArtifacts(0, "memo")).toEqual([]);
  });

  it("each artifact has required fields", () => {
    const result = makeArtifacts(1, "code");
    const art = result[0];
    expect(art.id).toBeDefined();
    expect(art.name).toBeDefined();
    expect(art.type).toBeDefined();
    expect(art.sizeBytes).toBeGreaterThan(0);
    expect(art.description).toBeDefined();
    expect(art.createdAt).toBeDefined();
  });

  it("appends version suffix for duplicate names (i > 0)", () => {
    const result = makeArtifacts(3, "memo");
    expect(result[1].name).toContain("v2");
    expect(result[2].name).toContain("v3");
  });

  it("sizeBytes is a multiple of 1024", () => {
    const result = makeArtifacts(5, "memo");
    result.forEach((art) => {
      expect(art.sizeBytes % 1024).toBe(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeModelUsage
// ─────────────────────────────────────────────────────────────────────────────

describe("makeModelUsage", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns exactly 2 model entries", () => {
    const result = makeModelUsage(5);
    expect(result).toHaveLength(2);
  });

  it("primary model has more calls than secondary", () => {
    const result = makeModelUsage(10);
    expect(result[0].calls).toBeGreaterThanOrEqual(result[1].calls);
  });

  it("uses different models", () => {
    const result = makeModelUsage(5);
    expect(result[0].modelId).not.toBe(result[1].modelId);
  });

  it("each entry has required fields", () => {
    const result = makeModelUsage(5);
    result.forEach((u) => {
      expect(u.modelId).toBeDefined();
      expect(u.calls).toBeGreaterThan(0);
      expect(u.inputTokens).toBeGreaterThan(0);
      expect(u.outputTokens).toBeGreaterThan(0);
      expect(u.costCredits).toBeGreaterThan(0);
      expect(u.avgLatencyMs).toBeGreaterThan(0);
    });
  });

  it("inputTokens scales with calls", () => {
    const result = makeModelUsage(5);
    expect(result[0].inputTokens).toBeGreaterThanOrEqual(
      result[0].calls * 800
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Lorem ipsum helpers
// ─────────────────────────────────────────────────────────────────────────────

describe("lorem", () => {
  it("returns a string ending with a period", () => {
    const result = lorem(5);
    expect(result.endsWith(".")).toBe(true);
  });

  it("returns N words when requested", () => {
    const result = lorem(10);
    const wordCount = result.replace(".", "").split(" ").filter(Boolean).length;
    expect(wordCount).toBe(10);
  });

  it("returns empty word list for n=0", () => {
    const result = lorem(0);
    expect(result).toBe(".");
  });

  it("cycles through available words", () => {
    const result1 = lorem(5);
    const result2 = lorem(5);
    // Same seed = same output
    expect(result1).toBe(result2);
  });
});

describe("sentence", () => {
  it("returns a string", () => {
    expect(typeof sentence(1)).toBe("string");
  });

  it("returns 1 sentence by default", () => {
    const result = sentence();
    const count = result.split(".").filter(Boolean).length;
    expect(count).toBe(1);
  });

  it("returns multiple sentences when requested", () => {
    const result = sentence(3);
    const count = result.split(".").filter((s) => s.trim().length > 0).length;
    expect(count).toBe(3);
  });
});

describe("paragraph", () => {
  it("returns a string", () => {
    expect(typeof paragraph(1)).toBe("string");
  });

  it("contains double newlines between sentences", () => {
    const result = paragraph(3);
    expect(result).toContain("\n\n");
  });

  it("returns non-empty string by default", () => {
    const result = paragraph();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Budget helpers
// ─────────────────────────────────────────────────────────────────────────────

describe("budget", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns budgetCredits and spentCredits", () => {
    const result = budget();
    expect(result).toHaveProperty("budgetCredits");
    expect(result).toHaveProperty("spentCredits");
  });

  it("budgetCredits is a positive integer", () => {
    const result = budget();
    expect(Number.isInteger(result.budgetCredits)).toBe(true);
    expect(result.budgetCredits).toBeGreaterThan(0);
  });

  it("spentCredits is less than budgetCredits", () => {
    const result = budget();
    expect(result.spentCredits).toBeLessThan(result.budgetCredits);
  });

  it("spentCredits is positive", () => {
    const result = budget();
    expect(result.spentCredits).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Objectives
// ─────────────────────────────────────────────────────────────────────────────

describe("randomObjective", () => {
  beforeEach(() => {
    resetSeed(1);
  });

  it("returns a string", () => {
    expect(typeof randomObjective()).toBe("string");
  });

  it("returns a non-empty string", () => {
    expect(randomObjective().length).toBeGreaterThan(0);
  });

  it("returns a value from the objectives list", () => {
    const result = randomObjective();
    const all = allObjectives();
    expect(all).toContain(result);
  });
});

describe("allObjectives", () => {
  it("returns an array", () => {
    expect(Array.isArray(allObjectives())).toBe(true);
  });

  it("returns non-empty array", () => {
    expect(allObjectives().length).toBeGreaterThan(0);
  });

  it("returns strings only", () => {
    expect(allObjectives().every((o) => typeof o === "string")).toBe(true);
  });

  it("returns a copy (mutable)", () => {
    const first = allObjectives();
    first.push("modified");
    const second = allObjectives();
    expect(second).not.toContain("modified");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Legacy generateId
// ─────────────────────────────────────────────────────────────────────────────

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId("task")).toBe("string");
  });

  it("starts with the prefix", () => {
    const result = generateId("workflow");
    expect(result.startsWith("workflow-")).toBe(true);
  });

  it("produces different IDs on successive calls", () => {
    const id1 = generateId("task");
    const id2 = generateId("task");
    expect(id1).not.toBe(id2);
  });

  it("contains two hyphens (prefix + random + timestamp)", () => {
    const result = generateId("usr");
    const hyphens = result.split("-").length - 1;
    expect(hyphens).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateWorkflowDAG
// ─────────────────────────────────────────────────────────────────────────────

describe("generateWorkflowDAG", () => {
  it("returns version 1", () => {
    const result = generateWorkflowDAG("wf_123", []);
    expect(result.version).toBe(1);
  });

  it("creates a node for each task", () => {
    const tasks = [
      { id: "t1", name: "Task 1", status: "succeeded", dependencies: [] },
      { id: "t2", name: "Task 2", status: "running", dependencies: [] },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.nodes).toHaveLength(2);
  });

  it("creates edges for dependencies", () => {
    const tasks = [
      { id: "t1", name: "Task 1", status: "succeeded", dependencies: [] },
      {
        id: "t2",
        name: "Task 2",
        status: "running",
        dependencies: ["t1"],
      },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].from).toBe("node-t1");
    expect(result.edges[0].to).toBe("node-t2");
  });

  it("creates no edges for tasks without dependencies", () => {
    const tasks = [
      { id: "t1", name: "Task 1", status: "succeeded", dependencies: [] },
      { id: "t2", name: "Task 2", status: "running", dependencies: [] },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.edges).toHaveLength(0);
  });

  it("includes task status in node", () => {
    const tasks = [
      { id: "t1", name: "Task 1", status: "succeeded", dependencies: [] },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.nodes[0].status).toBe("succeeded");
  });

  it("includes model info in node", () => {
    const tasks = [
      {
        id: "t1",
        name: "Task 1",
        status: "succeeded",
        assignedModel: "gpt-5.1",
        dependencies: [],
      },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.nodes[0].model).toBe("gpt-5.1");
  });

  it("calculates estimatedTokens from input + output", () => {
    const tasks = [
      {
        id: "t1",
        name: "Task 1",
        status: "succeeded",
        inputTokens: 100,
        outputTokens: 50,
        dependencies: [],
      },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.nodes[0].estimatedTokens).toBe(150);
  });

  it("defaults depth to 0 for y coordinate", () => {
    const tasks = [
      { id: "t1", name: "Task 1", status: "succeeded", dependencies: [] },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.nodes[0].y).toBe(0);
  });

  it("uses depth for y coordinate when provided", () => {
    const tasks = [
      {
        id: "t1",
        name: "Task 1",
        status: "succeeded",
        depth: 2,
        dependencies: [],
      },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.nodes[0].y).toBe(240); // 2 * 120
  });

  it("includes taskId on node", () => {
    const tasks = [
      { id: "t1", name: "Task 1", status: "succeeded", dependencies: [] },
    ];
    const result = generateWorkflowDAG("wf_123", tasks);
    expect(result.nodes[0].taskId).toBe("t1");
  });
});
