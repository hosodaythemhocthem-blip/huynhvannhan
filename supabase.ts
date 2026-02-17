import { createClient } from "@supabase/supabase-js";

/* ======================================================
   ENVIRONMENT VARIABLES
====================================================== */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Missing Supabase environment variables");
}

/* ======================================================
   SUPABASE CLIENT (PRODUCTION READY)
====================================================== */

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: "pkce"
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      "X-Client-Info": "nhanlms-pro-v60"
    }
  }
});

/* ======================================================
   SESSION LISTENER (AUTO RECOVERY)
====================================================== */

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    localStorage.removeItem("lms_user");
  }

  if (event === "SIGNED_IN" && session) {
    localStorage.setItem("lms_session_active", "true");
  }
});
