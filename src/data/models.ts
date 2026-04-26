/**
 * Demo / seed data for the application.
 */

export const demoModels = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", maxTokens: 128000 },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", maxTokens: 128000 },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", maxTokens: 200000 },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic", maxTokens: 200000 },
  { id: "command-r-plus", name: "Command R+", provider: "cohere", maxTokens: 128000 },
  { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "google", maxTokens: 2000000 },
  { id: "mistral-large", name: "Mistral Large", provider: "mistral", maxTokens: 128000 },
  { id: "llama-3-1-70b", name: "Llama 3.1 70B", provider: "groq", maxTokens: 128000 },
] as const;

export const demoTools = [
  { id: "web_search", name: "Web Search", description: "Search the web for real-time information." },
  { id: "calculator", name: "Calculator", description: "Perform mathematical calculations." },
  { id: "code_executor", name: "Code Executor", description: "Run Python code in a sandboxed environment." },
  { id: "image_generator", name: "Image Generator", description: "Generate images from text descriptions." },
  { id: "citation_lookup", name: "Citation Lookup", description: "Find and verify academic citations." },
  { id: "linter", name: "Linter", description: "Run code linting checks." },
  { id: "security_scanner", name: "Security Scanner", description: "Scan code for security vulnerabilities." },
  { id: "tone_analyzer", name: "Tone Analyzer", description: "Analyze the emotional tone of text." },
] as const;
