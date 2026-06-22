import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDueReminders, markSent } from "../../lib/reminders.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" });
  }

  try {
    const due = await getDueReminders();

    if (due.length === 0) {
      return res.status(200).json({ sent: 0 });
    }

    let sent = 0;
    for (const reminder of due) {
      try {
        const d = new Date(reminder.remind_at);
        const timeStr = d.toLocaleString("en-NG", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Lagos",
        });

        const text =
          `⏰ *Reminder!*\n\n` +
          `📝 ${reminder.message}\n` +
          `🕐 Due: ${timeStr} WAT`;

        const tgRes = await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: reminder.chat_id,
              text,
              parse_mode: "Markdown",
            }),
          },
        );

        if (tgRes.ok) {
          await markSent(reminder.id);
          sent++;
        } else {
          console.error(`[reminders cron] Failed to send to ${reminder.chat_id}:`, await tgRes.text());
        }
      } catch (err) {
        console.error("[reminders cron] Error sending reminder:", err);
      }
    }

    return res.status(200).json({ sent, total: due.length });
  } catch (err) {
    console.error("[reminders cron] Fatal error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
