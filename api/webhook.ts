import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bot } from "../lib/bot.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "Ranti Bot is running ✅" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update = req.body;
    await bot.handleUpdate(update);
  } catch (err) {
    console.error("[webhook] Error handling update:", err);
  }

  // Always return 200 to Telegram — even on error — so it doesn't retry endlessly
  return res.status(200).json({ ok: true });
}
