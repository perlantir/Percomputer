# QUICK START — Deploy with Supabase (5 Minutes)

## Your Supabase is Ready!
- **Project URL:** https://pcfpoaqdwixxxmmbheid.supabase.co
- **Database Host:** db.pcfpoaqdwixxxmmbheid.supabase.co
- **Status:** ✅ Connected

---

## Step 1: Deploy to Vercel (2 Minutes)

**Option A: One-Click Deploy (FASTEST)**

Click this button and Vercel will clone your repo and start the build:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fperlantir%2FPercomputer&env=DATABASE_URL,NODE_ENV,NEXT_PUBLIC_APP_URL,JWT_SECRET,ENCRYPTION_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Required%20environment%20variables%20for%20Supabase%20deployment&envLink=https%3A%2F%2Fgithub.com%2Fperlantir%2FPercomputer%23environment-variables&project-name=percomputer&repository-name=Percomputer)

**Option B: Manual Import**
1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Find `perlantir/Percomputer` → Click **Import**
4. Vercel auto-detects Next.js — good!

---

## Step 2: Add Environment Variables (2 Minutes)

When Vercel asks for environment variables, paste these **7 values** exactly:

| # | Key | Value |
|---|-----|-------|
| 1 | `DATABASE_URL` | `postgresql://postgres:cavdu4-gyncax-qusxyX@db.pcfpoaqdwixxxmmbheid.supabase.co:5432/postgres` |
| 2 | `NODE_ENV` | `production` |
| 3 | `NEXT_PUBLIC_APP_URL` | `https://percomputer.vercel.app` |
| 4 | `JWT_SECRET` | Generate at https://randomkeygen.com (copy 256-bit key) |
| 5 | `ENCRYPTION_KEY` | Any 32 random characters |
| 6 | `NEXT_PUBLIC_SUPABASE_URL` | `https://pcfpoaqdwixxxmmbheid.supabase.co` |
| 7 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZnBvYXFkd2l4eHhtbWJoZWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODYxNjIsImV4cCI6MjA5Mjc2MjE2Mn0.o5DVcSzFHqYw6Sg35Vm3dbdLf0iXTQ7hiB9BlQrtsxE` |

**How to add:**
- Click "+ Add a key" in Vercel
- Paste each Key and Value
- Do this 7 times

---

## Step 3: Click DEPLOY! (1 Minute)

Click the big **"Deploy"** button.

Vercel will:
1. `npm install` (~2 min)
2. `prisma generate` (~30 sec)
3. `next build` (~5 min)
4. `prisma db push` (~30 sec) ← **Auto-creates all tables in Supabase!**

**Wait for the green checkmark.**

---

## Step 4: Seed Demo Data (30 Seconds)

After deployment is live, open this URL in your browser:

```
https://percomputer.vercel.app/api/seed
```

If it shows `{"seeded":false}`, seed the database by running:

```bash
curl -X POST https://percomputer.vercel.app/api/seed \
  -H "Authorization: Bearer setup-seed-2024"
```

Or use a tool like Postman/Insomnia to send a POST request with header:
- `Authorization: Bearer setup-seed-2024`

**Done!** Your database now has demo workflows, tasks, users, and artifacts.

---

## Step 5: Your App is LIVE! 🎉

Open your Vercel URL and explore:
- **Home** with composer
- **15 demo workflows** in Library
- **Console** with operator tools
- **Settings** with all panels

Everything persists to **Supabase PostgreSQL**!

---

## Add Real AI (Optional — Do Anytime)

After your app is live, add LLM keys for real AI responses:

| Provider | Free? | Get Key At | Add As |
|----------|-------|-----------|--------|
| **Google Gemini** | ✅ Yes | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | `GOOGLE_API_KEY` |
| **Groq** | ✅ Yes | [console.groq.com/keys](https://console.groq.com/keys) | `GROQ_API_KEY` |
| **OpenAI** | ❌ No | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | `OPENAI_API_KEY` |
| **Anthropic Claude** | ❌ No | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | `ANTHROPIC_API_KEY` |

**How to add:** Vercel Dashboard → Your Project → Settings → Environment Variables → Add Key

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Database connection failed" | Double-check `DATABASE_URL` is pasted exactly |
| "Build failed" | Check Vercel build logs; may need to trigger redeploy |
| "No data in app" | Run the seed step (Step 4) |
| Tables missing in Supabase | Vercel build auto-runs `prisma db push`; trigger redeploy |

---

## What You Now Have

| Component | Status |
|-----------|--------|
| Next.js 15 frontend | ✅ Live on Vercel CDN |
| Supabase PostgreSQL | ✅ Persistent database |
| 15 demo workflows | ✅ In database |
| Real-time streaming | ✅ Working |
| Dark/light mode | ✅ Working |
| All pages functional | ✅ Working |
| **Cost** | **$0** (Vercel Hobby + Supabase Free) |

---

## Support

- Repo: https://github.com/perlantir/Percomputer
- Detailed guide: `VERCEL_DEPLOY_STEPS.md` in repo
- Full deployment guide: `DEPLOYMENT_GUIDE.md` in repo
