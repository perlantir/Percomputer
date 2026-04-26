# Deployment Guide

## Table of Contents

1. [Vercel Deployment](#vercel-deployment)
2. [Docker Setup](#docker-setup)
3. [Environment Configuration](#environment-configuration)
4. [Build Optimization](#build-optimization)
5. [Monitoring](#monitoring)

---

## Vercel Deployment

### Prerequisites

- Vercel account (Pro recommended for production)
- GitHub/GitLab/Bitbucket repository connected to Vercel
- PostgreSQL database (Vercel Postgres, Supabase, or self-hosted)
- Redis instance (Upstash Redis recommended for serverless)

### Step-by-Step Deployment

#### 1. Create Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel
```

Or deploy via Git integration:

1. Push code to GitHub repository
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Select repository and framework preset (Next.js)

#### 2. Configure Environment Variables

In Vercel Dashboard > Project Settings > Environment Variables, add:

| Variable | Environment | Value |
|----------|-------------|-------|
| `DATABASE_URL` | Production | `postgresql://...` |
| `REDIS_URL` | Production | `rediss://...` |
| `NEXTAUTH_SECRET` | Production | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production | `https://your-domain.com` |
| `OPENAI_API_KEY` | Production | Your OpenAI API key |
| `ANTHROPIC_API_KEY` | Production | Your Anthropic API key |
| `GOOGLE_AI_API_KEY` | Production | Your Google AI API key |

#### 3. Configure Build Settings

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 300
    }
  }
}
```

#### 4. Database Setup

```bash
# Run migrations on production database
vercel env pull .env.production.local
pnpm prisma migrate deploy
```

#### 5. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy with Git integration)
git push origin main
```

#### 6. Configure Custom Domain

1. Vercel Dashboard > Project Settings > Domains
2. Add your domain
3. Configure DNS records as instructed
4. Enable HTTPS (auto-provisioned by Vercel)

### Vercel Edge Runtime Considerations

Some API routes require the Node.js runtime for streaming:

```typescript
// app/api/chat/stream/route.ts
export const runtime = "nodejs"; // Required for AI SDK streaming
export const maxDuration = 300; // 5 minutes for long conversations
```

Static pages and data fetching use the Edge runtime by default:

```typescript
// app/(dashboard)/chat/page.tsx
export const runtime = "edge"; // Faster cold starts
```

### Vercel Preview Deployments

Each pull request gets a unique preview deployment:

```bash
# Preview deployment URL pattern
https://<project>-<branch>-<hash>.vercel.app
```

Preview deployments share the same environment variables but can use a separate database:

```bash
# Add preview-specific environment variables
vercel env add DATABASE_URL preview
```

---

## Docker Setup

### Development Environment

```dockerfile
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/agent_platform
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=dev-secret-change-in-production
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: agent_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```dockerfile
# Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]
```

### Production Environment

```dockerfile
# Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
```

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_prod:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_prod:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_prod:
  redis_prod:
```

### Running with Docker

```bash
# Development
docker-compose up -d

# View logs
docker-compose logs -f app

# Run migrations
docker-compose exec app pnpm prisma migrate deploy

# Production
docker-compose -f docker-compose.prod.yml up -d

# Build and push to registry
docker build -t agent-platform:latest .
docker tag agent-platform:latest registry.example.com/agent-platform:latest
docker push registry.example.com/agent-platform:latest
```

---

## Environment Configuration

### Environment Files

```
.env.local          # Local development (gitignored)
.env.development    # Development defaults
.env.staging        # Staging environment
.env.production     # Production defaults
.env.example        # Template (committed to repo)
```

### Environment-Specific Settings

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | `development` | `production` | `production` |
| `LOG_LEVEL` | `debug` | `info` | `warn` |
| `RATE_LIMIT_MAX` | 1000 | 300 | 60 |
| `ENABLE_ANALYTICS` | `false` | `true` | `true` |
| `SENTRY_DSN` | — | Set | Set |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://staging...` | `https://...` |

### Feature Flags

```typescript
// lib/feature-flags.ts
export const featureFlags = {
  enableNewWorkflowEngine: process.env.ENABLE_NEW_WORKFLOW_ENGINE === "true",
  enableCollaboration: process.env.ENABLE_COLLABORATION === "true",
  enableAdvancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === "true",
  enableBetaModels: process.env.ENABLE_BETA_MODELS === "true",
};
```

### Secret Management

- Never commit `.env.local` or any file with real secrets
- Rotate API keys quarterly
- Use Vercel/Docker secrets for production
- Enable key auditing on all AI provider accounts

---

## Build Optimization

### Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker
  output: "standalone",

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@xyflow/react",
      "recharts",
    ],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/old-path",
        destination: "/new-path",
        permanent: true,
      },
    ];
  },

  // Rewrites for API proxying
  async rewrites() {
    return [
      {
        source: "/api/external/:path*",
        destination: "https://external-api.com/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
```

### Bundle Analysis

```bash
# Analyze bundle size
pnpm analyze

# This runs:
# ANALYZE=true next build
# Which generates .next/analyze/*.html
```

### Tree Shaking

Ensure proper tree shaking by:

1. Using ES modules (`import`/`export`)
2. Avoiding side-effect imports
3. Using barrel exports carefully

```typescript
// Good: named exports
export { Button } from "./button";
export { Input } from "./input";

// Bad: wildcard export (prevents tree shaking)
export * from "./utils";
```

### Code Splitting

Next.js automatically code-splits by route. For manual splitting:

```tsx
// Lazy load heavy components
import dynamic from "next/dynamic";

const WorkflowBuilder = dynamic(
  () => import("@/components/workflow/workflow-builder"),
  {
    loading: () => <WorkflowBuilderSkeleton />,
    ssr: false, // Only render on client
  }
);
```

### Database Connection Pooling

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

For serverless environments, configure connection pooling:

```
# Using PgBouncer or connection pooler
DATABASE_URL="postgresql://user:pass@pooler.example.com:6543/db?pgbouncer=true"
```

---

## Monitoring

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  try {
    await redis.ping();
    checks.redis = true;
  } catch {
    checks.redis = false;
  }

  const healthy = checks.database && checks.redis;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      checks,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    },
    { status: healthy ? 200 : 503 }
  );
}
```

### Logging

```typescript
// lib/logger.ts
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: "agent-platform" },
  transports: [
    new transports.Console({
      format:
        process.env.NODE_ENV === "development"
          ? format.combine(format.colorize(), format.simple())
          : format.json(),
    }),
  ],
});

export { logger };
```

### Error Tracking (Sentry)

```bash
# Install Sentry integration
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Performance Monitoring

```typescript
// lib/monitoring.ts
export function trackAPICall(
  endpoint: string,
  duration: number,
  status: number
) {
  // Send to monitoring service
  console.log(`[API] ${endpoint} - ${duration}ms - ${status}`);
}

export function trackAIRequest(
  modelId: string,
  tokens: number,
  cost: number,
  latency: number
) {
  console.log(
    `[AI] ${modelId} - ${tokens} tokens - $${cost} - ${latency}ms`
  );
}
```

### Vercel Analytics

Enable built-in Vercel Analytics:

```bash
# Install
pnpm add @vercel/analytics

# Add to layout
# app/layout.tsx
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Datadog Real User Monitoring (RUM)

Datadog RUM provides real-time visibility into frontend performance, user sessions, and error tracking in production.

#### Setup

1. **Create a RUM application** in Datadog:
   - Go to **Digital Experience > RUM Applications > New Application**
   - Choose **RUM** type and give it a name (e.g. `agent-platform-web`)
   - Note the **Application ID** and generate a **Client Token**

2. **Configure environment variables** (all client-side, so they must be `NEXT_PUBLIC_*`):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_DD_RUM_ENABLED` | Yes | `"true"` to enable RUM |
| `NEXT_PUBLIC_DD_RUM_APPLICATION_ID` | Yes | Application ID from Datadog |
| `NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN` | Yes | Client token from Datadog |
| `NEXT_PUBLIC_DD_RUM_SITE` | No | Datadog site (`datadoghq.com`, `datadoghq.eu`, `us3.datadoghq.com`, `ddog-gov.com`) |
| `NEXT_PUBLIC_DD_RUM_ENV` | No | Environment tag (`production`, `staging`, `development`) |
| `NEXT_PUBLIC_DD_RUM_SERVICE` | No | Service name (default: `agent-platform-web`) |
| `NEXT_PUBLIC_DD_RUM_VERSION` | No | App version tag (default: `0.1.0`) |
| `NEXT_PUBLIC_DD_RUM_SAMPLE_RATE` | No | Session sample rate `0-100` (default: `100`) |
| `NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE` | No | Replay sample rate `0-100` (default: `0`) |

3. **Verify CSP headers** — `next.config.ts` already includes the required `Content-Security-Policy` directives for Datadog domains. If you have a custom CSP, ensure these are present:
   - `connect-src` must include `https://*.datadoghq.com`, `https://browser-intake-datadoghq.com`
   - `script-src` must include `https://www.datadoghq-browser-agent.com`
   - `worker-src` must include `blob:` (required by RUM's web-worker)

#### Programmatic API

The `datadog.ts` module exports helpers for custom tracking:

```typescript
import {
  addRUMAction,
  addRUMError,
  setRUMUser,
  clearRUMUser,
  addTiming,
  startRUMView,
} from "@/src/lib/monitoring/datadog";

// Track user actions (e.g. prompt submit, model switch)
addRUMAction("submit_prompt", { model: "gpt-4o", tokenCount: 512 });

// Manually record errors
addRUMError(new Error("Model timeout"), { modelId: "claude-3" }, "network");

// Attach user context (call after login)
setRUMUser({ id: "user-123", email: "alice@example.com", plan: "pro" });

// Clear user context (call on logout)
clearRUMUser();

// Track custom performance timings
addTiming("time_to_first_token", Date.now());

// SPA route view tracking (handled automatically by DatadogRUMProvider)
startRUMView("/w/workflow-123");
```

#### Privacy

- **Default**: `mask-user-input` — form inputs are masked, everything else is recorded
- Session replay is **disabled by default** (`NEXT_PUBLIC_DD_RUM_SESSION_REPLAY_SAMPLE_RATE=0`)
- To fully disable RUM, set `NEXT_PUBLIC_DD_RUM_ENABLED=false` — the SDK will not be loaded at all

---

### Alerting

Configure alerts for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| API 5xx rate | > 1% | Page on-call |
| Response time p95 | > 2s | Investigate |
| Database connections | > 80% | Scale pool |
| AI provider errors | > 5% | Switch provider |
| Error rate | > 0.5% | Investigate |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] TypeScript strict mode clean
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] API keys valid and not expired
- [ ] Feature flags configured
- [ ] SSL certificate ready

### Post-Deployment

- [ ] Health check endpoint returns 200
- [ ] Database connections working
- [ ] Redis cache accessible
- [ ] Authentication flow working
- [ ] AI provider APIs responding
- [ ] Streaming endpoints functional
- [ ] Error tracking receiving events
- [ ] Analytics collecting data
- [ ] Datadog RUM receiving sessions

### Rollback Plan

1. Identify issue via monitoring alerts
2. Revert to previous deployment:
   ```bash
   vercel --prod --version <previous-version>
   ```
3. Notify team via incident channel
4. Create post-mortem document
