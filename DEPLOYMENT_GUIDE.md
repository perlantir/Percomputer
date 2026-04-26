# Deployment Guide — Multi-Model Agent Orchestration Platform

## Overview

This guide covers deploying the platform in two modes:

| Mode | Description | Best For |
|------|-------------|----------|
| **Demo Mode** | Uses mock data + simulated backend. No external APIs needed. | Quick preview, UI/UX review |
| **Full Production** | Real LLM APIs, live database, full infrastructure | Production use with real AI agents |

---

## Quick Start: Deploy to Vercel (Demo Mode)

### Step 1: Push to GitHub (Done!)
Your repo is at: `https://github.com/perlantir/Percomputer`

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/log in
2. Click **"Add New Project"**
3. Import your GitHub repo `perlantir/Percomputer`
4. Vercel auto-detects Next.js — keep the default settings

### Step 3: Environment Variables
In Vercel Dashboard > Project Settings > Environment Variables, add:

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://percomputer.vercel.app
DATABASE_URL=file:./dev.db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
ENCRYPTION_KEY=your-encryption-key-32-chars-long!!
```

### Step 4: Deploy
Click **Deploy**. Vercel will:
- Run `npm install`
- Run `prisma generate`
- Run `next build`
- Deploy to global CDN

### Step 5: Done!
Your app will be live at `https://percomputer.vercel.app`

---

## Full Production Deployment

### Required Services & Accounts

You need to create accounts and get API keys from the following providers:

#### 1. LLM Providers (Pick your models)

