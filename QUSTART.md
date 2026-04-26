# QUICK START — Deploy in 5 Minutes

## Option 1: One-Click Deploy (FASTEST)

Click this button to deploy directly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fperlantir%2FPercomputer&env=NODE_ENV,NEXT_PUBLIC_APP_URL,JWT_SECRET,ENCRYPTION_KEY&envDescription=Required%20environment%20variables&envLink=https%3A%2F%2Fgithub.com%2Fperlantir%2FPercomputer%23environment-variables&project-name=percomputer&repository-name=Percomputer&demo-title=Multi-Model%20Agent%20Orchestration%20Platform&demo-description=Perplexity%20Computer%20clone%20with%20multi-model%20AI%20agent%20orchestration&demo-url=https%3A%2F%2Fpercomputer.vercel.app)

^ **Click the button above** ^

Then fill in these 4 values when prompted:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://percomputer.vercel.app` |
| `JWT_SECRET` | Any 64+ random characters (generate at randomkeygen.com) |
| `ENCRYPTION_KEY` | Any 32 random characters |

Click **Deploy**. Done! 

---

## Option 2: Manual Steps (If One-Click Doesn't Work)

### Step 1
Go to https://vercel.com/new

### Step 2
Click **"Continue with GitHub"** and sign in

### Step 3
Find `perlantir/Percomputer` in your repos, click **Import**

### Step 4
Add 4 Environment Variables (click "+ Add a key" for each):

```
NODE_ENV = production
NEXT_PUBLIC_APP_URL = https://percomputer.vercel.app
JWT_SECRET = your-64-character-random-string-here-generate-at-randomkeygen-com
ENCRYPTION_KEY = your-32-character-random-string
```

### Step 5
Click **Deploy** and wait 5-10 minutes

### Step 6
Your app is live at `https://percomputer.vercel.app`

---

## Add AI (After Deploy)

### Free Option: Google Gemini
1. Get free key: https://aistudio.google.com/app/apikey
2. In Vercel dashboard > your project > Settings > Environment Variables
3. Add: `GOOGLE_API_KEY = your-key-here`
4. Auto-redeploys — AI now works!

### Other Providers (Optional)
| Provider | Get Key At | Env Variable Name |
|----------|-----------|-------------------|
| OpenAI | platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Anthropic Claude | console.anthropic.com/settings/keys | `ANTHROPIC_API_KEY` |
| Groq (free tier!) | console.groq.com/keys | `GROQ_API_KEY` |

Add each the same way as Google Gemini above.

---

## What You Get

**Demo Mode (no keys):**
- Full UI with 15 demo workflows
- All pages working with mock data
- Dark/light mode, all features visible

**With AI Keys:**
- Real AI workflows that run actual LLMs
- Live streaming responses
- Real research, code generation, analysis

---

## Cost

| Setup | Monthly Cost |
|-------|-------------|
| Demo mode | **$0** |
| With Gemini free tier | **$0** |
| With paid LLMs | ~$10-50 depending on usage |

---

Done! Your Perplexity Computer clone will be live! 
