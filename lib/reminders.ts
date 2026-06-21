import { supabase } from "./supabase.js";

export interface Reminder {
  id: string;
  chat_id: number;
  message: string;
  remind_at: string;
  sent: boolean;
  created_at: string;
}

export function parseRemindInput(input: string): { ms: number; message: string } | null {
  const match = input.trim().match(/^(\d+)(m|h|d)\s+(.+)$/i);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const message = match[3].trim();

  const multipliers: Record<string, number> = {
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return { ms: amount * multipliers[unit], message };
}

export async function saveReminder(
  chatId: number,
  message: string,
  remindAt: Date,
): Promise<void> {
  await supabase.from("ranti_reminders").insert({
    chat_id: chatId,
    message,
    remind_at: remindAt.toISOString(),
  });
}

export async function getDueReminders(): Promise<Reminder[]> {
  const { data } = await supabase
    .from("ranti_reminders")
    .select("*")
    .eq("sent", false)
    .lte("remind_at", new Date().toISOString());

  return (data ?? []) as Reminder[];
}

export async function markSent(id: string): Promise<void> {
  await supabase.from("ranti_reminders").update({ sent: true }).eq("id", id);
}

export async function getPendingReminders(chatId: number): Promise<Reminder[]> {
  const { data } = await supabase
    .from("ranti_reminders")
    .select("*")
    .eq("chat_id", chatId)
    .eq("sent", false)
    .order("remind_at", { ascending: true });

  return (data ?? []) as Reminder[];
}

export async function deleteReminder(id: string, chatId: number): Promise<boolean> {
  const { error } = await supabase
    .from("ranti_reminders")
    .delete()
    .eq("id", id)
    .eq("chat_id", chatId);

  return !error;
}
