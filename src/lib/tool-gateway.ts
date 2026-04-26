/**
 * Tool Gateway Simulation
 *
 * Simulates tool invocations with realistic mock data, delays,
 * and occasional error injection.
 */

import type { ToolName } from '@/src/types';

// ─────────────────────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolResult<T = unknown> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  /** Execution duration in ms. */
  readonly durationMs: number;
  /** Whether the output is from an untrusted source. */
  readonly isUntrusted: boolean;
}

export interface SearchResultItem {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly domain: string;
  readonly date: string;
}

export interface WebFetchResult {
  readonly url: string;
  readonly title: string;
  readonly content: string;
  readonly statusCode: number;
}

export interface CodeExecResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly runtime: string;
}

export interface FileOpResult {
  readonly path: string;
  readonly content: string;
  readonly operation: 'read' | 'write' | 'append';
  readonly bytesWritten: number;
}

export interface MemoryReadResult {
  readonly entries: { readonly key: string; readonly value: string; readonly score: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data banks
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SEARCH_RESULTS: Record<string, SearchResultItem[]> = {
  default: [
    {
      title: 'Understanding Large Language Model Routing — Anthropic',
      url: 'https://www.anthropic.com/research/model-routing',
      snippet:
        'We explore how model routers can improve latency and cost by routing simpler queries to smaller, faster models while preserving quality.',
      domain: 'anthropic.com',
      date: '2024-09-12',
    },
    {
      title: 'The Rise of Multi-Model AI Orchestration — Arxiv',
      url: 'https://arxiv.org/abs/2405.11321',
      snippet:
        'This paper introduces a framework for orchestrating multiple LLMs in a directed acyclic graph for complex reasoning tasks.',
      domain: 'arxiv.org',
      date: '2024-05-20',
    },
    {
      title: 'Cost-Effective AI: Tiered Model Selection Guide',
      url: 'https://blog.example.ai/tiered-model-selection',
      snippet:
        'A practical guide to selecting the right model tier for each task in your pipeline, with benchmarks and cost estimates.',
      domain: 'blog.example.ai',
      date: '2024-11-03',
    },
    {
      title: 'Building Reliable Agent Systems with Tool Use',
      url: 'https://engineering.openai.com/agent-tool-use',
      snippet:
        'Lessons from building production agent systems that invoke external tools reliably and handle failures gracefully.',
      domain: 'engineering.openai.com',
      date: '2024-08-15',
    },
  ],
  competitors: [
    {
      title: 'Top 10 AI Competitors in 2025 — TechCrunch',
      url: 'https://techcrunch.com/2025/01/10/ai-competitors-2025',
      snippet:
        'A comprehensive overview of the most promising AI startups challenging the incumbents across LLMs, agents, and infrastructure.',
      domain: 'techcrunch.com',
      date: '2025-01-10',
    },
    {
      title: 'EU AI Act Compliance for Startups — European Commission',
      url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
      snippet:
        'The European Commission\'s regulatory framework for AI and what it means for early-stage companies building agentic systems.',
      domain: 'europa.eu',
      date: '2024-12-01',
    },
    {
      title: 'Mistral AI vs OpenAI: A Technical Comparison',
      url: 'https://research.example.com/mistral-openai-comparison',
      snippet:
        'Detailed benchmark comparison of Mistral Large 2 and GPT-5 on coding, reasoning, and multilingual tasks.',
      domain: 'research.example.com',
      date: '2024-10-22',
    },
  ],
  code: [
    {
      title: 'React Server Components Best Practices',
      url: 'https://react.dev/reference/rsc',
      snippet:
        'Server Components let you render UI on the server, reducing the JavaScript bundle size sent to the client.',
      domain: 'react.dev',
      date: '2024-06-01',
    },
    {
      title: 'Python Pandas 3.0 Release Notes',
      url: 'https://pandas.pydata.org/docs/whatsnew/v3.0.0.html',
      snippet:
        'Pandas 3.0 introduces copy-on-write by default, significant memory improvements, and native string dtype.',
      domain: 'pandas.pydata.org',
      date: '2024-11-15',
    },
  ],
};

const MOCK_PAGES: Record<string, WebFetchResult> = {
  'anthropic.com': {
    url: 'https://www.anthropic.com/research/model-routing',
    title: 'Understanding Large Language Model Routing',
    content:
      'Anthropic researchers demonstrate that a simple routing classifier can reduce API costs by 40% while maintaining response quality. The key insight is that not every query needs the largest model.',
    statusCode: 200,
  },
  'arxiv.org': {
    url: 'https://arxiv.org/abs/2405.11321',
    title: 'The Rise of Multi-Model AI Orchestration',
    content:
      'We propose DAG-ORCH, a framework for orchestrating heterogeneous LLMs in directed acyclic graphs. Experiments on SWE-bench show 23% improvement over single-model baselines.',
    statusCode: 200,
  },
  'techcrunch.com': {
    url: 'https://techcrunch.com/2025/01/10/ai-competitors-2025',
    title: 'Top 10 AI Competitors in 2025',
    content:
      'The AI landscape is diversifying rapidly. New entrants from Europe (Mistral, Aleph Alpha) and Asia (DeepSeek, Qwen) are challenging US incumbents on price and performance.',
    statusCode: 200,
  },
  'europa.eu': {
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
    title: 'EU AI Act Compliance',
    content:
      'The EU AI Act classifies AI systems by risk level. High-risk systems must meet strict transparency, data governance, and human oversight requirements before market entry.',
    statusCode: 200,
  },
};

const MOCK_CODE_OUTPUTS: Record<string, CodeExecResult> = {
  python_pandas: {
    stdout:
      "shape: (142, 5)\ncolumns: ['date', 'revenue', 'cost', 'region', 'category']\nmean revenue: 48231.42\nstd revenue: 12405.33\ntop region: NA (43%)\n",
    stderr: '',
    exitCode: 0,
    runtime: 'python',
  },
  python_plot: {
    stdout: 'Saved figure to /tmp/output_revenue_trend.png (1280x720)\n',
    stderr: '',
    exitCode: 0,
    runtime: 'python',
  },
  nodejs: {
    stdout: 'Tests: 12 passed, 0 failed, 12 total\nCoverage: 87.3%\n',
    stderr: '',
    exitCode: 0,
    runtime: 'node',
  },
  bash: {
    stdout: 'total 128\n-rw-r--r-- 1 user user 4096 Jan 15 09:23 report.md\n',
    stderr: '',
    exitCode: 0,
    runtime: 'bash',
  },
};

const MOCK_MEMORY_ENTRIES: MemoryReadResult = {
  entries: [
    { key: 'user_preference_tone', value: 'professional, concise', score: 0.97 },
    { key: 'last_project_budget', value: '$45,000 approved for Q1', score: 0.91 },
    { key: 'competitor_intel_2024', value: 'Key rivals: AlphaCorp (28% share), BetaLabs (19% share)', score: 0.88 },
    { key: 'style_guide_markdown', value: 'Use H2 for sections, bullet lists for findings', score: 0.85 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

export interface GatewayConfig {
  /** Base delay multiplier (1.0 = normal). */
  speedMultiplier: number;
  /** Error injection rate (0–1). */
  errorRate: number;
  /** Retry count for failed calls. */
  maxRetries: number;
}

const DEFAULT_CONFIG: GatewayConfig = {
  speedMultiplier: 1.0,
  errorRate: 0.05,
  maxRetries: 2,
};

let globalConfig: GatewayConfig = { ...DEFAULT_CONFIG };

export function setGatewayConfig(cfg: Partial<GatewayConfig>) {
  globalConfig = { ...globalConfig, ...cfg };
}

export function getGatewayConfig(): GatewayConfig {
  return { ...globalConfig };
}

export function resetGatewayConfig() {
  globalConfig = { ...DEFAULT_CONFIG };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  const adjusted = Math.round(ms * globalConfig.speedMultiplier);
  return new Promise((resolve) => setTimeout(resolve, adjusted));
}

function shouldInjectError(): boolean {
  return Math.random() < globalConfig.errorRate;
}

function wrapUntrusted<T>(data: T): ToolResult<T> {
  return {
    success: true,
    data,
    error: null,
    durationMs: 0,
    isUntrusted: true,
  };
}

function wrapTrusted<T>(data: T, durationMs: number): ToolResult<T> {
  return {
    success: true,
    data,
    error: null,
    durationMs,
    isUntrusted: false,
  };
}

function fail<T>(error: string, durationMs: number): ToolResult<T> {
  return {
    success: false,
    data: null,
    error,
    durationMs,
    isUntrusted: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool implementations
// ─────────────────────────────────────────────────────────────────────────────

/** web.search — returns mock search results. */
export async function webSearch(query: string, _opts?: { topK?: number }): Promise<ToolResult<SearchResultItem[]>> {
  const baseDelay = 400 + Math.random() * 600;
  const start = performance.now();
  await delay(baseDelay);

  if (shouldInjectError()) {
    return fail('Search service temporarily unavailable (503)', performance.now() - start);
  }

  const q = query.toLowerCase();
  let results: SearchResultItem[] = MOCK_SEARCH_RESULTS.default;
  if (q.includes('competitor') || q.includes('eu') || q.includes('europe')) {
    results = MOCK_SEARCH_RESULTS.competitors;
  } else if (q.includes('code') || q.includes('react') || q.includes('python') || q.includes('api')) {
    results = MOCK_SEARCH_RESULTS.code;
  }

  return wrapTrusted(results.slice(0, _opts?.topK ?? 4), performance.now() - start);
}

/** web.fetch — returns mock page content. */
export async function webFetch(url: string): Promise<ToolResult<WebFetchResult>> {
  const baseDelay = 300 + Math.random() * 500;
  const start = performance.now();
  await delay(baseDelay);

  if (shouldInjectError()) {
    return fail(`Failed to fetch ${url}: connection timeout`, performance.now() - start);
  }

  const domain = new URL(url).hostname.replace(/^www\./, '');
  const page = MOCK_PAGES[domain] ?? {
    url,
    title: `Page at ${domain}`,
    content: `Fetched content from ${url}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    statusCode: 200,
  };

  return wrapTrusted(page, performance.now() - start);
}

/** web.browse — sequential fetch of multiple URLs. */
export async function webBrowse(urls: string[]): Promise<ToolResult<WebFetchResult[]>> {
  const start = performance.now();
  const results: WebFetchResult[] = [];
  for (const url of urls) {
    const r = await webFetch(url);
    if (r.success && r.data) {
      results.push(r.data);
    }
  }
  return wrapTrusted(results, performance.now() - start);
}

/** code.exec — returns mock code execution output. */
export async function codeExec(
  code: string,
  opts?: { runtime?: 'python' | 'node' | 'bash' }
): Promise<ToolResult<CodeExecResult>> {
  const baseDelay = 600 + Math.random() * 1200;
  const start = performance.now();
  await delay(baseDelay);

  if (shouldInjectError()) {
    return fail('Sandbox execution error: exceeded memory limit (256MB)', performance.now() - start);
  }

  const runtime = opts?.runtime ?? 'python';
  let key = 'python_pandas';
  if (runtime === 'node') key = 'nodejs';
  if (runtime === 'bash') key = 'bash';
  if (code.includes('matplotlib') || code.includes('plot') || code.includes('seaborn')) {
    key = 'python_plot';
  }

  const output = MOCK_CODE_OUTPUTS[key] ?? {
    stdout: `Executed ${runtime} script successfully.\n`,
    stderr: '',
    exitCode: 0,
    runtime,
  };

  return wrapTrusted(output, performance.now() - start);
}

/** files.rw — returns mock file content. */
export async function filesRw(
  path: string,
  operation: 'read' | 'write' | 'append',
  content?: string
): Promise<ToolResult<FileOpResult>> {
  const baseDelay = 150 + Math.random() * 250;
  const start = performance.now();
  await delay(baseDelay);

  if (shouldInjectError()) {
    return fail(`File operation failed: permission denied for ${path}`, performance.now() - start);
  }

  const result: FileOpResult = {
    path,
    operation,
    content: content ?? `// Mock file content for ${path}\nconst data = [];\n`,
    bytesWritten: content ? new TextEncoder().encode(content).length : 0,
  };

  return wrapTrusted(result, performance.now() - start);
}

/** memory.read — returns mock memory entries. */
export async function memoryRead(query: string): Promise<ToolResult<MemoryReadResult>> {
  const baseDelay = 80 + Math.random() * 120;
  const start = performance.now();
  await delay(baseDelay);

  if (shouldInjectError()) {
    return fail('Memory service unavailable: vector store timeout', performance.now() - start);
  }

  // Filter entries loosely by query
  const q = query.toLowerCase();
  const filtered = {
    entries: MOCK_MEMORY_ENTRIES.entries.filter(
      (e) =>
        q.length < 3 ||
        e.key.toLowerCase().includes(q) ||
        e.value.toLowerCase().includes(q)
    ),
  };

  return wrapTrusted(filtered.entries.length > 0 ? filtered : MOCK_MEMORY_ENTRIES, performance.now() - start);
}

/** memory.write — returns mock write confirmation. */
export async function memoryWrite(
  key: string,
  value: string
): Promise<ToolResult<{ key: string; value: string }>> {
  const baseDelay = 60 + Math.random() * 80;
  const start = performance.now();
  await delay(baseDelay);

  if (shouldInjectError()) {
    return fail('Memory write conflict: concurrent modification detected', performance.now() - start);
  }

  return wrapTrusted({ key, value }, performance.now() - start);
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic dispatch
// ─────────────────────────────────────────────────────────────────────────────

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isValidRuntime(value: unknown): value is 'python' | 'node' | 'bash' {
  return value === 'python' || value === 'node' || value === 'bash';
}

function isValidFileOperation(value: unknown): value is 'read' | 'write' | 'append' {
  return value === 'read' || value === 'write' || value === 'append';
}

export async function invokeTool(
  name: ToolName,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case 'web_search':
      return webSearch(String(args.query), { topK: Number(args.topK ?? 4) });
    case 'web_fetch':
      return webFetch(String(args.url));
    case 'web_browse':
      return webBrowse(isStringArray(args.urls) ? args.urls : []);
    case 'code_exec':
      return codeExec(String(args.code), { runtime: isValidRuntime(args.runtime) ? args.runtime : 'python' });
    case 'files_rw':
      return filesRw(
        String(args.path),
        isValidFileOperation(args.operation) ? args.operation : 'read',
        args.content ? String(args.content) : undefined
      );
    case 'memory_read':
      return memoryRead(String(args.query));
    case 'memory_write':
      return memoryWrite(String(args.key), String(args.value));
    default:
      return fail(`Tool "${name}" is not implemented in the simulation gateway.`, 0);
  }
}

/** Format a tool result for display with UNTRUSTED boundary tags when needed. */
export function formatToolResult(result: ToolResult, toolName: string): string {
  if (!result.success) {
    return `<UNTRUSTED tool="${toolName}" status="error">\n${result.error}\n</UNTRUSTED>`;
  }

  const dataStr =
    typeof result.data === 'string'
      ? result.data
      : JSON.stringify(result.data, null, 2);

  if (result.isUntrusted) {
    return `<UNTRUSTED tool="${toolName}">\n${dataStr}\n</UNTRUSTED>`;
  }
  return dataStr;
}
