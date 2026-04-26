/**
 * Model Router Simulation
 *
 * - 19-model roster with full capabilities, costs, and latency profiles
 * - Selects model based on task kind + tier + safety class
 * - Cost calculation per task
 * - Latency simulation
 */

import type {
  ModelTier,
  TaskKind,
  SafetyClass,
  ModelDefinition,
  CostProfile,
  LatencyProfile,
  ModelCapabilities,
  TokenBudget,
} from '@/src/types';

// ─────────────────────────────────────────────────────────────────────────────
// 19-model roster
// ─────────────────────────────────────────────────────────────────────────────

function caps(partial: Partial<ModelCapabilities>): ModelCapabilities {
  return {
    reasoning: false,
    coding: false,
    analysis: false,
    creativeWriting: false,
    longContext: false,
    imageGeneration: false,
    imageEditing: false,
    videoGeneration: false,
    multilingual: false,
    ...partial,
  };
}

function cost(
  prompt: number,
  completion: number,
  base = 0
): CostProfile {
  return {
    promptTokenCostCentsPer1k: prompt,
    completionTokenCostCentsPer1k: completion,
    baseRequestCostCents: base,
    currency: 'USD',
  };
}

function latency(ttft: number, inter: number, p95: number): LatencyProfile {
  return {
    ttftMs: ttft,
    interTokenLatencyMs: inter,
    p95TotalMs: p95,
    measuredAt: new Date().toISOString(),
  };
}

