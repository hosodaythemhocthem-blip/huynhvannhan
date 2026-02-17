import { supabase } from "../supabase";

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "ai";
  text: string;
  created_at: string;
}

export const chatService = {
  async fetchChatHistory(userId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data as ChatMessage[]) ?? [];
  },

  async saveMessage(
    userId: string,
    role: "user" | "ai",
    text: string
  ): Promise<ChatMessage | null> {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: userId,
      role,
      text,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("chats").insert(message);

    if (error) {
      console.error("Save chat error:", error);
      return null;
    }

    return message;
  },

  async deleteMessage(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", id);

    return !error;
  },

  async clearHistory(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("user_id", userId);

    return !error;
  },
};
