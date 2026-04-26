import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  workflowToMarkdown,
  artifactToMarkdown,
  workflowToJSON,
  artifactToJSON,
  objectsToJSON,
  objectsToCSV,
  tasksToCSV,
  generateMockPDF,
  generateShareLink,
  expirationLabel,
  generateEmbedCode,
  generateResponsiveEmbed,
  copyToClipboard,
  type ExportableWorkflow,
} from "./export-utils";
import type { Workflow, Task, TaskEdge, Artifact } from "@/src/types/entities";

// ─── mock data builders ─────────────────────────────────────────────────────

function makeWorkflow(overrides: Partial<Workflow> = {}): Workflow {
  return {
    id: "wf_12345678",
    prompt: "Analyze Tesla earnings",
    status: "succeeded",
    spaceId: "sp_001",
    createdById: "usr_7a3f9e2b1c4d",
    activePlanRevisionId: null,
    safetyClass: "default",
    statusReason: null,
    startedAt: "2025-01-10T09:00:00Z",
    finishedAt: "2025-01-10T09:30:00Z",
    createdAt: "2025-01-10T08:55:00Z",
    updatedAt: "2025-01-10T09:30:00Z",
    ...overrides,
  } as Workflow;
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task_001",
    title: "Research Phase",
    instruction: "Search for Tesla Q3 earnings data",
    kind: "research",
    status: "succeeded",
    workflowId: "wf_12345678",
    dagLevel: 0,
    modelAttempts: ["claude-sonnet-4.6"],
    resolvedModelId: "claude-sonnet-4.6",
    maxAttempts: 3,
    statusReason: null,
    inputTokens: 1200,
    outputTokens: 800,
    creditsUsed: 0.05,
    durationMs: 4500,
    dependencies: [],
    toolCalls: [],
    startedAt: "2025-01-10T09:00:00Z",
    finishedAt: "2025-01-10T09:05:00Z",
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-10T09:05:00Z",
    ...overrides,
  } as Task;
}

function makeEdge(overrides: Partial<TaskEdge> = {}): TaskEdge {
  return {
    id: "edge_001",
    fromTaskId: "task_001",
    toTaskId: "task_002",
    workflowId: "wf_12345678",
    edgeType: "ordering",
    dataMapping: null,
    condition: null,
    createdAt: "2025-01-10T09:00:00Z",
    ...overrides,
  } as TaskEdge;
}

function makeArtifact(overrides: Partial<Artifact> = {}): Artifact {
  return {
    id: "art_001",
    name: "Report",
    kind: "report_md",
    taskId: "task_001",
    workflowId: "wf_12345678",
    storageUrl: "https://example.com/art_001",
    sizeBytes: 1024,
    checksum: "abc123",
    metadata: null,
    mimeType: "text/markdown",
    createdAt: "2025-01-10T09:05:00Z",
    ...overrides,
  } as Artifact;
}

function makeExportableWorkflow(
  overrides: Partial<ExportableWorkflow> = {}
): ExportableWorkflow {
  return {
    workflow: makeWorkflow(),
    tasks: [makeTask()],
    edges: [makeEdge()],
    artifacts: [makeArtifact()],
    ...overrides,
  };
}

// ─── workflowToMarkdown ─────────────────────────────────────────────────────

