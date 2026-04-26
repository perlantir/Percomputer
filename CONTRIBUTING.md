# Contributing Guidelines

Thank you for your interest in contributing to the Multi-Model Agent Platform! This document outlines the standards, patterns, and processes we follow to maintain code quality and consistency.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Code Style](#code-style)
3. [Component Patterns](#component-patterns)
4. [TypeScript Conventions](#typescript-conventions)
5. [Testing Approach](#testing-approach)
6. [Pull Request Process](#pull-request-process)
7. [Commit Message Format](#commit-message-format)

---

## Development Setup

### Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later
- PostgreSQL 15+
- Redis 7+

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/multi-model-agent-platform.git
cd multi-model-agent-platform

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys and database URLs

# Initialize database
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

### Pre-commit Hooks

Husky and lint-staged are configured to run checks before each commit:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

```bash
# Manually run pre-commit checks
pnpm lint:fix
pnpm format
pnpm typecheck
```

---

## Code Style

We use ESLint and Prettier with strict configurations to maintain consistent code style.

### ESLint Configuration

Our ESLint config extends:

- `next/core-web-vitals` — Next.js best practices
- `@typescript-eslint/recommended` — TypeScript rules
- `import/order` — Consistent import ordering

### Import Order

Imports must be ordered as follows:

```tsx
// 1. React / Next.js imports
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

// 3. Absolute imports (from project root)
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/zustand/chat-store";

// 4. Relative imports (same directory)
import { MessageBubble } from "./message-bubble";
import { useMessageActions } from "./hooks";
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ChatInterface`, `MessageBubble` |
| Hooks | camelCase with `use` prefix | `useChatStore`, `useThreads` |
| Utilities | camelCase | `formatDate`, `truncateText` |
| Constants | UPPER_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| Types/Interfaces | PascalCase | `Thread`, `MessageRole` |
| Enums | PascalCase | `UserRole`, `ThreadStatus` |
| Files (components) | kebab-case | `chat-interface.tsx` |
| Files (hooks) | kebab-case with `use` prefix | `use-threads.ts` |
| API routes | kebab-case | `route.ts` in `[thread-id]/` |

### File Organization

```
components/
├── ui/                    # shadcn/ui primitives (auto-generated)
├── chat/
│   ├── chat-interface.tsx
│   ├── message-list.tsx
│   ├── message-bubble/
│   │   ├── index.tsx
│   │   ├── avatar.tsx
│   │   └── actions.tsx
│   └── composer.tsx
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Component Patterns

### Server Component (Default)

Use Server Components for data fetching and static UI:

```tsx
// app/(dashboard)/chat/page.tsx
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage() {
  const threads = await prisma.thread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return <ChatInterface initialThreads={threads} />;
}
```

### Client Component

Add `"use client"` for components requiring interactivity:

```tsx
// components/chat/composer.tsx
"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/zustand/chat-store";

export function Composer() {
  const [text, setText] = useState("");
  const sendMessage = useChatStore((s) => s.sendMessage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Compound Component Pattern

For complex components with multiple related sub-components:

```tsx
// components/workflow/workflow-builder.tsx
import { createContext, useContext } from "react";

interface WorkflowBuilderContextType {
  nodes: Node[];
  edges: Edge[];
  addNode: (node: Node) => void;
}

const WorkflowBuilderContext = createContext<WorkflowBuilderContextType | null>(null);

export function WorkflowBuilder({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  return (
    <WorkflowBuilderContext.Provider value={{ nodes, edges, addNode }}>
      <div className="h-full w-full">{children}</div>
    </WorkflowBuilderContext.Provider>
  );
}

export function NodePalette() {
  const { addNode } = useWorkflowBuilderContext();
  return <div>{/* Palette UI */}</div>;
}

export function Canvas() {
  const { nodes, edges } = useWorkflowBuilderContext();
  return <div>{/* Canvas UI */}</div>;
}

function useWorkflowBuilderContext() {
  const context = useContext(WorkflowBuilderContext);
  if (!context) {
    throw new Error("Must be used within WorkflowBuilder");
  }
  return context;
}
```

### Render Props Pattern

For customizable list rendering:

```tsx
// components/shared/data-list.tsx
interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export function DataList<T>({ data, renderItem, emptyState }: DataListProps<T>) {
  if (data.length === 0) {
    return <>{emptyState ?? <div>No items</div>}</>;
  }

  return (
    <ul>
      {data.map((item, index) => (
        <li key={index}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}
```

### Custom Hook Pattern

Extract reusable logic into custom hooks:

```tsx
// hooks/use-streaming-message.ts
"use client";

import { useState, useCallback } from "react";

interface UseStreamingMessageReturn {
  content: string;
  isStreaming: boolean;
  error: Error | null;
  startStream: (threadId: string, content: string) => void;
  stopStream: () => void;
}

export function useStreamingMessage(): UseStreamingMessageReturn {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startStream = useCallback((threadId: string, content: string) => {
    setContent("");
    setIsStreaming(true);
    setError(null);

    const eventSource = new EventSource(
      `/api/chat/${threadId}/stream?content=${encodeURIComponent(content)}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "token") {
        setContent((prev) => prev + data.text);
      }
    };

    eventSource.onerror = () => {
      setError(new Error("Stream error"));
      setIsStreaming(false);
      eventSource.close();
    };

    eventSource.addEventListener("done", () => {
      setIsStreaming(false);
      eventSource.close();
    });
  }, []);

  const stopStream = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return { content, isStreaming, error, startStream, stopStream };
}
```

### Error Boundary Pattern

```tsx
// components/shared/error-boundary.tsx
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // Report to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 text-red-600">
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

---

## TypeScript Conventions

### Strict Mode

The project uses TypeScript strict mode. All code must pass type checking with no errors.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Exports

Export types from a central types directory:

```typescript
// types/index.ts
// Re-export Prisma types
export type {
  User,
  Thread,
  Message,
  Workflow,
  Agent,
} from "@prisma/client";

// Define additional types
export interface CreateThreadInput {
  title: string;
  modelId: string;
  systemPrompt?: string;
}

export interface ThreadWithMessages extends Thread {
  messages: Message[];
}

// Enum types (mirror Prisma enums for API contracts)
export enum ApiMessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  TOOL = "tool",
}
```

### Zod Schema Validation

All API inputs and outputs must be validated with Zod:

```typescript
// lib/schemas/chat-schema.ts
import { z } from "zod";

export const CreateThreadSchema = z.object({
  title: z.string().min(1).max(200, "Title must be 200 characters or less"),
  modelId: z.string().min(1, "Model ID is required"),
  systemPrompt: z.string().max(4000).optional(),
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(100000, "Message too long"),
  modelId: z.string().optional(),
  tools: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
```

### API Route Types

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CreateThreadSchema } from "@/lib/schemas/chat-schema";
import { createThread } from "@/lib/services/chat-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateThreadSchema.parse(body);

    const thread = await createThread(validated);

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: error.errors } },
        { status: 400 }
      );
    }

    console.error("Failed to create thread:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create thread" } },
      { status: 500 }
    );
  }
}
```

### Generic Type Patterns

```typescript
// lib/utils/pagination.ts
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## Testing Approach

