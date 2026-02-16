
import { supabase } from '../supabase';

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'ai';
  text: string;
  created_at: string;
}

/**
 * Khởi tạo hội thoại (có thể mở rộng để check session)
 */
export const initConversation = async () => {
  return true;
};

/**
 * Lấy lịch sử chat của người dùng từ Supabase
 */
export const fetchChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase.from('chats').select();
  if (error) return [];
  
  return (data as ChatMessage[])
    .filter(m => m.user_id === userId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

/**
 * Lưu tin nhắn mới vào Supabase
 */
export const saveChatMessage = async (userId: string, role: 'user' | 'ai', text: string): Promise<ChatMessage | null> => {
  const newMessage: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    user_id: userId,
    role,
    text,
    created_at: new Date().toISOString()
  };
  
  const { error } = await supabase.from('chats').insert(newMessage);
  if (error) {
    console.error("Lỗi lưu tin nhắn:", error);
    return null;
  }
  return newMessage;
};

/**
 * Xóa một tin nhắn cụ thể
 */
export const deleteChatMessage = async (id: string) => {
  return await supabase.from('chats').delete(id);
};

/**
 * Xóa toàn bộ lịch sử chat của người dùng
 */
export const clearChatHistory = async (userId: string) => {
  const { data } = await supabase.from('chats').select();
  const messagesToDelete = (data as ChatMessage[]).filter(m => m.user_id === userId);
  
  for (const msg of messagesToDelete) {
    await supabase.from('chats').delete(msg.id);
  }
  return { error: null };
};
