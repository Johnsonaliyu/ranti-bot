import { supabase } from "./supabase.js";

export interface Note {
  id: string;
  chat_id: number;
  text: string;
  created_at: string;
}

export async function saveNote(chatId: number, text: string): Promise<void> {
  await supabase.from("ranti_notes").insert({ chat_id: chatId, text });
}

export async function getNotes(chatId: number): Promise<Note[]> {
  const { data } = await supabase
    .from("ranti_notes")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as Note[];
}

export async function deleteNote(id: string, chatId: number): Promise<boolean> {
  const { error } = await supabase
    .from("ranti_notes")
    .delete()
    .eq("id", id)
    .eq("chat_id", chatId);

  return !error;
}
