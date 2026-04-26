# API Documentation

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Error Codes](#error-codes)
4. [Rate Limiting](#rate-limiting)
5. [REST Endpoints](#rest-endpoints)
6. [SSE Event Types](#sse-event-types)
7. [WebSocket Messages](#websocket-messages)
8. [Example Requests](#example-requests)

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:3000/api` |
| Staging | `https://staging.agent-platform.dev/api` |
| Production | `https://api.agent-platform.com/api` |

All API requests should include the `Content-Type: application/json` header.

---

## Authentication

The API uses JWT-based authentication via NextAuth.js. Include the session token in one of the following ways:

### Cookie (Browser)

The session cookie is automatically sent with browser requests. No additional headers required.

### Bearer Token (API Clients)

```
Authorization: Bearer <session-token>
```

### API Key (Service-to-Service)

```
X-API-Key: <api-key>
```

### Authentication Flow

```
POST /api/auth/signin
  -> Redirect to OAuth provider
  -> Callback to /api/auth/callback/:provider
  -> Set session cookie
  -> Return JWT token
```

### Session Response

```json
{
  "user": {
    "id": "user_cuid123",
    "email": "user@example.com",
    "name": "Jane Doe",
    "image": "https://avatars.githubusercontent.com/u/12345",
    "role": "ADMIN"
  },
  "expires": "2024-02-15T10:00:00.000Z"
}
```

---

## Error Codes

### HTTP Status Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded, no response body |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream provider error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "status": 400,
    "details": [
      {
        "field": "modelId",
        "message": "Invalid model ID provided"
      }
    ],
    "requestId": "req_cuid456",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Code Reference

| Code | Description | Recovery Action |
|------|-------------|-----------------|
| `UNAUTHORIZED` | Missing or invalid auth token | Re-authenticate |
| `FORBIDDEN` | Insufficient permissions | Check role/permissions |
| `NOT_FOUND` | Resource not found | Verify resource ID |
| `VALIDATION_ERROR` | Request validation failed | Check request body |
| `RATE_LIMITED` | Rate limit exceeded | Wait and retry |
| `PROVIDER_ERROR` | AI provider API error | Retry or select different model |
| `TIMEOUT` | Request timeout | Retry with shorter context |
| `STREAM_ERROR` | Streaming connection failed | Reconnect to SSE endpoint |
| `DATABASE_ERROR` | Database operation failed | Retry or contact support |
| `INTERNAL_ERROR` | Unexpected server error | Retry or contact support |

---

## Rate Limiting

Rate limits are enforced per user using a token bucket algorithm backed by Redis.

### Limits by Plan

| Plan | Requests/Minute | Burst | Threads/Hour | Messages/Minute |
|------|----------------|-------|--------------|-----------------|
| Free | 60 | 10 | 10 | 20 |
| Pro | 300 | 50 | 100 | 100 |
| Enterprise | 1000 | 200 | Unlimited | 500 |

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312800
X-RateLimit-Window: 60000
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 15 seconds.",
    "status": 429,
    "retryAfter": 15,
    "limit": 60,
    "window": 60000
  }
}
```

---

## REST Endpoints

### Chat Endpoints

#### List Threads

```
GET /chat?page=1&limit=20&status=active&search=
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `status` | string | No | Filter by status: `active`, `archived` |
| `search` | string | No | Search in thread titles |

**Response (200):**

```json
{
  "threads": [
    {
      "id": "thread_cuid123",
      "title": "API Design Discussion",
      "modelId": "gpt-4",
      "status": "ACTIVE",
      "messageCount": 24,
      "lastMessageAt": "2024-01-15T14:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Create Thread

```
POST /chat
```

**Request Body:**

```json
{
  "title": "New Conversation",
  "modelId": "gpt-4",
  "systemPrompt": "You are a helpful coding assistant.",
  "initialMessages": [
    {
      "role": "user",
      "content": "Help me write a Python function"
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "thread_cuid456",
  "title": "New Conversation",
  "modelId": "gpt-4",
  "systemPrompt": "You are a helpful coding assistant.",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T15:00:00.000Z",
  "updatedAt": "2024-01-15T15:00:00.000Z"
}
```

#### Get Thread

```
GET /chat/:threadId
```

**Response (200):**

```json
{
  "id": "thread_cuid456",
  "title": "New Conversation",
  "modelId": "gpt-4",
  "systemPrompt": "You are a helpful coding assistant.",
  "status": "ACTIVE",
  "messages": [
    {
      "id": "msg_cuid789",
      "role": "USER",
      "content": "Help me write a Python function",
      "createdAt": "2024-01-15T15:00:00.000Z"
    },
    {
      "id": "msg_cuid790",
      "role": "ASSISTANT",
      "content": "I'd be happy to help! What should the function do?",
      "modelId": "gpt-4",
      "tokens": 12,
      "createdAt": "2024-01-15T15:00:02.000Z"
    }
  ],
  "createdAt": "2024-01-15T15:00:00.000Z",
  "updatedAt": "2024-01-15T15:00:02.000Z"
}
```

#### Update Thread

```
PATCH /chat/:threadId
```

**Request Body:**

```json
{
  "title": "Updated Title",
  "modelId": "claude-3-5-sonnet",
  "systemPrompt": "You are an expert Python developer.",
  "status": "ARCHIVED"
}
```

**Response (200):**

```json
{
  "id": "thread_cuid456",
  "title": "Updated Title",
  "modelId": "claude-3-5-sonnet",
  "systemPrompt": "You are an expert Python developer.",
  "status": "ARCHIVED",
  "updatedAt": "2024-01-15T16:00:00.000Z"
}
```

#### Delete Thread

```
DELETE /chat/:threadId
```

**Response (204):**

No content.

#### Send Message (Non-Streaming)

```
POST /chat/:threadId/messages
```

**Request Body:**

```json
{
  "content": "Write a function to reverse a string",
  "modelId": "gpt-4",
  "tools": ["web_search", "code_interpreter"],
  "temperature": 0.7,
  "maxTokens": 2000
}
```

**Response (200):**

```json
{
  "message": {
    "id": "msg_cuid791",
    "role": "ASSISTANT",
    "content": "Here's a Python function to reverse a string:\n\n```python\ndef reverse_string(s):\n    return s[::-1]\n```",
    "modelId": "gpt-4",
    "tokens": 45,
    "cost": 0.0012,
    "latency": 1234,
    "createdAt": "2024-01-15T15:01:00.000Z"
  }
}
```

### Chat Streaming Endpoints

#### Stream Message

```
POST /chat/:threadId/stream
```

**Request Body:**

```json
{
  "content": "Explain quantum computing",
  "modelId": "gpt-4",
  "tools": [],
  "temperature": 0.7,
  "maxTokens": 4000
}
```

**Response:**

Server-Sent Events (SSE) stream. See [SSE Event Types](#sse-event-types).

### Workflow Endpoints

#### List Workflows

```
GET /workflows?page=1&limit=20&orgId=
```

**Response (200):**

```json
{
  "workflows": [
    {
      "id": "wf_cuid123",
      "name": "Research Pipeline",
      "description": "Multi-step research workflow",
      "isPublished": true,
      "nodeCount": 5,
      "executionCount": 42,
      "createdAt": "2024-01-10T09:00:00.000Z",
      "updatedAt": "2024-01-14T16:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

#### Create Workflow

```
POST /workflows
```

**Request Body:**

```json
{
  "name": "Content Generator",
  "description": "Generate blog post from topic",
  "nodes": [
    {
      "id": "node_1",
      "type": "prompt",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Outline",
        "prompt": "Create an outline for: {{topic}}",
        "modelId": "gpt-4"
      }
    },
    {
      "id": "node_2",
      "type": "prompt",
      "position": { "x": 400, "y": 100 },
      "data": {
        "label": "Draft",
        "prompt": "Write a blog post based on: {{outline}}",
        "modelId": "claude-3-5-sonnet"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2"
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "wf_cuid456",
  "name": "Content Generator",
  "description": "Generate blog post from topic",
  "nodes": [...],
  "edges": [...],
  "isPublished": false,
  "createdAt": "2024-01-15T15:00:00.000Z",
  "updatedAt": "2024-01-15T15:00:00.000Z"
}
```

#### Get Workflow

```
GET /workflows/:workflowId
```

**Response (200):**

```json
{
  "id": "wf_cuid456",
  "name": "Content Generator",
  "description": "Generate blog post from topic",
  "nodes": [...],
  "edges": [...],
  "settings": {
    "maxIterations": 10,
    "timeout": 30000
  },
  "isPublished": true,
  "executions": [
    {
      "id": "exec_cuid789",
      "status": "COMPLETED",
      "duration": 5234,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T15:00:00.000Z",
  "updatedAt": "2024-01-15T16:00:00.000Z"
}
```

#### Execute Workflow

```
POST /workflows/:workflowId/execute
```

**Request Body:**

```json
{
  "input": {
    "topic": "The Future of AI"
  },
  "options": {
    "stream": true,
    "modelOverrides": {
      "node_1": "gpt-4",
      "node_2": "claude-3-5-sonnet"
    }
  }
}
```

**Response (202):**

```json
{
  "executionId": "exec_cuid999",
  "status": "RUNNING",
  "streamUrl": "/api/sse/workflows/exec_cuid999",
  "estimatedDuration": 15000
}
```

### Agent Endpoints

#### List Agents

```
GET /agents?scope=personal|organization|marketplace&page=1&limit=20
```

**Response (200):**

```json
{
  "agents": [
    {
      "id": "agent_cuid123",
      "name": "Code Reviewer",
      "description": "Expert code reviewer with security focus",
      "modelId": "claude-3-5-sonnet",
      "tools": ["code_analysis", "security_scan"],
      "isPublic": false,
      "createdAt": "2024-01-10T09:00:00.000Z"
    }
  ]
}
```

#### Create Agent

```
POST /agents
```

**Request Body:**

```json
{
  "name": "Research Assistant",
  "description": "Helps with academic research",
  "systemPrompt": "You are an expert research assistant...",
  "modelId": "gpt-4",
  "tools": ["web_search", "citation_lookup"],
  "memoryConfig": {
    "type": "conversation",
    "maxMessages": 50
  },
  "isPublic": false
}
```

**Response (201):**

```json
{
  "id": "agent_cuid456",
  "name": "Research Assistant",
  "description": "Helps with academic research",
  "systemPrompt": "You are an expert research assistant...",
  "modelId": "gpt-4",
  "tools": ["web_search", "citation_lookup"],
  "memoryConfig": {
    "type": "conversation",
    "maxMessages": 50
  },
  "isPublic": false,
  "createdAt": "2024-01-15T15:00:00.000Z"
}
```

### Model Endpoints

#### List Available Models

```
GET /models
```

**Response (200):**

```json
{
  "models": [
    {
      "id": "gpt-4",
      "provider": "openai",
      "name": "GPT-4",
      "description": "Most capable model for complex tasks",
      "maxTokens": 8192,
      "contextWindow": 8192,
      "capabilities": ["text", "vision", "function_calling"],
      "costPer1KInput": 0.03,
      "costPer1KOutput": 0.06,
      "isEnabled": true,
      "qualityScore": 9.5,
      "avgLatency": 1200
    },
    {
      "id": "claude-3-5-sonnet",
      "provider": "anthropic",
      "name": "Claude 3.5 Sonnet",
      "description": "Balanced speed and capability",
      "maxTokens": 4096,
      "contextWindow": 200000,
      "capabilities": ["text", "vision", "function_calling"],
      "costPer1KInput": 0.003,
      "costPer1KOutput": 0.015,
      "isEnabled": true,
      "qualityScore": 9.2,
      "avgLatency": 800
    }
  ]
}
```

### Tool Endpoints

#### List Available Tools

```
GET /tools
```

**Response (200):**

```json
{
  "tools": [
    {
      "id": "web_search",
      "name": "Web Search",
      "description": "Search the web for current information",
      "category": "search",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Search query" }
        },
        "required": ["query"]
      }
    },
    {
      "id": "code_interpreter",
      "name": "Code Interpreter",
      "description": "Execute Python code safely",
      "category": "code",
      "parameters": {
        "type": "object",
        "properties": {
          "code": { "type": "string", "description": "Python code to execute" }
        },
        "required": ["code"]
      }
    }
  ]
}
```

---

## SSE Event Types

Server-Sent Events are used for streaming chat responses, workflow execution logs, and console monitoring.

### Connection

```
GET /api/sse/chat/:threadId
Accept: text/event-stream
```

### Event Format

```
event: token
data: {"text": "Hello", "messageId": "msg_123"}
id: 1705312800000

```

### Event Types

#### `token`

Individual text token from the AI model.

```json
{
  "type": "token",
  "text": " Hello",
  "messageId": "msg_cuid789",
  "timestamp": 1705312800000
}
```

#### `tool_call`

Tool invocation request from the model.

```json
{
  "type": "tool_call",
  "toolCall": {
    "id": "call_cuid123",
    "name": "web_search",
    "arguments": {
      "query": "latest AI developments 2024"
    }
  },
  "messageId": "msg_cuid789",
  "timestamp": 1705312801000
}
```

#### `tool_result`

Tool execution result.

```json
{
  "type": "tool_result",
  "toolResult": {
    "id": "call_cuid123",
    "name": "web_search",
    "result": {
      "results": [
        { "title": "AI Breakthrough 2024", "url": "..." }
      ]
    },
    "status": "success",
    "latency": 450
  },
  "messageId": "msg_cuid789",
  "timestamp": 1705312802000
}
```

#### `message`

Complete message (non-streaming fallback).

```json
{
  "type": "message",
  "message": {
    "id": "msg_cuid789",
    "role": "ASSISTANT",
    "content": "Complete response text...",
    "modelId": "gpt-4",
    "tokens": 156,
    "cost": 0.0047,
    "latency": 2345
  },
  "timestamp": 1705312805000
}
```

#### `usage`

Token usage and cost information.

```json
{
  "type": "usage",
  "usage": {
    "promptTokens": 45,
    "completionTokens": 156,
    "totalTokens": 201,
    "cost": 0.0047,
    "modelId": "gpt-4"
  },
  "timestamp": 1705312805000
}
```

#### `error`

Error during streaming.

```json
{
  "type": "error",
  "error": {
    "code": "PROVIDER_ERROR",
    "message": "OpenAI API temporarily unavailable",
    "recoverable": true
  },
  "timestamp": 1705312803000
}
```

#### `done`

Stream completion signal.

```json
{
  "type": "done",
  "finishReason": "stop",
  "timestamp": 1705312805000
}
```

### Workflow SSE Events

#### `node_start`

Workflow node execution started.

```json
{
  "type": "node_start",
  "nodeId": "node_1",
  "nodeType": "prompt",
  "timestamp": 1705312800000
}
```

#### `node_complete`

Workflow node execution completed.

```json
{
  "type": "node_complete",
  "nodeId": "node_1",
  "output": "Node output content...",
  "duration": 1234,
  "timestamp": 1705312801234
}
```

#### `node_error`

Workflow node execution failed.

```json
{
  "type": "node_error",
  "nodeId": "node_1",
  "error": {
    "code": "TIMEOUT",
    "message": "Node execution exceeded timeout"
  },
  "timestamp": 1705312803000
}
```

---

## WebSocket Messages

WebSockets are used for real-time collaboration features.

### Connection

```
wss://api.agent-platform.com/api/ws
```

### Authentication

Send authentication message immediately after connection:

```json
{
  "type": "auth",
  "token": "<session-token>"
}
```

### Client -> Server Messages

#### `join_room`

Join a collaboration room.

```json
{
  "type": "join_room",
  "roomId": "thread_cuid123"
}
```

#### `typing`

Indicate user is typing.

```json
{
  "type": "typing",
  "roomId": "thread_cuid123",
  "isTyping": true
}
```

#### `cursor_move`

Share cursor position (workflow builder).

```json
{
  "type": "cursor_move",
  "roomId": "wf_cuid456",
  "position": { "x": 350, "y": 200 }
}
```

#### `node_update`

Broadcast node update to collaborators.

```json
{
  "type": "node_update",
  "roomId": "wf_cuid456",
  "node": {
    "id": "node_1",
    "position": { "x": 150, "y": 150 }
  }
}
```

### Server -> Client Messages

#### `presence`

User presence update.

```json
{
  "type": "presence",
  "roomId": "thread_cuid123",
  "users": [
    {
      "id": "user_cuid456",
      "name": "Jane Doe",
      "avatar": "https://...",
      "status": "online"
    }
  ]
}
```

#### `user_typing`

Another user is typing.

```json
{
  "type": "user_typing",
  "roomId": "thread_cuid123",
  "userId": "user_cuid456",
  "userName": "Jane Doe",
  "isTyping": true
}
```

#### `cursor_update`

Collaborator cursor position update.

```json
{
  "type": "cursor_update",
  "roomId": "wf_cuid456",
  "userId": "user_cuid456",
  "position": { "x": 350, "y": 200 }
}
```

#### `node_changed`

Node updated by collaborator.

```json
{
  "type": "node_changed",
  "roomId": "wf_cuid456",
  "userId": "user_cuid456",
  "node": {
    "id": "node_1",
    "position": { "x": 150, "y": 150 }
  }
}
```

#### `message_new`

New message in shared thread.

```json
{
  "type": "message_new",
  "roomId": "thread_cuid123",
  "message": {
    "id": "msg_cuid999",
    "role": "ASSISTANT",
    "content": "New message content...",
    "createdAt": "2024-01-15T15:00:00.000Z"
  }
}
```

---

## Example Requests

### Complete Chat Flow

```bash
# 1. Create a thread
curl -X POST https://api.agent-platform.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Python Help",
    "modelId": "gpt-4"
  }'

# Response: { "id": "thread_abc123", ... }

# 2. Send a streaming message
curl -X POST https://api.agent-platform.com/api/chat/thread_abc123/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "content": "Write a recursive factorial function",
    "modelId": "gpt-4",
    "temperature": 0.7
  }'

# Response: SSE stream with tokens

# 3. Get thread messages
curl https://api.agent-platform.com/api/chat/thread_abc123 \
  -H "Authorization: Bearer <token>"

# 4. Update thread title
curl -X PATCH https://api.agent-platform.com/api/chat/thread_abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "title": "Python Factorial Help" }'

# 5. Delete thread
curl -X DELETE https://api.agent-platform.com/api/chat/thread_abc123 \
  -H "Authorization: Bearer <token>"
```

### Workflow Execution Flow

```bash
# 1. Create a workflow
curl -X POST https://api.agent-platform.com/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Summarizer",
    "description": "Summarize long text",
    "nodes": [
      {
        "id": "input",
        "type": "input",
        "position": {"x": 100, "y": 100},
        "data": {"label": "Text Input"}
      },
      {
        "id": "summarize",
        "type": "prompt",
        "position": {"x": 400, "y": 100},
        "data": {
          "label": "Summarize",
          "prompt": "Summarize this text: {{input.text}}",
          "modelId": "gpt-4"
        }
      }
    ],
    "edges": [
      {"id": "e1", "source": "input", "target": "summarize"}
    ]
  }'

# Response: { "id": "wf_abc456", ... }

# 2. Execute workflow with streaming
curl -X POST https://api.agent-platform.com/api/workflows/wf_abc456/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "input": {"text": "Long text to summarize..."},
    "options": {"stream": true}
  }'

# Response: { "executionId": "exec_789", "streamUrl": "/api/sse/workflows/exec_789" }

# 3. Connect to execution stream
curl https://api.agent-platform.com/api/sse/workflows/exec_789 \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer <token>"

# Response: SSE stream with node_start, node_complete, done events
```

### TypeScript Client Example

```typescript
// lib/api/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.error);
  }

  return response.json();
}

// Usage
const threads = await api<ThreadListResponse>("/chat?page=1");
const thread = await api<ThreadResponse>("/chat/thread_123");

// Streaming
async function* streamMessage(threadId: string, content: string) {
  const response = await fetch(`${API_BASE}/chat/${threadId}/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, modelId: "gpt-4" }),
    credentials: "include",
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const event = JSON.parse(line.slice(6));
        yield event;
      }
    }
  }
}
```
