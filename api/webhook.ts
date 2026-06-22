import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bot } from "../lib/bot.js";

let botReady = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "Ranti Bot is running" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!botReady) {
      await bot.init();
      botReady = true;
    }
    await bot.handleUpdate(req.body);
  } catch (err) {
    console.error("[webhook] unhandled error:", err);
  }

  return res.status(200).json({ ok: true });
}
