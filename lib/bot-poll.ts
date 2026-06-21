// This file is ONLY for local development on Replit (npm run dev)
// It runs the bot in long-polling mode so you can test without a webhook
// Do NOT deploy this to Vercel — Vercel uses api/webhook.ts instead

import { bot } from "./bot.js";

console.log("🤖 Ranti Bot starting in polling mode (Replit dev)...");
console.log("Send a message to your Telegram bot to test.");
console.log("Press Ctrl+C to stop.\n");

bot.start({
  onStart: (info) => {
    console.log(`✅ Bot running as @${info.username}`);
    console.log("All commands registered. Ready to receive messages.\n");
  },
});