describe("workflowToMarkdown", () => {
  it("includes workflow prompt as heading", () => {
    const data = makeExportableWorkflow();
    const md = workflowToMarkdown(data);
    expect(md).toContain("# Workflow Report: Analyze Tesla earnings");
  });

  it("includes workflow ID", () => {
    const data = makeExportableWorkflow();
    const md = workflowToMarkdown(data);
    expect(md).toContain("`wf_12345678`");
  });

  it("includes status with emoji", () => {
    const data = makeExportableWorkflow();
    const md = workflowToMarkdown(data);
    expect(md).toContain("✅");
    expect(md).toContain("succeeded");
  });

  it("renders failed status with ❌ emoji", () => {
    const data = makeExportableWorkflow({
      workflow: makeWorkflow({ status: "failed" }),
    });
    const md = workflowToMarkdown(data);
    expect(md).toContain("❌");
  });

  it("renders running status with ⏳ emoji", () => {
    const data = makeExportableWorkflow({
      workflow: makeWorkflow({ status: "running" }),
    });
    const md = workflowToMarkdown(data);
    expect(md).toContain("⏳");
  });

  it("shows placeholder for missing timestamps", () => {
    const data = makeExportableWorkflow({
      workflow: makeWorkflow({ startedAt: null, finishedAt: null }),
    });
    const md = workflowToMarkdown(data);
    expect(md).toContain("—");
  });

  it("includes tasks section with count", () => {
    const data = makeExportableWorkflow({
      tasks: [makeTask(), makeTask({ id: "task_002", title: "Analysis Phase" })],
    });
    const md = workflowToMarkdown(data);
    expect(md).toContain("## Tasks (2)");
  });

  it("shows 'no tasks' message when tasks array is empty", () => {
    const data = makeExportableWorkflow({ tasks: [] });
    const md = workflowToMarkdown(data);
    expect(md).toContain("*No tasks recorded.*");
  });

  it("includes task details with model info", () => {
    const data = makeExportableWorkflow();
    const md = workflowToMarkdown(data);
    expect(md).toContain("claude-sonnet-4.6");
  });

  it("includes DAG edges section", () => {
    const data = makeExportableWorkflow();
    const md = workflowToMarkdown(data);
    expect(md).toContain("## DAG Edges (1)");
  });

  it("shows 'no edges' message when edges array is empty", () => {
    const data = makeExportableWorkflow({ edges: [] });
    const md = workflowToMarkdown(data);
    expect(md).toContain("*No edges recorded.*");
  });

  it("includes artifacts section", () => {
    const data = makeExportableWorkflow();
    const md = workflowToMarkdown(data);
    expect(md).toContain("## Artifacts (1)");
  });

  it("formats artifact size in KB when >= 1024 bytes", () => {
    const data = makeExportableWorkflow({
      artifacts: [makeArtifact({ sizeBytes: 2048 })],
    });
    const md = workflowToMarkdown(data);
    expect(md).toContain("2.0 KB");
  });

  it("formats artifact size in MB when >= 1MB", () => {
    const data = makeExportableWorkflow({
      artifacts: [makeArtifact({ sizeBytes: 2 * 1024 * 1024 })],
    });
    const md = workflowToMarkdown(data);
    expect(md).toContain("2.0 MB");
  });

  it("shows 'no artifacts' message when artifacts array is empty", () => {
    const data = makeExportableWorkflow({ artifacts: [] });
    const md = workflowToMarkdown(data);
    expect(md).toContain("*No artifacts generated.*");
  });

  it("includes status reason when present", () => {
    const data = makeExportableWorkflow({
      workflow: makeWorkflow({ statusReason: "Model timeout" }),
    });
    const md = workflowToMarkdown(data);
    expect(md).toContain("**Status Reason**");
    expect(md).toContain("Model timeout");
  });

  it("ends with export attribution", () => {
    const data = makeExportableWorkflow();
    const md = workflowToMarkdown(data);
    expect(md).toContain("*Exported from Multi-Model Agent Platform*");
  });
});

// ─── artifactToMarkdown ─────────────────────────────────────────────────────

describe("artifactToMarkdown", () => {
  it("includes artifact name as heading", () => {
    const artifact = makeArtifact({ name: "My Report" });
    const md = artifactToMarkdown(artifact);
    expect(md).toContain("# Artifact: My Report");
  });

  it("includes artifact properties table", () => {
    const artifact = makeArtifact();
    const md = artifactToMarkdown(artifact);
    expect(md).toContain("| **ID** |");
    expect(md).toContain("| **Kind** |");
    expect(md).toContain("| **MIME** |");
  });

  it("includes content section when content is provided", () => {
    const artifact = makeArtifact();
    const md = artifactToMarkdown(artifact, "This is the content");
    expect(md).toContain("## Content");
    expect(md).toContain("This is the content");
  });

  it("uses diff language for code_diff artifacts", () => {
    const artifact = makeArtifact({ kind: "code_diff" });
    const md = artifactToMarkdown(artifact, "+ added line");
    expect(md).toContain("```diff");
  });

  it("uses json language for json artifacts", () => {
    const artifact = makeArtifact({ kind: "json" });
    const md = artifactToMarkdown(artifact, '{"key": "value"}');
    expect(md).toContain("```json");
  });

  it("does not include content section when content is absent", () => {
    const artifact = makeArtifact();
    const md = artifactToMarkdown(artifact);
    expect(md).not.toContain("## Content");
  });
});

// ─── workflowToJSON ─────────────────────────────────────────────────────────