### Test File Organization

```
tests/
├── unit/
│   ├── components/
│   │   ├── chat-interface.test.tsx
│   │   └── message-bubble.test.tsx
│   ├── hooks/
│   │   └── use-streaming-message.test.ts
│   ├── lib/
│   │   ├── utils.test.ts
│   │   └── services/
│   │       └── chat-service.test.ts
│   └── schemas/
│       └── chat-schema.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── chat.spec.ts
│   └── workflow.spec.ts
└── fixtures/
    ├── threads.ts
    ├── messages.ts
    └── workflows.ts
```

### Unit Tests with Vitest

```tsx
// tests/unit/components/message-bubble.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/chat/message-bubble";

describe("MessageBubble", () => {
  it("renders user message correctly", () => {
    const message = {
      id: "msg_1",
      role: "USER" as const,
      content: "Hello, world!",
      createdAt: new Date(),
    };

    render(<MessageBubble message={message} />);

    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("renders assistant message with model badge", () => {
    const message = {
      id: "msg_2",
      role: "ASSISTANT" as const,
      content: "Hi there!",
      modelId: "gpt-4",
      createdAt: new Date(),
    };

    render(<MessageBubble message={message} />);

    expect(screen.getByText("Hi there!")).toBeInTheDocument();
    expect(screen.getByText("GPT-4")).toBeInTheDocument();
  });
});
```

### Hook Tests