export const MODEL_ROSTER: readonly ModelDefinition[] = [
  {
    id: 'anthropic/claude-opus-4',
    displayName: 'Claude Opus 4',
    provider: 'anthropic',
    tier: 'reasoning',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(150, 600, 25),
    latency: latency(800, 18, 12000),
    contextWindow: 200_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    maxOutputTokens: 4096,
    safetyClass: 'high_stakes',
    enabled: true,
  },
  {
    id: 'anthropic/claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    provider: 'anthropic',
    tier: 'balanced',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(30, 150, 10),
    latency: latency(400, 12, 6000),
    contextWindow: 200_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    maxOutputTokens: 4096,
    safetyClass: 'sensitive',
    enabled: true,
  },
  {
    id: 'anthropic/claude-haiku-4',
    displayName: 'Claude Haiku 4',
    provider: 'anthropic',
    tier: 'small',
    capabilities: caps({ reasoning: false, coding: true, analysis: true, creativeWriting: true, longContext: false, multilingual: true }),
    cost: cost(8, 40, 5),
    latency: latency(180, 6, 2500),
    contextWindow: 200_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'openai/gpt-5',
    displayName: 'GPT-5',
    provider: 'openai',
    tier: 'reasoning',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(250, 1000, 30),
    latency: latency(1200, 22, 18000),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    maxOutputTokens: 4096,
    safetyClass: 'high_stakes',
    enabled: true,
  },
  {
    id: 'openai/gpt-5-mini',
    displayName: 'GPT-5 Mini',
    provider: 'openai',
    tier: 'small',
    capabilities: caps({ reasoning: false, coding: true, analysis: true, creativeWriting: true, longContext: false, multilingual: true }),
    cost: cost(15, 60, 5),
    latency: latency(220, 7, 3000),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'openai/o1-pro',
    displayName: 'O1 Pro',
    provider: 'openai',
    tier: 'reasoning',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: false, longContext: true, multilingual: true }),
    cost: cost(750, 3000, 50),
    latency: latency(3000, 35, 45000),
    contextWindow: 200_000,
    supportsStreaming: false,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'high_stakes',
    enabled: true,
  },
  {
    id: 'google/gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'google',
    tier: 'long_context',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(35, 140, 10),
    latency: latency(500, 14, 8000),
    contextWindow: 1_000_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    maxOutputTokens: 8192,
    safetyClass: 'sensitive',
    enabled: true,
  },
  {
    id: 'google/gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'google',
    tier: 'cheap_bulk',
    capabilities: caps({ reasoning: false, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(8, 32, 3),
    latency: latency(280, 8, 3500),
    contextWindow: 1_000_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    maxOutputTokens: 8192,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'deepseek/deepseek-v3',
    displayName: 'DeepSeek-V3',
    provider: 'deepseek',
    tier: 'balanced',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(7, 28, 2),
    latency: latency(350, 10, 5000),
    contextWindow: 64_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'meta/llama-4-scout',
    displayName: 'Llama 4 Scout',
    provider: 'meta',
    tier: 'small',
    capabilities: caps({ reasoning: false, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(5, 20, 2),
    latency: latency(250, 8, 3500),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'meta/llama-4-maverick',
    displayName: 'Llama 4 Maverick',
    provider: 'meta',
    tier: 'balanced',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(12, 48, 4),
    latency: latency(380, 11, 5500),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    maxOutputTokens: 4096,
    safetyClass: 'sensitive',
    enabled: true,
  },
  {
    id: 'cohere/command-r-plus',
    displayName: 'Command R+',
    provider: 'cohere',
    tier: 'long_context',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(15, 60, 5),
    latency: latency(420, 10, 6000),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'mistral/mistral-large-2',
    displayName: 'Mistral Large 2',
    provider: 'mistral',
    tier: 'balanced',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(20, 80, 8),
    latency: latency(450, 12, 7000),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'sensitive',
    enabled: true,
  },
  {
    id: 'xai/grok-3',
    displayName: 'Grok 3',
    provider: 'xai',
    tier: 'balanced',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: false, multilingual: true }),
    cost: cost(60, 240, 12),
    latency: latency(380, 10, 5500),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'sensitive',
    enabled: true,
  },
  {
    id: 'stability/sd3.5-large',
    displayName: 'Stable Diffusion 3.5 Large',
    provider: 'stability',
    tier: 'image_specialist',
    capabilities: caps({ reasoning: false, coding: false, analysis: false, creativeWriting: false, imageGeneration: true, longContext: false, multilingual: false }),
    cost: cost(200, 0, 100),
    latency: latency(2500, 0, 15000),
    contextWindow: 0,
    supportsStreaming: false,
    supportsTools: false,
    supportsVision: true,
    maxOutputTokens: 0,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'stability/sd3.5-medium',
    displayName: 'Stable Diffusion 3.5 Medium',
    provider: 'stability',
    tier: 'image_specialist',
    capabilities: caps({ reasoning: false, coding: false, analysis: false, creativeWriting: false, imageGeneration: true, longContext: false, multilingual: false }),
    cost: cost(100, 0, 50),
    latency: latency(1500, 0, 8000),
    contextWindow: 0,
    supportsStreaming: false,
    supportsTools: false,
    supportsVision: true,
    maxOutputTokens: 0,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'amazon/nova-pro',
    displayName: 'Nova Pro',
    provider: 'amazon',
    tier: 'balanced',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(25, 100, 8),
    latency: latency(350, 9, 5000),
    contextWindow: 300_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: true,
    maxOutputTokens: 4096,
    safetyClass: 'sensitive',
    enabled: true,
  },
  {
    id: 'nvidia/nemotron-4-340b',
    displayName: 'Nemotron-4 340B',
    provider: 'nvidia',
    tier: 'cheap_bulk',
    capabilities: caps({ reasoning: true, coding: true, analysis: true, creativeWriting: false, longContext: true, multilingual: true }),
    cost: cost(4, 16, 1),
    latency: latency(500, 12, 7000),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'default',
    enabled: true,
  },
  {
    id: 'perplexity/sonar-deep-research',
    displayName: 'Sonar Deep Research',
    provider: 'perplexity',
    tier: 'reasoning',
    capabilities: caps({ reasoning: true, coding: false, analysis: true, creativeWriting: true, longContext: true, multilingual: true }),
    cost: cost(50, 200, 15),
    latency: latency(1200, 18, 15000),
    contextWindow: 128_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsVision: false,
    maxOutputTokens: 4096,
    safetyClass: 'sensitive',
    enabled: true,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Tier → task kind affinity matrix
// ─────────────────────────────────────────────────────────────────────────────

const TASK_TIER_OVERRIDES: Partial<Record<TaskKind, ModelTier>> = {
  code_author: 'code_specialist',
  code_review: 'code_specialist',
  image_gen: 'image_specialist',
  image_edit: 'image_specialist',
  video_gen: 'video_specialist',
  data_analyze: 'reasoning',
  synthesize: 'reasoning',
  verify: 'reasoning',
  summarize: 'small',
};

/** Resolve the preferred tier for a task kind. */
export function resolveTier(kind: TaskKind, hint?: ModelTier | null): ModelTier {
  if (hint) return hint;
  return TASK_TIER_OVERRIDES[kind] ?? 'balanced';
}

// ─────────────────────────────────────────────────────────────────────────────
// Model selection
// ─────────────────────────────────────────────────────────────────────────────

export interface RouterOptions {
  /** Task kind being routed. */
  kind: TaskKind;
  /** Preferred tier hint (optional). */
  tierHint?: ModelTier | null;
  /** Required safety class. */
  safetyClass?: SafetyClass;
  /** Whether the task requires tool calling. */
  requiresTools?: boolean;
  /** Whether the task requires streaming. */
  requiresStreaming?: boolean;
  /** Whether the task requires vision. */
  requiresVision?: boolean;
  /** Model IDs to exclude (e.g. already failed). */
  excludeIds?: readonly string[];
  /** Random seed for deterministic selection in tests. */
  seed?: number;
}

/** Score and rank models for a given request. */
export function rankModels(opts: RouterOptions): ModelDefinition[] {
  const tier = resolveTier(opts.kind, opts.tierHint);
  const exclude = new Set(opts.excludeIds ?? []);

  let candidates = MODEL_ROSTER.filter((m) => {
    if (!m.enabled) return false;
    if (exclude.has(m.id)) return false;
    if (opts.safetyClass && safetyRank(m.safetyClass) < safetyRank(opts.safetyClass)) return false;
    if (opts.requiresTools && !m.supportsTools) return false;
    if (opts.requiresStreaming && !m.supportsStreaming) return false;
    if (opts.requiresVision && !m.supportsVision) return false;
    return true;
  });

  // Tier match scoring
  const tierScores: Record<ModelTier, number> = {
    orchestrator: 10,
    reasoning: 9,
    code_specialist: 9,
    image_specialist: 9,
    video_specialist: 9,
    medical_specialist: 9,
    long_context: 7,
    balanced: 5,
    small: 3,
    cheap_bulk: 2,
  };

  candidates = candidates
    .map((m) => ({
      model: m,
      score:
        (tierScores[m.tier] ?? 0) +
        (m.tier === tier ? 20 : 0) +
        (m.tier === 'balanced' ? 3 : 0) -
        m.cost.completionTokenCostCentsPer1k / 1000, // slight cost penalty
    }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.model);

  return candidates;
}

/** Select the best model for a task. */
export function selectModel(opts: RouterOptions): ModelDefinition {
  const ranked = rankModels(opts);
  if (ranked.length === 0) {
    throw new Error(`No eligible model for kind=${opts.kind} tier=${resolveTier(opts.kind, opts.tierHint)}`);
  }
  // Deterministic fallback to top candidate
  return ranked[0];
}

/** Get a model by ID. */
export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_ROSTER.find((m) => m.id === id);
}

/** List all models in the roster. */
export function listModels(): readonly ModelDefinition[] {
  return MODEL_ROSTER;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost calculation
// ─────────────────────────────────────────────────────────────────────────────

export interface CostEstimate {
  readonly modelId: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly estimatedCostCents: number;
}

/** Estimate cost for a model invocation given token counts. */
export function estimateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): CostEstimate {
  const model = getModelById(modelId);
  if (!model) {
    return {
      modelId,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCostCents: 0,
    };
  }
  const c = model.cost;
  const costCents =
    c.baseRequestCostCents +
    (promptTokens / 1000) * c.promptTokenCostCentsPer1k +
    (completionTokens / 1000) * c.completionTokenCostCentsPer1k;

  return {
    modelId,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCostCents: Math.round(costCents * 100) / 100,
  };
}

/** Estimate cost from a TokenBudget result. */
export function estimateCostFromBudget(modelId: string, budget: TokenBudget): CostEstimate {
  return estimateCost(modelId, budget.promptTokens, budget.completionTokens);
}

// ─────────────────────────────────────────────────────────────────────────────
// Latency simulation
// ─────────────────────────────────────────────────────────────────────────────

export interface LatencyEstimate {
  readonly ttftMs: number;
  readonly totalMs: number;
  readonly interTokenLatencyMs: number;
}

/** Simulate latency for a model invocation. */
export function simulateLatency(
  modelId: string,
  completionTokens: number,
  speedMultiplier = 1.0
): LatencyEstimate {
  const model = getModelById(modelId);
  if (!model) {
    return { ttftMs: 500 * speedMultiplier, totalMs: 2000 * speedMultiplier, interTokenLatencyMs: 10 };
  }
  const jitter = () => 0.85 + Math.random() * 0.3; // ±15% jitter
  const ttft = Math.round(model.latency.ttftMs * jitter() * speedMultiplier);
  const inter = Math.round(model.latency.interTokenLatencyMs * jitter() * speedMultiplier);
  const total = Math.round(ttft + completionTokens * inter * speedMultiplier);
  return { ttftMs: ttft, totalMs: total, interTokenLatencyMs: inter };
}

// ─────────────────────────────────────────────────────────────────────────────
// Safety ranking helper
// ─────────────────────────────────────────────────────────────────────────────

function safetyRank(s: SafetyClass): number {
  switch (s) {
    case 'high_stakes':
      return 3;
    case 'sensitive':
      return 2;
    case 'default':
      return 1;
    default:
      return 0;
  }
}
