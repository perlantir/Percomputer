# Step-by-Step: Deploy to Vercel (With Screenshots)

## Step 1: Go to Vercel New Project
Open: https://vercel.com/new

## Step 2: Sign in with GitHub
You'll see this page. Click **"Continue with GitHub"** and log in:

```
+----------------------------------------+
|         Sign in to GitHub              |
|           to continue to Vercel        |
|                                        |
|  [Username or email address]           |
|  [Password]                            |
|                                        |
|  [        Sign in        ]             |
|                                        |
|  or                                    |
|                                        |
|  [Continue with Google]                |
|  [Continue with Apple]                 |
+----------------------------------------+
```

## Step 3: Authorize Vercel
After signing in, GitHub will ask you to authorize Vercel. Click **"Authorize Vercel"**.

## Step 4: Import Your Repository
You'll see a list of your GitHub repos. Search for **"Percomputer"** and click **"Import"**:

```
+------------------------------------------+
|  Import Git Repository                   |
|                                          |
|  [Search repositories...]                |
|                                          |
|  perlantir/Percomputer    [Import]       |
|                                          |
+------------------------------------------+
```

## Step 5: Configure Project
Vercel auto-detects Next.js. You'll see this page:

```
+------------------------------------------+
|  Configure Project                       |
|                                          |
|  Framework Preset: Next.js               |
|  Root Directory: ./                      |
|  Build Command: prisma generate &&       |
|                 next build               |
|  Output Directory: .next                 |
|  Install Command: npm install            |
|                                          |
|  [  Environment Variables  ]             |
|                                          |
|  + Add a key                             |
|                                          |
|  [           Deploy           ]          |
+------------------------------------------+
```

**Don't click Deploy yet!** First add the Environment Variables (Step 6).

## Step 6: Add Environment Variables
Click **"+ Add a key"** and add these 4 variables ONE BY ONE:

### Variable 1:
```
Key:   NODE_ENV
Value: production
```

### Variable 2:
```
Key:   NEXT_PUBLIC_APP_URL
Value: https://percomputer.vercel.app
```
(Replace "percomputer" with whatever Vercel auto-generates, or use your custom domain)

### Variable 3:
```
Key:   JWT_SECRET
Value: (generate a random 64-character string)
```
**To generate:** Go to https://randomkeygen.com and copy the "CodeIgniter Encryption Keys" (256-bit) value, OR just type 64 random characters.

Example: `your-super-secret-jwt-key-here-minimum-64-characters-long-ok`

### Variable 4:
```
Key:   ENCRYPTION_KEY
Value: (generate a random 32-character string)
```
Example: `your-32-char-encryption-key-here!`

Your Environment Variables section should look like this:

```
+------------------------------------------+
|  Environment Variables                   |
|                                          |
|  NODE_ENV              production        |
|  NEXT_PUBLIC_APP_URL   https://...       |
|  JWT_SECRET            (64 chars)        |
|  ENCRYPTION_KEY        (32 chars)        |
|                                          |
|  [+ Add a key]                           |
+------------------------------------------+
```

## Step 7: Click DEPLOY!
Click the big **"Deploy"** button!

Vercel will now:
1. Clone your repo (takes ~30 seconds)
2. Run `npm install` (takes ~2 minutes)
3. Run `prisma generate` (takes ~10 seconds)
4. Run `next build` (takes ~5-10 minutes)
5. Deploy to global CDN (takes ~30 seconds)

You'll see a progress bar. **Wait for it to finish.**

## Step 8: DONE! Your App is LIVE!
You'll see a **"Congratulations!"** page with your URL:

```
+------------------------------------------+
|     Congratulations!                     |
|     Your project has been deployed.      |
|                                          |
|     https://percomputer.vercel.app       |
|                                          |
|     [Go to Dashboard]                    |
+------------------------------------------+
```

Click the URL — your app is LIVE! 

---

## What You'll See (Demo Mode)

Since this is demo mode (no real LLM keys yet), you'll see:

- **Home page** with the beautiful composer
- **15 pre-built demo workflows** you can explore
- **Full UI** with dark/light mode toggle
- **All pages** working (Library, Discover, Settings, Console)

Everything works with **mock/simulated data**. Real AI responses come when you add LLM keys.

---

## Part 2: Add LLM API Keys (Make AI Work)

After the app is live, here's how to add real AI providers:

### Step A: Get a FREE Google Gemini API Key (Recommended First)

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (looks like: `AIzaSy...`)

### Step B: Add it to Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your **"Percomputer"** project
3. Click **"Settings"** tab at the top
4. Click **"Environment Variables"** in the left menu
5. Add:
```
Key:   GOOGLE_API_KEY
Value: AIzaSy... (paste your key here)
```
6. Click **"Save"**
7. Vercel will auto-redeploy with the new key

### Step C: Test It!

1. Go back to your live app URL
2. Click the composer, type: "Research the top 5 AI companies"
3. Click **Run**
4. You should now see a REAL AI workflow running!

---

## Optional: Add More AI Providers

Repeat Step B for each provider you want:

### OpenAI (GPT-4o)
- Get key: https://platform.openai.com/api-keys
- Add as: `OPENAI_API_KEY`
- Cost: ~$0.01-0.05 per query

### Anthropic (Claude)
- Get key: https://console.anthropic.com/settings/keys
- Add as: `ANTHROPIC_API_KEY`
- Cost: ~$0.01-0.10 per query

### Groq (Fast & Free Tier)
- Get key: https://console.groq.com/keys
- Add as: `GROQ_API_KEY`
- Cost: FREE tier available!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Build Failed" | Check the build logs in Vercel dashboard |
| "Module not found" | The deployment fixes may not be in your repo — check the latest commit |
| 404 on all pages | Make sure `vercel.json` is in your repo root |
| AI not responding | Verify the API key is saved correctly in Environment Variables |
| "Rate limited" | You're on the free tier — wait a minute and retry |

---

## Need Help?

If you get stuck at any step, send me:
1. Which step you're on
2. What you see on screen (or a screenshot)
3. Any error messages

I'll help you through it!
