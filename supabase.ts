import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* =====================================================
   ENV CONFIG
===================================================== */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase ENV chưa cấu hình");
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "X-Client-Info": "math-lms-ai" },
    },
  }
);

/* =====================================================
   AUTH HELPERS
===================================================== */

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
};

export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

/* =====================================================
   GENERIC DB HELPERS
===================================================== */

export async function dbInsert<T>(table: string, payload: T | T[]) {
  const { data, error } = await supabase.from(table).insert(payload).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function dbSelect<T>(table: string, filter?: { column: string; value: any }) {
  let query = supabase.from(table).select("*");
  if (filter) query = query.eq(filter.column, filter.value);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as T[];
}

export async function dbUpdate<T>(table: string, id: string, payload: Partial<T>) {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function dbDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
