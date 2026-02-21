import { createClient } from "@supabase/supabase-js";

/* ======================================================
    SUPABASE CLIENT - PRODUCTION SAFE
====================================================== */

// Sử dụng Record để ép kiểu an toàn cho import.meta.env mà không lo lỗi TS2339
const env = (import.meta as any).env as Record<string, string>;

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Log cảnh báo thay vì chỉ throw error để bạn dễ debug trên Vercel Dashboard
  console.error("❌ Thiếu biến môi trường Supabase!");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
