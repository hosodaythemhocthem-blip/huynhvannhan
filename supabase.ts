// supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types/supabaseClient";

/**
 * ==========================================================
 * SUPABASE CONFIG – LMS PRO STABLE VERSION
 * ==========================================================
 * ✔ Typed Database
 * ✔ Production Safe
 * ✔ Vercel Ready
 * ✔ Auto Session Restore
 * ✔ Storage + Auth + Realtime
 * ==========================================================
 */

/* ==========================================================
   ENV VALIDATION
========================================================== */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "❌ Missing Supabase ENV variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

/* ==========================================================
   CREATE CLIENT (Typed)
========================================================== */

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        "x-application-name": "nhanlms-pro-v59-elite",
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/* ==========================================================
   SAFE QUERY WRAPPER
========================================================== */

export async function safeQuery<T>(
  promise: Promise<{ data: T; error: any }>
): Promise<T> {
  const { data, error } = await promise;

  if (error) {
    console.error("🚨 Supabase Error:", error);
    throw new Error(error.message || "Supabase query failed");
  }

  return data as T;
}

/* ==========================================================
   AUTH HELPERS
========================================================== */

export const auth = {
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth getUser error:", error.message);
      return null;
    }

    return user;
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
  },

  onAuthChange: (callback: (event: string) => void) => {
    return supabase.auth.onAuthStateChange((event) => {
      callback(event);
    });
  },
};

/* ==========================================================
   STORAGE HELPERS
========================================================== */

export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error.message);
      throw error;
    }

    return data;
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  remove: async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};