describe("workflowToJSON", () => {
  it("returns a valid JSON string", () => {
    const data = makeExportableWorkflow();
    const json = workflowToJSON(data);
    const parsed = JSON.parse(json);
    expect(parsed.workflow.id).toBe("wf_12345678");
  });

  it("pretty-prints with 2-space indentation", () => {
    const data = makeExportableWorkflow();
    const json = workflowToJSON(data);
    expect(json).toContain("\n  \"");
  expect(json).not.toContain("\n    \"");
  });
});

// ─── artifactToJSON ─────────────────────────────────────────────────────────

describe("artifactToJSON", () => {
  it("returns artifact as JSON", () => {
    const artifact = makeArtifact();
    const json = artifactToJSON(artifact);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe("art_001");
  });

  it("includes content when provided", () => {
    const artifact = makeArtifact();
    const json = artifactToJSON(artifact, "file content");
    const parsed = JSON.parse(json);
    expect(parsed.content).toBe("file content");
  });

  it("does not include content field when content is undefined", () => {
    const artifact = makeArtifact();
    const json = artifactToJSON(artifact);
    const parsed = JSON.parse(json);
    expect(parsed.content).toBeUndefined();
  });
});

// ─── objectsToJSON ──────────────────────────────────────────────────────────

describe("objectsToJSON", () => {
  it("converts array of objects to JSON string", () => {
    const rows = [{ a: 1 }, { a: 2 }];
    const json = objectsToJSON(rows);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].a).toBe(1);
  });

  it("pretty-prints with 2-space indentation", () => {
    const rows = [{ key: "value" }];
    const json = objectsToJSON(rows);
    expect(json).toContain("\n  \"");
  });
});

// ─── objectsToCSV ───────────────────────────────────────────────────────────

describe("objectsToCSV", () => {
  it("converts array of objects to CSV with headers", () => {
    const rows = [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }];
    const csv = objectsToCSV(rows);
    expect(csv).toContain("name,age");
    expect(csv).toContain("Alice,30");
    expect(csv).toContain("Bob,25");
  });

  it("returns empty string for empty array", () => {
    expect(objectsToCSV([])).toBe("");
  });

  it("escapes values containing commas", () => {
    const rows = [{ note: "has, comma" }];
    const csv = objectsToCSV(rows);
    expect(csv).toContain('"has, comma"');
  });

  it("escapes values containing double quotes", () => {
    const rows = [{ note: 'say "hello"' }];
    const csv = objectsToCSV(rows);
    expect(csv).toContain('"say ""hello"""');
  });

  it("escapes values containing newlines", () => {
    const rows = [{ note: "line1\nline2" }];
    const csv = objectsToCSV(rows);
    expect(csv).toContain('"line1\nline2"');
  });

  it("handles null and undefined values as empty strings", () => {
    const rows = [{ a: null, b: undefined, c: "value" }];
    const csv = objectsToCSV(rows);
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe(",,value");
  });

  it("converts numbers and booleans to strings", () => {
    const rows = [{ count: 42, active: true }];
    const csv = objectsToCSV(rows);
    expect(csv).toContain("42");
    expect(csv).toContain("true");
  });
});

// ─── tasksToCSV ─────────────────────────────────────────────────────────────

describe("tasksToCSV", () => {
  it("converts tasks to CSV format", () => {
    const tasks = [
      makeTask({
        id: "t1",
        title: "Task One",
        kind: "research",
        status: "succeeded",
      }),
    ];
    const csv = tasksToCSV(tasks);
    expect(csv).toContain("id,title,kind,status");
    expect(csv).toContain("t1");
    expect(csv).toContain("Task One");
    expect(csv).toContain("research");
  });

  it("joins modelAttempts with semicolons", () => {
    const tasks = [
      makeTask({
        modelAttempts: ["model-a", "model-b"],
        dependencies: ["dep1", "dep2"],
      }),
    ];
    const csv = tasksToCSV(tasks);
    expect(csv).toContain("model-a; model-b");
    expect(csv).toContain("dep1; dep2");
  });

  it("returns only headers for empty tasks array", () => {
    const csv = tasksToCSV([]);
    expect(csv).toBe("");
  });
});

// ─── generateMockPDF ────────────────────────────────────────────────────────

