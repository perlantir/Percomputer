/**
 * Help FAQ data — shared between help UI and JSON-LD structured data.
 */

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is the Multi-Model Agent Platform?",
    answer:
      "A Perplexity Computer clone — a multi-model, multi-agent orchestration platform for building, running, and scaling autonomous AI workflows. It lets you compose complex tasks using multiple AI models and agents working together.",
    category: "general",
  },
  {
    question: "How do I create my first workflow?",
    answer:
      "Go to the Home page and type your objective in the input field. The platform will automatically break it down into tasks, route each to the best model, and execute them in the correct order. You can also browse templates on the Discover page for inspiration.",
    category: "workflows",
  },
  {
    question: "Which AI models are supported?",
    answer:
      "The platform supports all major LLM providers including OpenAI (GPT-4o, o1), Anthropic (Claude 3.5 Sonnet, Claude 3 Opus), Google (Gemini), Mistral, and open-source models via Ollama and vLLM. You can configure models in Settings > Models.",
    category: "models",
  },
  {
    question: "How does model routing work?",
    answer:
      "The orchestrator analyzes each task and routes it to the most appropriate model based on the task type, complexity, your configured preferences, and real-time availability. You can override routing per workflow in the workflow settings.",
    category: "models",
  },
  {
    question: "What are Spaces?",
    answer:
      "Spaces are isolated project environments for organizing workflows, artifacts, and memory. Each space has its own knowledge base, team access controls, and settings. Create a new space from the sidebar or via the command palette.",
    category: "workflows",
  },
  {
    question: "How is pricing calculated?",
    answer:
      "Usage is measured in credits based on the models and tokens consumed during workflow execution. You can monitor your usage and set budget alerts in Settings > Billing. Each model has a different credit cost per 1K tokens.",
    category: "billing",
  },
  {
    question: "Can I export my workflow results?",
    answer:
      "Yes! Each workflow produces shareable artifacts. You can export results as Markdown, JSON, or PDF. You can also generate a shareable link or embed code for external use. Look for the export options in the workflow detail view.",
    category: "workflows",
  },
  {
    question: "What is Zero Data Retention (ZDR)?",
    answer:
      "ZDR is a privacy feature that requests model providers to delete your data immediately after processing. It's available for supported enterprise tiers (OpenAI and Anthropic). Enable it in Settings > Privacy.",
    category: "privacy",
  },
  {
    question: "How does memory work?",
    answer:
      "The platform has two memory systems: Episodic Memory stores workflow summaries for context retrieval, and Semantic Memory extracts and stores factual knowledge. You can configure memory settings, including auto-decay, in Settings > Memory.",
    category: "features",
  },
  {
    question: "How do I invite team members?",
    answer:
      "Go to Settings > Team and click 'Invite Member'. Enter their email address and select a role (Owner, Admin, or Member). They'll receive an invitation email with a link to join your organization.",
    category: "team",
  },
  {
    question: "What keyboard shortcuts are available?",
    answer:
      "Press Cmd+K (Mac) or Ctrl+K (Windows) to open the command palette. Press ? to view all keyboard shortcuts. Common shortcuts include: N for new workflow, G+H for Home, G+L for Library, G+S for Settings.",
    category: "shortcuts",
  },
  {
    question: "How do I set up API keys?",
    answer:
      "Navigate to Settings > API Keys to generate and manage API keys for programmatic access. Each key can have scoped permissions. You can also configure model provider API keys in Settings > Models.",
    category: "api",
  },
];
