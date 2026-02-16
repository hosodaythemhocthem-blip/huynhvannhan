// supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/supabaseClient";

/**
 * ==========================================================
 * SUPABASE CONFIG – LMS PRO VERSION
 * ==========================================================
 * - Chuẩn v2
 * - Typed Database
 * - Hỗ trợ Auth, Storage, Realtime
 * - Tối ưu cho Vercel
 */

// ⚠️ Không hardcode trực tiếp khi deploy production
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://YOUR_PROJECT_ID.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_PUBLIC_ANON_KEY";

// Kiểm tra env
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Missing Supabase ENV variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

/**
 * Tạo Supabase Client typed
 */
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-application-name": "math-lms-ai",
      },
    },
  }
);

/**
 * ==========================================================
 * HELPER: Safe Query Wrapper
 * ==========================================================
 */

export async function safeQuery<T>(
  promise: Promise<{ data: T; error: any }>
): Promise<T> {
  const { data, error } = await promise;

  if (error) {
    console.error("🚨 Supabase Error:", error.message);
    throw new Error(error.message);
  }

  return data;
}

/**
 * ==========================================================
 * AUTH HELPERS
 * ==========================================================
 */

export const auth = {
  getUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
};

/**
 * ==========================================================
 * STORAGE HELPERS
 * ==========================================================
 */

export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;
    return data;
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};
