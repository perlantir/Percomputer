/**
 * Model plane types for the Multi-Model Agent Orchestration Platform.
 *
 * Defines the router, provider adapter, health, and cost abstractions
 * that sit between the orchestrator and external LLM / VLM APIs.
 */

import type { ModelTier, SafetyClass } from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// Model Definition
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical description of a registered model usable by the router. */
export interface ModelDefinition {
  /** Unique provider-scoped identifier (e.g. "openai/gpt-4o"). */
  readonly id: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /** Owning provider slug (e.g. "openai", "anthropic", "google"). */
  readonly provider: string;
  /** Capability tier used for routing heuristics. */
  readonly tier: ModelTier;
  /** Model capabilities bitmask. */
  readonly capabilities: ModelCapabilities;
  /** Cost profile for billing estimation. */
  readonly cost: CostProfile;
  /** Latency profile for SLA prediction. */
  readonly latency: LatencyProfile;
  /** Maximum context window in tokens. */
  readonly contextWindow: number;
  /** Whether the model supports streaming responses. */
  readonly supportsStreaming: boolean;
  /** Whether the model supports function/tool calling. */
  readonly supportsTools: boolean;
  /** Whether the model supports vision (image) inputs. */
  readonly supportsVision: boolean;
  /** Maximum output tokens the model can generate. */
  readonly maxOutputTokens: number;
  /** Safety classification the model is certified for. */
  readonly safetyClass: SafetyClass;
  /** Whether the model is currently enabled for routing. */
  readonly enabled: boolean;
}

/** Capability flags for a model. */
export interface ModelCapabilities {
  readonly reasoning: boolean;
  readonly coding: boolean;
  readonly analysis: boolean;
  readonly creativeWriting: boolean;
  readonly longContext: boolean;
  readonly imageGeneration: boolean;
  readonly imageEditing: boolean;
  readonly videoGeneration: boolean;
  readonly multilingual: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost & Latency Profiles
// ─────────────────────────────────────────────────────────────────────────────

/** Per-token and per-request cost structure. */
export interface CostProfile {
  /** Cost per 1K prompt tokens in USD cents. */
  readonly promptTokenCostCentsPer1k: number;
  /** Cost per 1K completion tokens in USD cents. */
  readonly completionTokenCostCentsPer1k: number;
  /** Fixed base cost per request in USD cents. */
  readonly baseRequestCostCents: number;
  /** Currency code (typically "USD"). */
  readonly currency: string;
}

/** Empirical latency statistics for a model. */
export interface LatencyProfile {
  /** Estimated time to first token (ms). */
  readonly ttftMs: number;
  /** Mean inter-token latency (ms). */
  readonly interTokenLatencyMs: number;
  /** P95 end-to-end latency for a 1K prompt / 500-token completion (ms). */
  readonly p95TotalMs: number;
  /** Timestamp of the last latency measurement. */
  readonly measuredAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Adapter
// ─────────────────────────────────────────────────────────────────────────────

/** Interface implemented by every provider adapter in the model plane. */
export interface ProviderAdapter {
  readonly providerId: string;

  /** Send a chat completion request to the provider. */
  chat(request: RouterRequest): Promise<RouterResponse>;

  /** Stream a chat completion (returns an async iterable of token chunks). */
  chatStream(request: RouterRequest): AsyncIterable<StreamChunk>;

  /** Health check ping. */
  health(): Promise<ProviderHealth>;
}

/** Single token chunk emitted during a streaming response. */
export interface StreamChunk {
  readonly index: number;
  readonly delta: string;
  readonly finishReason: 'stop' | 'length' | 'tool_calls' | null;
  readonly usage: TokenBudget | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Router Request / Response
// ─────────────────────────────────────────────────────────────────────────────

/** Normalised request shape sent to the model router. */
export interface RouterRequest {
  /** Conversation messages. */
  readonly messages: readonly RouterMessage[];
  /** Tools available to the model. */
  readonly tools: readonly RouterTool[];
  /** Whether to force tool use or allow free-form response. */
  readonly toolChoice: 'auto' | 'required' | 'none' | { readonly type: 'function'; readonly name: string };
  /** Maximum tokens to generate. */
  readonly maxTokens: number | null;
  /** Sampling temperature (0–2). */
  readonly temperature: number | null;
  /** Nucleus sampling parameter (0–1). */
  readonly topP: number | null;
  /** Penalty for repeated tokens. */
  readonly frequencyPenalty: number | null;
  /** Penalty for presence of tokens. */
  readonly presencePenalty: number | null;
  /** Whether to stream the response. */
  readonly stream: boolean;
}

/** Normalised message shape in the router abstraction. */
export interface RouterMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string | readonly RouterContentPart[];
  readonly toolCalls?: readonly RouterToolCall[];
  readonly toolCallId?: string;
  readonly name?: string;
}

/** Multimodal content part (text, image, video). */
export interface RouterContentPart {
  readonly type: 'text' | 'image_url' | 'video_url';
  readonly text?: string;
  readonly imageUrl?: { readonly url: string; readonly detail?: 'low' | 'high' | 'auto' };
  readonly videoUrl?: { readonly url: string };
}

/** Normalised tool definition passed to the router. */
export interface RouterTool {
  readonly type: 'function';
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: Record<string, unknown>;
  };
}

/** Normalised tool call emitted by the model. */
export interface RouterToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: {
    readonly name: string;
    readonly arguments: string;
  };
}

/** Normalised response shape returned by the model router. */
export interface RouterResponse {
  readonly modelId: string;
  readonly content: string | null;
  readonly toolCalls: readonly RouterToolCall[];
  readonly finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  readonly usage: TokenBudget;
  readonly latencyMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Budget
// ─────────────────────────────────────────────────────────────────────────────

/** Token consumption snapshot for a single model invocation. */
export interface TokenBudget {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Health
// ─────────────────────────────────────────────────────────────────────────────

/** Health telemetry for a provider endpoint. */
export interface ProviderHealth {
  readonly providerId: string;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  /** Mean error rate over the last 5 minutes (0–1). */
  readonly errorRate5m: number;
  /** Mean latency over the last 5 minutes (ms). */
  readonly meanLatencyMs5m: number;
  /** Remaining rate-limit capacity (null if unknown). */
  readonly remainingCapacity: number | null;
  /** Rate-limit reset timestamp. */
  readonly capacityResetsAt: string | null;
  /** ISO-8601 timestamp of the health check. */
  readonly checkedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Info (UI / Roster)
// ─────────────────────────────────────────────────────────────────────────────

/** Lightweight model descriptor used in UI rosters and selection dropdowns. */
export interface ModelInfo {
  /** Unique model identifier (e.g. "gpt-4o"). */
  readonly id: string;
  /** Human-readable display name. */
  readonly name: string;
  /** Owning provider (e.g. "OpenAI", "Anthropic"). */
  readonly provider: string;
  /** Capability tier for routing heuristics. */
  readonly tier: ModelTier;
  /** Capability tags (e.g. "code", "reasoning", "vision"). */
  readonly capabilities: readonly string[];
  /** Maximum context window in tokens. */
  readonly contextWindow: number;
  /** Cost per 1K prompt tokens in USD. */
  readonly costPer1kInput: number;
  /** Cost per 1K completion tokens in USD. */
  readonly costPer1kOutput: number;
  /** Short marketing description. */
  readonly description: string;
  /** Maximum output tokens. */
  readonly maxTokens: number;
  /** Whether the model supports streaming responses. */
  readonly supportsStreaming: boolean;
}
