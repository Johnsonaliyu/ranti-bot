import { Bot, InlineKeyboard } from "grammy";
import { chat } from "./ai.js";
import { getHistory, saveHistory, clearHistory, addMessage } from "./memory.js";
import { getWeather } from "./weather.js";
import {
  scrapeJobs,
  saveJobs,
  getSavedJobs,
  formatJobs,
  JOB_CATEGORIES,
  type JobCategory,
} from "./jobs.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import {
  parseRemindInput,
  saveReminder,
  getPendingReminders,
  deleteReminder,
} from "./reminders.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");

export const bot = new Bot(token);

// ── /start ──────────────────────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  await ctx.reply(
    `👋 *E kaaro, Aliu!*\n\nI'm *Ranti*, your personal AI assistant.\n\n` +
      `Here's what I can do:\n` +
      `💼 Find job vacancies in Abuja\n` +
      `🌤 Check weather for any city\n` +
      `✍️ Draft emails, cover letters, messages\n` +
      `💻 Help with coding and tech questions\n` +
      `🔍 Research any topic\n\n` +
      `Type /help to see all commands, or just chat with me naturally!`,
    { parse_mode: "Markdown" },
  );
});

// ── /help ───────────────────────────────────────────────────────────────────
bot.command("help", async (ctx) => {
  await ctx.reply(
    `*Ranti Commands*\n\n` +
      `💼 *Jobs*\n` +
      `/jobs sales — Sales jobs in Abuja\n` +
      `/jobs coding — Vibe coding / tech jobs\n` +
      `/jobs teacher — Geography teacher jobs\n` +
      `/jobs analyst — Data analyst jobs\n` +
      `/jobs collector — Data collector jobs\n` +
      `/alljobs — Search all 5 categories\n` +
      `/saved — View saved job listings\n\n` +
      `🌤 *Weather*\n` +
      `/weather — Abuja weather\n` +
      `/weather Lagos — Any city\n\n` +
      `⏰ *Reminders*\n` +
      `/remind 30m Call client — Set a reminder\n` +
      `/reminders — View pending reminders\n` +
      `/unremind <ID> — Cancel a reminder\n\n` +
      `⚙️ *Settings*\n` +
      `/clear — Clear conversation memory\n` +
      `/status — Check AI provider status\n\n` +
      `Or just chat normally — I remember our conversation! 💬`,
    { parse_mode: "Markdown" },
  );
});

// ── /weather ─────────────────────────────────────────────────────────────────
bot.command("weather", async (ctx) => {
  const city = ctx.match?.trim() || "Abuja";
  const msg = await ctx.reply(`⏳ Checking weather for *${city}*...`, {
    parse_mode: "Markdown",
  });
  const result = await getWeather(city);
  await ctx.api.editMessageText(ctx.chat.id, msg.message_id, result, {
    parse_mode: "Markdown",
  });
});

// ── /jobs [category] ─────────────────────────────────────────────────────────
bot.command("jobs", async (ctx) => {
  const input = ctx.match?.trim().toLowerCase() ?? "";

  const categoryMap: Record<string, JobCategory> = {
    sales: "sales",
    coding: "vibe coding",
    "vibe coding": "vibe coding",
    vibe: "vibe coding",
    tech: "vibe coding",
    developer: "vibe coding",
    teacher: "geography teacher",
    geography: "geography teacher",
    analyst: "data analyst",
    data: "data analyst",
    collector: "data collector",
    enumerator: "data collector",
    field: "data collector",
  };

  const category = categoryMap[input];

  if (!category) {
    const kb = new InlineKeyboard()
      .text("💰 Sales", "jobs:sales")
      .text("💻 Coding", "jobs:vibe coding")
      .row()
      .text("📚 Teacher", "jobs:geography teacher")
      .text("📊 Analyst", "jobs:data analyst")
      .row()
      .text("📋 Collector", "jobs:data collector");

    await ctx.reply("Which job category do you want?", {
      reply_markup: kb,
    });
    return;
  }

  await searchAndReply(ctx, category);
});

// ── /alljobs ─────────────────────────────────────────────────────────────────
bot.command("alljobs", async (ctx) => {
  const msg = await ctx.reply(
    "🔍 Searching all 5 job categories in Abuja... This may take a moment.",
  );
  let totalNew = 0;
  const summaries: string[] = [];

  for (const cat of JOB_CATEGORIES) {
    try {
      const jobs = await scrapeJobs(cat);
      const saved = await saveJobs(jobs);
      totalNew += saved;
      summaries.push(`• ${cat}: ${jobs.length} found, ${saved} new`);
    } catch {
      summaries.push(`• ${cat}: ❌ error`);
    }
  }

  await ctx.api.editMessageText(
    ctx.chat.id,
    msg.message_id,
    `✅ *Job Scan Complete*\n\n${summaries.join("\n")}\n\n*${totalNew} new jobs saved.*\nUse /saved to view them.`,
    { parse_mode: "Markdown" },
  );
});

// ── /saved ────────────────────────────────────────────────────────────────────
bot.command("saved", async (ctx) => {
  const input = ctx.match?.trim().toLowerCase() as JobCategory | undefined;
  const jobs = await getSavedJobs(input || undefined);
  await ctx.reply(formatJobs(jobs, input || "ALL"), { parse_mode: "Markdown" });
});

