# Multi-Model Agent Platform

A next-generation AI orchestration platform that enables seamless collaboration between multiple language models, specialized agents, and human operators. Built with Next.js 15, React 19, and modern web technologies.

## Description

The Multi-Model Agent Platform is a production-ready application for orchestrating AI workflows across multiple models (GPT-4, Claude, Gemini, Llama, and more). It provides a unified chat interface, visual workflow builder, real-time console monitoring, and extensible agent marketplace — all designed for teams building sophisticated AI-powered applications.

Whether you're building a customer support assistant, a research copilot, or a multi-step reasoning pipeline, this platform gives you the tools to compose, deploy, and monitor AI agents at scale.

## Features

### Core Platform
1. **Multi-Model Chat Interface** — Unified conversation UI supporting GPT-4, Claude 3.5, Gemini 1.5, Llama 3, and custom models with seamless context switching
2. **Visual Workflow Builder** — Drag-and-drop canvas for composing multi-step agent pipelines with conditional branching and parallel execution
3. **Real-Time Console** — Live execution monitoring with streaming logs, token usage tracking, latency metrics, and cost analysis
4. **Agent Marketplace** — Discover, install, and configure pre-built agents for common tasks (research, coding, analysis, creative writing)
5. **Custom Agent Studio** — Build bespoke agents with system prompts, tool configurations, memory settings, and model routing rules
6. **Conversation History** — Persistent thread management with search, filtering, tagging, and export capabilities
7. **Multi-User Collaboration** — Real-time presence, shared workspaces, and team-based conversation threads
8. **Organization Management** — Multi-tenant support with role-based access control (RBAC) and workspace isolation

### AI & Model Orchestration
9. **Model Router** — Intelligent request routing based on cost, latency, quality scores, and user preferences with automatic fallback chains
10. **Context Window Management** — Automatic token budgeting, message summarization, and context compression for long conversations
11. **Tool Calling Framework** — Extensible tool system with built-in integrations (web search, code execution, file operations, API calls)
12. **Function Registry** — Self-documenting function catalog with JSON Schema validation and auto-generated UI forms
13. **Response Streaming** — Server-Sent Events (SSE) for real-time token-by-token streaming across all supported models
14. **Parallel Model Execution** — Run multiple models simultaneously and compare outputs side-by-side
15. **Structured Output Parsing** — JSON Schema validation, type-safe response parsing, and automatic retry on malformed outputs
16. **Prompt Versioning** — Track, diff, and rollback prompt changes with A/B testing support
17. **Prompt Templates** — Reusable prompt fragments with variable substitution, conditionals, and loops

### Developer Experience
18. **TypeScript-First** — 100% TypeScript coverage with strict mode, generated types from Prisma schema, and shared type packages
19. **Hot Module Replacement** — Instant feedback during development with Next.js fast refresh
20. **API Playground** — Interactive documentation and testing environment for all REST and WebSocket endpoints
21. **Mock Data Layer** — Comprehensive mock data system for offline development, testing, and storybook demos
22. **Error Boundary System** — Graceful error handling with retry logic, fallback UIs, and detailed error reporting
23. **Loading State Architecture** — Skeleton screens, optimistic updates, and progressive loading patterns throughout
24. **Dark & Light Themes** — Full theme support with CSS variable-based design tokens and system preference detection

### Performance & Reliability
25. **Edge-Ready Architecture** — Optimized for Vercel Edge Runtime with streaming and regional caching
26. **Request Deduplication** — Automatic request deduplication and caching via TanStack Query
27. **Virtualized Lists** — Efficient rendering of large conversation histories and log streams
28. **Image Asset Pipeline** — Automatic image optimization, lazy loading, and responsive srcset generation
29. **Bundle Analysis** — Tree-shakeable modules and automated bundle size monitoring
30. **Accessibility Compliance** — WCAG 2.1 AA compliant with keyboard navigation, ARIA labels, and screen reader support

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework with App Router |
| React | 19.x | UI library with Server Components |
| TypeScript | 5.7+ | Type safety and developer experience |
| Tailwind CSS | 3.4+ | Utility-first styling |
| shadcn/ui | latest | Accessible component primitives |
| Zustand | 4.5+ | Client-side state management |
| TanStack Query | 5.x | Server state, caching, synchronization |
| Framer Motion | 11.x | Animations and transitions |
| React Flow | 12.x | Visual workflow builder canvas |
| Recharts | 2.x | Data visualization and charts |
| Lucide React | latest | Icon library |

