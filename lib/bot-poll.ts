// This file is ONLY for local development on Replit (npm run dev)
// It runs the bot in long-polling mode so you can test without a webhook
// Do NOT deploy this to Vercel — Vercel uses api/webhook.ts instead

import { bot } from "./bot.js";
import { getDueReminders, markSent } from "./reminders.js";

console.log("🤖 Ranti Bot starting in polling mode (Replit dev)...");
console.log("Send a message to your Telegram bot to test.");
console.log("Press Ctrl+C to stop.\n");

// ── Reminder poller — checks every 60 seconds for due reminders ───────────────
async function fireReminders() {
  try {
    const due = await getDueReminders();
    for (const r of due) {
      try {
        await bot.api.sendMessage(
          r.chat_id,
          `⏰ *Reminder!*\n\n${r.message}`,
          { parse_mode: "Markdown" },
        );
        await markSent(r.id);
        console.log(`[reminders] Fired: "${r.message}" → chat ${r.chat_id}`);
      } catch (err) {
        console.error(`[reminders] Failed to send reminder ${r.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[reminders] Poll error:", err);
  }
}

// Start polling reminders immediately, then every 60s
fireReminders();
setInterval(fireReminders, 60_000);

bot.start({
  onStart: (info) => {
    console.log(`✅ Bot running as @${info.username}`);
    console.log("All commands registered. Reminder poller active.\n");
  },
});
