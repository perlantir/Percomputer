/**
 * GET /api/models — Available models with their capabilities
 */
import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, jsonResponse, corsPreflight } from "@/src/lib/api-utils";
const mockModels = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    tier: "premium",
    context_window: 128_000,
    capabilities: ["text", "vision", "json_mode", "function_calling"],
    cost_per_1k_tokens: { input: 0.005, output: 0.015 },
    description: "OpenAI's flagship multimodal model with excellent reasoning and vision capabilities.",
    latency_tier: "standard",
    max_output_tokens: 4096,
    supported_languages: ["en", "es", "fr", "de", "zh", "ja"],
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    tier: "premium",
    context_window: 200_000,
    capabilities: ["text", "vision", "json_mode", "function_calling", "code"],
    cost_per_1k_tokens: { input: 0.003, output: 0.015 },
    description: "Anthropic's most capable model with exceptional coding and reasoning abilities.",
    latency_tier: "fast",
    max_output_tokens: 8192,
    supported_languages: ["en", "es", "fr", "de", "zh", "ja", "ko"],
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    tier: "standard",
    context_window: 128_000,
    capabilities: ["text", "json_mode", "function_calling"],
    cost_per_1k_tokens: { input: 0.00015, output: 0.0006 },
    description: "Cost-efficient model for simpler tasks and high-volume operations.",
    latency_tier: "fast",
    max_output_tokens: 4096,
    supported_languages: ["en", "es", "fr", "de", "zh", "ja"],
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    provider: "deepseek",
    tier: "standard",
    context_window: 64_000,
    capabilities: ["text", "code", "json_mode"],
    cost_per_1k_tokens: { input: 0.00027, output: 0.0011 },
    description: "High-performance open-weight model with strong coding capabilities.",
    latency_tier: "standard",
    max_output_tokens: 8192,
    supported_languages: ["en", "zh"],
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    tier: "premium",
    context_window: 1_000_000,
    capabilities: ["text", "vision", "json_mode", "function_calling"],
    cost_per_1k_tokens: { input: 0.0035, output: 0.0105 },
    description: "Google's multimodal model with industry-leading context window.",
    latency_tier: "standard",
    max_output_tokens: 8192,
    supported_languages: ["en", "es", "fr", "de", "zh", "ja", "ko", "ar"],
  },
];

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest) => {
    const url = new URL(req.url);
    const tier = url.searchParams.get("tier");
    const capability = url.searchParams.get("capability");

    let models = [...mockModels];

    if (tier) {
      models = models.filter((m) => m.tier === tier);
    }
    if (capability) {
      models = models.filter((m) => m.capabilities.includes(capability as any));
    }

    return jsonResponse({ data: models, total: models.length });
  }) as any
);

export function OPTIONS() {
  return corsPreflight();
}