// ── /remind [time] [message] ──────────────────────────────────────────────────
bot.command("remind", async (ctx) => {
  const input = ctx.match?.trim() ?? "";

  if (!input) {
    await ctx.reply(
      `⏰ *How to set a reminder:*\n\n` +
        `/remind 30m Call the client\n` +
        `/remind 2h Submit the report\n` +
        `/remind 1d Follow up with Ade\n\n` +
        `Units: *m* = minutes, *h* = hours, *d* = days`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  const parsed = parseRemindInput(input);
  if (!parsed) {
    await ctx.reply(
      `❌ Couldn't understand that format.\n\nTry: /remind 30m Call client`,
    );
    return;
  }

  const remindAt = new Date(Date.now() + parsed.ms);
  await saveReminder(ctx.chat.id, parsed.message, remindAt);

  const timeStr = remindAt.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
  const dateStr = remindAt.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  });

  await ctx.reply(
    `✅ *Reminder set!*\n\n📝 "${parsed.message}"\n🕐 ${dateStr} at ${timeStr} (WAT)`,
    { parse_mode: "Markdown" },
  );
});

// ── /reminders ────────────────────────────────────────────────────────────────
bot.command("reminders", async (ctx) => {
  const reminders = await getPendingReminders(ctx.chat.id);

  if (!reminders.length) {
    await ctx.reply("You have no pending reminders. Use /remind to add one!");
    return;
  }

  const list = reminders
    .map((r, i) => {
      const d = new Date(r.remind_at);
      const timeStr = d.toLocaleString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      });
      return `${i + 1}. 📝 *${r.message}*\n   🕐 ${timeStr} WAT\n   ID: \`${r.id.slice(0, 8)}\``;
    })
    .join("\n\n");

  await ctx.reply(
    `⏰ *Your Pending Reminders (${reminders.length})*\n\n${list}\n\n_Use /unremind <ID> to cancel one._`,
    { parse_mode: "Markdown" },
  );
});

// ── /unremind [id] ────────────────────────────────────────────────────────────
bot.command("unremind", async (ctx) => {
  const input = ctx.match?.trim() ?? "";

  if (!input) {
    await ctx.reply("Usage: /unremind <ID>\n\nGet IDs from /reminders");
    return;
  }

  const reminders = await getPendingReminders(ctx.chat.id);
  const match = reminders.find((r) => r.id.startsWith(input));

  if (!match) {
    await ctx.reply(`❌ No pending reminder found with ID starting with \`${input}\``, {
      parse_mode: "Markdown",
    });
    return;
  }

  const deleted = await deleteReminder(match.id, ctx.chat.id);
  if (deleted) {
    await ctx.reply(`🗑 Reminder cancelled:\n"${match.message}"`);
  } else {
    await ctx.reply("❌ Could not cancel that reminder. Try again.");
  }
});

// ── /clear ────────────────────────────────────────────────────────────────────
bot.command("clear", async (ctx) => {
  await clearHistory(ctx.chat.id);
  await ctx.reply("🗑 Conversation memory cleared. Starting fresh!");
});

// ── /status ───────────────────────────────────────────────────────────────────
bot.command("status", async (ctx) => {
  const msg = await ctx.reply("⏳ Checking AI providers...");

  const results: string[] = [];

  // Test Groq
  try {
    const start = Date.now();
    await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    results.push(`✅ Groq — online (${Date.now() - start}ms)`);
  } catch {
    results.push("❌ Groq — offline");
  }

  // Test Nvidia
  try {
    const start = Date.now();
    await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    results.push(`✅ Nvidia NIM — online (${Date.now() - start}ms)`);
  } catch {
    results.push("❌ Nvidia NIM — offline");
  }

  await ctx.api.editMessageText(
    ctx.chat.id,
    msg.message_id,
    `*AI Provider Status*\n\n${results.join("\n")}\n\n_Groq is primary. Nvidia is fallback._`,
    { parse_mode: "Markdown" },
  );
});

// ── Inline keyboard callbacks ─────────────────────────────────────────────────
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data.startsWith("jobs:")) {
    const category = data.replace("jobs:", "") as JobCategory;
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`🔍 Searching *${category}* jobs in Abuja...`, {
      parse_mode: "Markdown",
    });
    await searchAndReply(ctx, category);
  }
});

// ── Free text → AI with memory ───────────────────────────────────────────────
bot.on("message:text", async (ctx) => {
  const userText = ctx.message.text;
  const chatId = ctx.chat.id;

  // Show typing indicator
  await ctx.api.sendChatAction(chatId, "typing");

  try {
    // Load history and add new user message
    const history = await getHistory(chatId);
    history.push({ role: "user", content: userText });

    // Build messages with system prompt
    const messages = [{ role: "system" as const, content: SYSTEM_PROMPT }, ...history];

    // Call AI
    const reply = await chat(messages);

    // Save both turns to memory
    history.push({ role: "assistant", content: reply });
    await saveHistory(chatId, history);

    await ctx.reply(reply, { parse_mode: "Markdown" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await ctx.reply(
      `❌ ${msg}\n\nPlease try again in a moment.`,
    );
  }
});

// ── Helper: search jobs and reply ────────────────────────────────────────────
async function searchAndReply(ctx: Parameters<typeof bot.on>[1], category: JobCategory) {
  try {
    const jobs = await scrapeJobs(category);
    const saved = await saveJobs(jobs);
    const text = formatJobs(jobs, category);
    const suffix = jobs.length > 0 ? `\n\n_${saved} new job(s) saved to database._` : "";
    await ctx.reply(text + suffix, { parse_mode: "Markdown" });
  } catch (err) {
    await ctx.reply(`❌ Could not fetch jobs right now. Try again shortly.`);
    console.error("[jobs]", err);
  }
}
