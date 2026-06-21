import type { VercelRequest, VercelResponse } from "@vercel/node";
import { scrapeJobs, saveJobs, JOB_CATEGORIES } from "../../lib/jobs.js";
import { bot } from "../../lib/bot.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security: only allow Vercel cron calls (or manual GET for testing)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID;
  if (!ownerChatId) {
    console.error("[cron] TELEGRAM_OWNER_CHAT_ID not set");
    return res.status(500).json({ error: "TELEGRAM_OWNER_CHAT_ID not configured" });
  }

  const chatId = parseInt(ownerChatId, 10);
  const summaries: string[] = [];
  let totalNew = 0;

  // Send start message
  await bot.api.sendMessage(chatId, "🌅 *Morning Job Digest — Ranti is scanning...*", {
    parse_mode: "Markdown",
  });

  for (const category of JOB_CATEGORIES) {
    try {
      const jobs = await scrapeJobs(category);
      const saved = await saveJobs(jobs);
      totalNew += saved;
      summaries.push(
        `*${category.toUpperCase()}*: ${jobs.length} found, ${saved} new`,
      );
    } catch (err) {
      summaries.push(`*${category.toUpperCase()}*: ❌ error`);
      console.error(`[cron] ${category} failed:`, err);
    }
  }

  const digest =
    `🌅 *Good Morning, Aliu!*\n\n` +
    `*Today's Job Scan — Abuja*\n` +
    `${summaries.join("\n")}\n\n` +
    `*${totalNew} new job(s) saved today.*\n` +
    `Use /saved to view all listings.\n\n` +
    `_Have a productive day! E kaaro!_ 🇳🇬`;

  await bot.api.sendMessage(chatId, digest, { parse_mode: "Markdown" });

  return res.status(200).json({ ok: true, totalNew, categories: summaries });
}