describe("generateMockPDF", () => {
  it("returns a Blob with PDF MIME type", async () => {
    const data = makeExportableWorkflow();
    const blob = await generateMockPDF(data, "workflow");
    expect(blob.type).toBe("application/pdf");
  });

  it("returns a Blob with non-zero size", async () => {
    const data = makeExportableWorkflow();
    const blob = await generateMockPDF(data, "workflow");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("returns a Blob starting with %PDF header", async () => {
    const data = makeExportableWorkflow();
    const blob = await generateMockPDF(data, "workflow");
    const text = await blob.text();
    expect(text.startsWith("%PDF")).toBe(true);
  });

  it("handles artifact type correctly", async () => {
    const artifact = makeArtifact();
    const blob = await generateMockPDF(artifact, "artifact");
    expect(blob.type).toBe("application/pdf");
  });

  it("contains %%EOF trailer", async () => {
    const data = makeExportableWorkflow();
    const blob = await generateMockPDF(data, "workflow");
    const text = await blob.text();
    expect(text).toContain("%%EOF");
  });
});

// ─── generateShareLink ──────────────────────────────────────────────────────

describe("generateShareLink", () => {
  it("generates a URL with token parameter", () => {
    const result = generateShareLink("https://app.example.com", {
      entityType: "workflow",
      entityId: "wf_123",
      expiresInHours: 24,
      requireAuth: false,
    });
    expect(result.url).toContain("t=");
    expect(result.url).toContain("/share/workflow/wf_123");
  });

  it("includes expiration parameter", () => {
    const result = generateShareLink("https://app.example.com", {
      entityType: "artifact",
      entityId: "art_123",
      expiresInHours: 24,
      requireAuth: false,
    });
    expect(result.url).toContain("exp=24");
  });

  it("includes auth parameter when requireAuth is true", () => {
    const result = generateShareLink("https://app.example.com", {
      entityType: "workflow",
      entityId: "wf_123",
      expiresInHours: null,
      requireAuth: true,
    });
    expect(result.url).toContain("auth=1");
  });

  it("sets expiresAt to null when expiresInHours is null", () => {
    const result = generateShareLink("https://app.example.com", {
      entityType: "workflow",
      entityId: "wf_123",
      expiresInHours: null,
      requireAuth: false,
    });
    expect(result.expiresAt).toBeNull();
  });

  it("returns a valid ISO timestamp for expiresAt", () => {
    const result = generateShareLink("https://app.example.com", {
      entityType: "workflow",
      entityId: "wf_123",
      expiresInHours: 1,
      requireAuth: false,
    });
    expect(result.expiresAt).not.toBeNull();
    // Verify it is a valid ISO date
    expect(new Date(result.expiresAt!).toISOString()).toBe(result.expiresAt);
  });

  it("generates a non-empty token", () => {
    const result = generateShareLink("https://app.example.com", {
      entityType: "workflow",
      entityId: "wf_123",
      expiresInHours: 24,
      requireAuth: false,
    });
    expect(result.token.length).toBeGreaterThan(0);
  });

  it("generates different tokens on successive calls", () => {
    const opts = {
      entityType: "workflow" as const,
      entityId: "wf_123",
      expiresInHours: 24,
      requireAuth: false,
    };
    const r1 = generateShareLink("https://app.example.com", opts);
    const r2 = generateShareLink("https://app.example.com", opts);
    expect(r1.token).not.toBe(r2.token);
  });
});

// ─── expirationLabel ────────────────────────────────────────────────────────

describe("expirationLabel", () => {
  it('returns "Never expires" for null', () => {
    expect(expirationLabel(null)).toBe("Never expires");
  });

  it('returns "1 hour" for 1 hour', () => {
    expect(expirationLabel(1)).toBe("1 hour");
  });

  it('returns "1 day" for 24 hours', () => {
    expect(expirationLabel(24)).toBe("1 day");
  });

  it('returns "7 days" for 168 hours', () => {
    expect(expirationLabel(168)).toBe("7 days");
  });

  it('returns "30 days" for 720 hours', () => {
    expect(expirationLabel(720)).toBe("30 days");
  });

  it("returns minutes for sub-hour values", () => {
    expect(expirationLabel(0.5)).toBe("30 minutes");
  });

  it("returns plural hours for values > 1 and < 24", () => {
    expect(expirationLabel(5)).toBe("5 hours");
  });

  it("returns days for values between 24 and 168", () => {
    expect(expirationLabel(48)).toBe("2 days");
  });

  it("returns months for values >= 720", () => {
    expect(expirationLabel(1440)).toBe("2 months");
  });
});

// ─── generateEmbedCode ──────────────────────────────────────────────────────

describe("generateEmbedCode", () => {
  const baseOptions = {
    workflowId: "wf_12345678",
    width: 800,
    height: 600,
    theme: "light" as const,
    showHeader: true,
    allowInteraction: true,
    borderRadius: 8,
  };

  it("returns an iframe HTML string", () => {
    const code = generateEmbedCode("https://app.example.com", baseOptions);
    expect(code).toContain("<iframe");
    expect(code).toContain("</iframe>");
  });

  it("includes the correct src URL", () => {
    const code = generateEmbedCode("https://app.example.com", baseOptions);
    expect(code).toContain("https://app.example.com/embed/workflow/wf_12345678");
  });

  it("sets width and height attributes", () => {
    const code = generateEmbedCode("https://app.example.com", baseOptions);
    expect(code).toContain('width="800"');
    expect(code).toContain('height="600"');
  });

  it("includes border-radius in style", () => {
    const code = generateEmbedCode("https://app.example.com", baseOptions);
    expect(code).toContain("border-radius: 8px");
  });

  it("sets theme query param when theme is not auto", () => {
    const code = generateEmbedCode("https://app.example.com", {
      ...baseOptions,
      theme: "dark",
    });
    expect(code).toContain("theme=dark");
  });

  it("does not set theme param when theme is auto", () => {
    const code = generateEmbedCode("https://app.example.com", {
      ...baseOptions,
      theme: "auto",
    });
    expect(code).not.toContain("theme=");
  });

  it("sets header=0 when showHeader is false", () => {
    const code = generateEmbedCode("https://app.example.com", {
      ...baseOptions,
      showHeader: false,
    });
    expect(code).toContain("header=0");
  });

  it("sets interaction=0 when allowInteraction is false", () => {
    const code = generateEmbedCode("https://app.example.com", {
      ...baseOptions,
      allowInteraction: false,
    });
    expect(code).toContain("interaction=0");
  });

  it("includes allow and loading attributes", () => {
    const code = generateEmbedCode("https://app.example.com", baseOptions);
    expect(code).toContain('allow="fullscreen"');
    expect(code).toContain("loading=\"lazy\"");
  });
});

// ─── generateResponsiveEmbed ────────────────────────────────────────────────

describe("generateResponsiveEmbed", () => {
  const baseOptions = {
    workflowId: "wf_12345678",
    width: 800,
    height: 600,
    theme: "light" as const,
    showHeader: true,
    allowInteraction: true,
    borderRadius: 8,
  };

  it("returns a script-based embed", () => {
    const code = generateResponsiveEmbed("https://app.example.com", baseOptions);
    expect(code).toContain("<script>");
    expect(code).toContain("</script>");
  });

  it("includes a container div with unique ID", () => {
    const code = generateResponsiveEmbed("https://app.example.com", baseOptions);
    expect(code).toContain('id="mma-embed-2345678"');
  });

  it("creates iframe element with correct src", () => {
    const code = generateResponsiveEmbed("https://app.example.com", baseOptions);
    expect(code).toContain(
      "https://app.example.com/embed/workflow/wf_12345678"
    );
  });

  it("uses minHeight when provided", () => {
    const code = generateResponsiveEmbed("https://app.example.com", {
      ...baseOptions,
      minHeight: 400,
    });
    expect(code).toContain("min-height:400px");
  });

  it("falls back to height when minHeight not provided", () => {
    const code = generateResponsiveEmbed("https://app.example.com", baseOptions);
    expect(code).toContain("min-height:600px");
  });
});

// ─── copyToClipboard ────────────────────────────────────────────────────────

describe("copyToClipboard", () => {
  let clipboardSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clipboardSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true on successful copy", async () => {
    const result = await copyToClipboard("hello");
    expect(result).toBe(true);
  });

  it("calls clipboard.writeText with the provided text", async () => {
    await copyToClipboard("test content");
    expect(clipboardSpy).toHaveBeenCalledWith("test content");
  });

  it("returns false when clipboard API throws", async () => {
    clipboardSpy.mockRejectedValue(new Error("Permission denied"));
    const result = await copyToClipboard("hello");
    expect(result).toBe(false);
  });

  it("uses fallback when isSecureContext is false", async () => {
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      writable: true,
    });
    const execCommandSpy = vi
      .spyOn(document, "execCommand")
      .mockReturnValue(true);
    const result = await copyToClipboard("fallback test");
    expect(result).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("copy");
  });
});
