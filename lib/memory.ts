import { supabase } from "./supabase.js";
import type { Message } from "./ai.js";

const MAX_MESSAGES = 20; // keep last 20 messages per chat

export async function getHistory(chatId: number): Promise<Message[]> {
  const { data, error } = await supabase
    .from("ranti_memory")
    .select("messages")
    .eq("chat_id", chatId)
    .single();

  if (error || !data) return [];
  return (data.messages as Message[]) ?? [];
}

export async function saveHistory(chatId: number, messages: Message[]): Promise<void> {
  // Keep only the last MAX_MESSAGES to control Supabase storage
  const trimmed = messages.slice(-MAX_MESSAGES);

  await supabase.from("ranti_memory").upsert(
    { chat_id: chatId, messages: trimmed, updated_at: new Date().toISOString() },
    { onConflict: "chat_id" },
  );
}

export async function clearHistory(chatId: number): Promise<void> {
  await supabase.from("ranti_memory").delete().eq("chat_id", chatId);
}

export async function addMessage(
  chatId: number,
  role: "user" | "assistant",
  content: string,
): Promise<Message[]> {
  const history = await getHistory(chatId);
  history.push({ role, content });
  await saveHistory(chatId, history);
  return history;
}