```tsx
// tests/unit/hooks/use-streaming-message.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStreamingMessage } from "@/hooks/use-streaming-message";

describe("useStreamingMessage", () => {
  it("initializes with correct state", () => {
    const { result } = renderHook(() => useStreamingMessage());

    expect(result.current.content).toBe("");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("starts streaming on startStream call", async () => {
    const { result } = renderHook(() => useStreamingMessage());

    act(() => {
      result.current.startStream("thread_1", "Hello");
    });

    expect(result.current.isStreaming).toBe(true);
  });
});
```

### E2E Tests with Playwright

```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Chat", () => {
  test.beforeEach(async ({ page }) => {
    // Login via API
    await page.request.post("/api/auth/callback/credentials", {
      data: { email: "test@example.com", password: "password" },
    });
  });

  test("user can send a message", async ({ page }) => {
    await page.goto("/chat");

    await page.fill('[data-testid="composer-input"]', "Hello, AI!");
    await page.click('[data-testid="send-button"]');

    await expect(page.locator('[data-testid="message-user"]')).toContainText(
      "Hello, AI!"
    );
  });

  test("streaming response appears", async ({ page }) => {
    await page.goto("/chat");

    await page.fill('[data-testid="composer-input"]', "Count to 3");
    await page.click('[data-testid="send-button"]');

    // Wait for streaming indicator
    await expect(
      page.locator('[data-testid="streaming-indicator"]')
    ).toBeVisible();

    // Wait for completion
    await expect(
      page.locator('[data-testid="streaming-indicator"]')
    ).toBeHidden({ timeout: 30000 });
  });
});
```

### Running Tests

```bash
# Unit tests
pnpm test

# Unit tests with watch mode
pnpm test:watch

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E tests in headed mode (for debugging)
pnpm test:e2e:headed

# Specific E2E test file
pnpm test:e2e chat.spec.ts
```

### Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Components | 80% |
| Hooks | 85% |
| Utils | 90% |
| Services | 75% |
| Schemas | 95% |
| E2E Critical Paths | 100% |

---

## Pull Request Process

### Branch Naming

```
feature/add-model-comparison
fix/streaming-reconnect
refactor/chat-store-performance
docs/api-authentication
chore/update-dependencies
```

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation
- [ ] Refactoring
- [ ] Performance improvement

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] TypeScript strict mode passes
- [ ] E2E tests pass (if applicable)

## Screenshots (if UI change)

## Related Issues
Closes #123
```

### Review Criteria

1. **Code Quality**: Clean, readable, well-documented
2. **Type Safety**: No `any` types, proper generics
3. **Tests**: Adequate coverage for new code
4. **Performance**: No unnecessary re-renders, efficient algorithms
5. **Accessibility**: ARIA labels, keyboard navigation
6. **Security**: Input validation, no secrets exposed

### Merge Requirements

- All CI checks must pass
- At least one approving review
- No unresolved conversations
- Branch must be up-to-date with main

---

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit history.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, semicolons) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `ci` | CI/CD configuration |
| `revert` | Reverting a previous commit |

### Examples

```
feat(chat): add message search functionality

Implement full-text search across conversation history
using PostgreSQL tsvector indexing.

Closes #234
```

```
fix(streaming): reconnect on SSE connection drop

Add exponential backoff reconnection logic for SSE
streams that fail due to network interruptions.

Fixes #456
```

```
refactor(workflow): extract node execution engine

Split monolithic workflow service into separate
node executor, edge router, and state machine.

BREAKING CHANGE: Workflow API response shape changed
```

```
docs(api): add authentication examples

Update API.md with complete OAuth and API key
authentication flows with curl examples.
```

```
chore(deps): update next.js to 15.1

Update Next.js and related dependencies. Includes
migration guide changes for App Router updates.
```

### Commit Best Practices

- Keep commits focused and atomic
- Write clear, descriptive messages
- Reference issues when applicable (`Closes #123`)
- Use present tense ("Add feature" not "Added feature")
- Limit first line to 72 characters
- Separate body from subject with blank line

---

## Questions?

If you have questions about contributing, please:

1. Check existing [documentation](../docs/)
2. Search [GitHub Issues](https://github.com/your-org/multi-model-agent-platform/issues)
3. Open a new issue with the `question` label
4. Join our [Discord community](https://discord.gg/agent-platform)

Thank you for contributing!