| Provider | API Key Location | Cost |
|----------|-----------------|------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Pay per token |
| **Anthropic (Claude)** | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | Pay per token |
| **Google (Gemini)** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Free tier + paid |
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) | Free tier + paid |
| **Together AI** | [api.together.xyz/settings/api-keys](https://api.together.xyz/settings/api-keys) | Pay per token |

#### 2. Infrastructure

| Service | Purpose | Free Tier? |
|---------|---------|-----------|
| **Vercel** | Frontend hosting | Yes (Hobby) |
| **PostgreSQL** (Vercel/Neon/Supabase) | Database | Yes (500MB) |
| **Redis** (Upstash) | Rate limiting, caching, sessions | Yes (10K cmds/day) |
| **Cloudflare R2 / AWS S3** | File/artifact storage | Yes (10GB) |

#### 3. Optional Monitoring

| Service | Purpose | Free Tier? |
|---------|---------|-----------|
| **Sentry** | Error tracking | Yes (5K errors/mo) |
| **Datadog** | RUM + APM | Yes (1 host) |

---

## Complete Environment Variables

### Required (All Modes)

```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
PORT=3000

# Auth
JWT_SECRET=replace-with-random-64-char-string
ENCRYPTION_KEY=replace-with-random-32-char-string

# Database
DATABASE_URL=postgresql://user:pass@host:5432/computer?schema=public
# OR for SQLite (demo only):
# DATABASE_URL=file:./dev.db
```

### LLM API Keys (Production)

```env
# OpenAI (GPT-4o, GPT-4, GPT-3.5)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic (Claude Opus, Sonnet, Haiku)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

# Google (Gemini Pro, Gemini Flash)
GOOGLE_API_KEY=AIxxxxxxxxxxxxxxxxxxxxxxxx

# Groq (Mixtral, Llama — fast inference)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# Together AI (open source models)
TOGETHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Cohere (Command R)
COHERE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Mistral
MISTRAL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Infrastructure (Production)

```env
# Redis (Upstash recommended for serverless)
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# File Storage (S3-compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=computer-artifacts
S3_ACCESS_KEY_ID=AKIAXXXXXXXXXXXX
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Search (optional — for web search tool)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxx
# OR
SERPER_API_KEY=xxxxxxxxxxxxxxxx
# OR
BING_SEARCH_API_KEY=xxxxxxxxxxxxxxxx
```

### Optional Monitoring

```env
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=computer-platform

# Datadog RUM
NEXT_PUBLIC_DD_RUM_ENABLED=true
NEXT_PUBLIC_DD_RUM_APPLICATION_ID=xxx
NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN=pubxxx
NEXT_PUBLIC_DD_RUM_SITE=us5.datadoghq.com
NEXT_PUBLIC_DD_RUM_ENV=production

# Prometheus Metrics
METRICS_API_TOKEN=your-secure-random-token
```

### Optional OAuth (Social Login)

```env
# Google OAuth
google_CLIENT_ID=xxx.apps.googleusercontent.com
google_CLIENT_SECRET=GOCSPX-xxx

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23lixxx
GITHUB_CLIENT_SECRET=xxx

# OAuth Redirect URL
OAUTH_CALLBACK_URL=https://your-domain.com/api/auth/callback
```

---

## Deployment Options

### Option A: Vercel (Recommended for Frontend)

Best for: Quick deployment, auto-scaling, preview deployments

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Pros:** Zero config, global CDN, preview deployments, serverless functions
**Cons:** Function timeout 60s (Hobby) / 900s (Pro), cold starts

### Option B: Docker (Recommended for Full Backend)

Best for: Long-running workflows, persistent connections, full control

```bash
# Build image
docker build -t computer-platform .

# Run with env file
docker run -p 3000:3000 --env-file .env computer-platform
```

**Pros:** Full Node.js runtime, no timeout limits, persistent state
**Cons:** Need to manage infrastructure, scaling complexity

### Option C: Kubernetes (Enterprise)

Best for: High availability, auto-scaling, multi-region

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n computer-platform
```

---

## Post-Deployment Checklist

### Immediate (Before Going Live)

- [ ] Change all default secrets (`JWT_SECRET`, `ENCRYPTION_KEY`)
- [ ] Set up production database (not SQLite)
- [ ] Configure CORS origins (not wildcard)
- [ ] Enable rate limiting
- [ ] Set up SSL certificate
- [ ] Configure backup strategy for database

### Within First Week

- [ ] Set up Sentry for error tracking
- [ ] Configure log aggregation
- [ ] Set up health check alerts
- [ ] Test all API endpoints
- [ ] Verify auth flow works end-to-end
- [ ] Load test with realistic traffic

### Ongoing

- [ ] Monitor credit usage per LLM provider
- [ ] Review security headers regularly
- [ ] Rotate API keys quarterly
- [ ] Update dependencies monthly
- [ ] Review access logs for anomalies

---

## Cost Estimates

### Demo Mode (Vercel Hobby)
**$0/month** — Free tier covers personal projects

### Small Team (10 users, ~100 workflows/day)

| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Neon PostgreSQL (0.5 GB) | $0 (free) |
| Upstash Redis (10K cmds) | $0 (free) |
| OpenAI API (~500K tokens) | ~$10 |
| Anthropic API (~300K tokens) | ~$15 |
| **Total** | **~$45/month** |

### Production (100 users, ~5K workflows/day)

| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Neon PostgreSQL (10 GB) | $19 |
| Upstash Redis (1M cmds) | $10 |
| OpenAI API (~25M tokens) | ~$500 |
| Anthropic API (~15M tokens) | ~$750 |
| Sentry Team | $26 |
| **Total** | **~$1,325/month** |

---

## Troubleshooting

### Build Failures

| Error | Solution |
|-------|----------|
| `Cannot find module '@sentry/nextjs'` | Remove `SENTRY_AUTH_TOKEN` from env or install `@sentry/nextjs` |
| `Type error in ...` | Set `ignoreBuildErrors: true` in next.config.ts (temporary) |
| `Prisma schema not found` | Run `npx prisma generate` before build |
| `Out of memory` | Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"` |

### Runtime Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| 500 errors on API routes | Missing DATABASE_URL | Set database connection string |
| Auth not working | Invalid JWT_SECRET | Generate new 64-char secret |
| LLM calls failing | Missing API key | Add provider API key to env |
| Slow responses | No Redis cache | Set UPSTASH_REDIS_REST_URL |

---

## Support

- **Docs**: See `README.md` and `ARCHITECTURE.md`
- **API**: See `API.md`
- **Issues**: Create GitHub issue at `github.com/perlantir/Percomputer/issues`
