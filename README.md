# Ranti Bot v2 🤖
Grammy + Groq + Supabase — Personal AI assistant for Aliu Johnson

## Features
- 💼 Job vacancies in Abuja (5 categories)
- 🌤 Weather for any Nigerian city
- 🧠 Conversation memory via Supabase
- 🔄 Groq → Nvidia fallback chain
- 📅 Daily job digest (Vercel Cron, 7 AM Nigeria)
- ✍️ Virtual assistant (drafting, coding, research)

---

## Step 1 — Supabase Setup
1. Open your Supabase project
2. Go to **SQL Editor → New Query**
3. Paste the contents of `supabase-setup.sql`
4. Click **Run**

---

## Step 2 — Replit Setup

### Upload and install
```bash
unzip ranti-v2.zip
cd ranti-v2
npm install
```

### Add Secrets in Replit (🔒 Secrets tab)
| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_OWNER_CHAT_ID` | From @userinfobot |
| `GROQ_API_KEY` | From console.groq.com |
| `NVIDIA_API_KEY` | From build.nvidia.com |
| `SUPABASE_URL` | From Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | From Supabase → Settings → API |
| `CRON_SECRET` | Any random string |

### Test locally (polling mode)
```bash
npm run dev
```
Open your Telegram bot and test commands.

---

## Step 3 — Push to GitHub
```bash
git init
git add .
git commit -m "Ranti Bot v2 - Grammy + Groq + Supabase"
git remote add origin https://github.com/YOUR_USERNAME/ranti-v2.git
git push -u origin main
```

---

## Step 4 — Deploy to Vercel
```bash
npx vercel deploy --prod
```

Add all env vars in **Vercel → Project → Settings → Environment Variables**.

---

## Step 5 — Register Telegram Webhook (one time)
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-app.vercel.app/api/webhook","allowed_updates":["message","callback_query"]}'
```

---

## Commands
| Command | What it does |
|---------|-------------|
| `/start` | Welcome message |
| `/jobs sales` | Sales jobs in Abuja |
| `/jobs coding` | Vibe coding / tech jobs |
| `/jobs teacher` | Geography teacher jobs |
| `/jobs analyst` | Data analyst jobs |
| `/jobs collector` | Data collector jobs |
| `/alljobs` | Search all 5 categories |
| `/saved` | View saved jobs |
| `/weather` | Abuja weather |
| `/weather Lagos` | Any city weather |
| `/clear` | Clear conversation memory |
| `/status` | Check AI provider status |
| `/help` | Show all commands |

---

## Project Structure
```
ranti-v2/
├── api/
│   ├── webhook.ts          ← Telegram webhook (Vercel)
│   └── cron/
│       └── daily-jobs.ts   ← Morning digest (7 AM Nigeria, Mon-Sat)
├── lib/
│   ├── ai.ts               ← Groq + Nvidia fallback
│   ├── bot.ts              ← Grammy bot + all commands
│   ├── bot-poll.ts         ← Local dev (polling)
│   ├── memory.ts           ← Supabase conversation memory
│   ├── jobs.ts             ← Job scraping + saving
│   ├── weather.ts          ← wttr.in weather
│   ├── prompt.ts           ← AI system prompt
│   └── supabase.ts         ← Supabase client
├── supabase-setup.sql      ← Run this in Supabase SQL Editor
├── vercel.json             ← Routes + cron schedule
└── .env.example            ← Copy to .env for local dev
```