### Backend & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 15.x | Serverless API endpoints |
| Prisma | 5.x | Database ORM and schema management |
| PostgreSQL | 15+ | Primary relational database |
| Redis | 7+ | Caching, sessions, rate limiting |
| Zod | 3.x | Runtime schema validation |

### AI & Integration
| Technology | Purpose |
|------------|---------|
| OpenAI SDK | GPT-4, GPT-4o, GPT-3.5 |
| Anthropic SDK | Claude 3.5 Sonnet, Claude 3 Opus |
| Google AI SDK | Gemini 1.5 Pro, Gemini 1.5 Flash |
| Ollama | Local Llama 3, Mistral, CodeLlama |
| Vercel AI SDK | Streaming, tool calling, unified interface |

### DevOps & Tooling
| Technology | Purpose |
|------------|---------|
| pnpm | Package manager |
| ESLint + Prettier | Code quality and formatting |
| Husky + lint-staged | Git hooks |
| GitHub Actions | CI/CD pipeline |
| Docker | Containerization |
| Playwright | E2E testing |
| Vitest | Unit testing |

## Getting Started

### Prerequisites

- **Node.js** 20.x or later
- **pnpm** 8.x or later (recommended) or npm 10+
- **PostgreSQL** 15+ (local or cloud)
- **Redis** 7+ (local or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/multi-model-agent-platform.git
cd multi-model-agent-platform

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Configure your .env.local with API keys and database URLs
# See Environment Variables section below

# Initialize the database
pnpm db:push

# Seed mock data for development
pnpm db:seed

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm dev:turbo` | Start with Turbo mode for faster builds |
| `pnpm build` | Production build with type checking |
| `pnpm start` | Start production server (after build) |
| `pnpm lint` | Run ESLint across all files |
| `pnpm lint:fix` | Auto-fix ESLint violations |
| `pnpm format` | Format all files with Prettier |
| `pnpm typecheck` | Run TypeScript compiler without emit |
| `pnpm test` | Run all unit tests with Vitest |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm test:coverage` | Run tests with coverage report |

### Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:push` | Push Prisma schema to database (dev) |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed database with mock data |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm db:generate` | Generate Prisma Client types |
| `pnpm db:format` | Format Prisma schema file |

## Project Structure

```
multi-model-agent-platform/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Marketing pages (landing, pricing)
│   ├── (dashboard)/              # Authenticated dashboard routes
│   │   ├── chat/                 # Chat interface
│   │   ├── workflows/            # Workflow builder
│   │   ├── console/              # Execution console
│   │   ├── agents/               # Agent marketplace & studio
│   │   ├── settings/             # User & org settings
│   │   └── layout.tsx            # Dashboard shell with sidebar
│   ├── api/                      # API route handlers
│   │   ├── chat/                 # Chat streaming endpoints
│   │   ├── workflows/            # Workflow CRUD & execution
│   │   ├── agents/               # Agent management
│   │   ├── models/               # Model configuration
│   │   └── sse/                  # Server-Sent Events streams
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles & CSS variables
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # Shell, sidebar, navigation
│   ├── chat/                     # Chat-specific components
│   ├── workflow/                 # Workflow builder components
│   ├── console/                  # Console monitoring components
│   ├── agents/                   # Agent marketplace components
│   └── shared/                   # Cross-cutting components
├── lib/                          # Utility functions & configurations
│   ├── prisma.ts                 # Prisma client singleton
│   ├── zustand/                  # Store definitions
│   ├── tanstack-query/           # Query client & hooks
│   ├── ai-sdk/                   # AI SDK configuration
│   ├── models/                   # Model provider configs
│   └── utils/                    # Helper functions
├── hooks/                        # Custom React hooks
│   ├── use-chat.ts               # Chat streaming hook
│   ├── use-workflow.ts           # Workflow execution hook
│   ├── use-sse.ts                # SSE connection hook
│   └── use-agent.ts              # Agent configuration hook
├── types/                        # Shared TypeScript types
│   ├── index.ts                  # Core type exports
│   ├── api.ts                    # API request/response types
│   └── models.ts                 # AI model type definitions
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Prisma schema definition
│   └── seed.ts                   # Database seed script
├── public/                       # Static assets
│   ├── images/                   # Image assets
│   └── fonts/                    # Custom font files
├── docs/                         # Project documentation
│   ├── COMPONENTS.md             # Component documentation
│   ├── DESIGN_TOKENS.md          # Design system reference
│   └── SETUP.md                  # Extended setup guide
├── tests/                        # Test suites
│   ├── unit/                     # Vitest unit tests
│   ├── e2e/                      # Playwright E2E tests
│   └── fixtures/                 # Test fixtures & mock data
├── .env.example                  # Environment variables template
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── prisma.config.ts              # Prisma configuration
├── package.json                  # Dependencies & scripts
├── README.md                     # This file
├── ARCHITECTURE.md               # Architecture documentation
├── API.md                        # API documentation
├── CONTRIBUTING.md               # Contribution guidelines
├── DEPLOYMENT.md                 # Deployment guide
├── CHANGELOG.md                  # Version history
└── LICENSE                       # MIT License
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/agent_platform` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXTAUTH_SECRET` | NextAuth.js encryption secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application base URL | `http://localhost:3000` |

### AI Provider API Keys (at least one required)

| Variable | Provider | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | OpenAI | GPT-4, GPT-4o, GPT-3.5 |
| `ANTHROPIC_API_KEY` | Anthropic | Claude 3.5, Claude 3 Opus |
| `GOOGLE_AI_API_KEY` | Google | Gemini 1.5 Pro, Gemini 1.5 Flash |
| `OLLAMA_BASE_URL` | Ollama | Local model endpoint (default: `http://localhost:11434`) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `MAX_FILE_UPLOAD_SIZE` | Max upload size in MB | `10` |
| `ENABLE_ANALYTICS` | Enable usage analytics | `false` |
| `SENTRY_DSN` | Error tracking DSN | — |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | — |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | — |

See `.env.example` for the complete template.

## Architecture Overview

The platform follows a modern, layered architecture designed for scalability, maintainability, and developer experience:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Next.js   │  │   Zustand   │  │   TanStack Query    │ │
│  │  App Router │  │   Stores    │  │   Server State      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     API Gateway Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  API Routes │  │    Zod      │  │   Middleware        │ │
│  │  (Next.js)  │  │ Validation  │  │  Auth / Rate Limit  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Chat      │  │  Workflow   │  │   Agent Engine      │ │
│  │  Service    │  │  Engine     │  │   (Orchestrator)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Data & AI Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Prisma    │  │   Redis     │  │   AI SDK / Models   │ │
│  │  (PostgreSQL)│  │   Cache     │  │   (Multi-provider)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

For a deep dive, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## API Documentation

Complete API documentation including all endpoints, request/response schemas, authentication flows, SSE events, and WebSocket messages is available in [API.md](./API.md).

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) for code style, component patterns, testing approach, and PR process.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions covering Vercel, Docker, and self-hosted options.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

## License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.

## Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/multi-model-agent-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/multi-model-agent-platform/discussions)

---

Built with passion for the AI developer community.
