import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* =====================================================
   ENV CONFIG – PRODUCTION SAFE
===================================================== */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase ENV chưa cấu hình trên Vercel");
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
      headers: {
        "X-Client-Info": "math-lms-ai",
      },
    },
  }
);

/* =====================================================
   AUTH HELPERS – STABLE
===================================================== */

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("❌ getSession error:", error.message);
    return null;
  }
  return data.session;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("❌ getUser error:", error.message);
    return null;
  }
  return data.user ?? null;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("❌ signOut error:", error.message);
  }
};

/* =====================================================
   STORAGE CONFIG – LMS EXAM FILES
===================================================== */

const BUCKET = "exam-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
];

function validateFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Chỉ chấp nhận PDF, Word, PNG, JPG");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File vượt quá 10MB");
  }
}

export const uploadExamFile = async (file: File) => {
  validateFile(file);

  const session = await getCurrentSession();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Bạn chưa đăng nhập");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("❌ Upload error:", error.message);
    throw new Error("Upload file thất bại");
  }

  return filePath;
};

export const getSignedFileUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24);

  if (error || !data?.signedUrl) {
    console.error("❌ Signed URL error:", error?.message);
    throw new Error("Không tạo được link tải file");
  }

  return data.signedUrl;
};

export const deleteExamFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("❌ Delete file error:", error.message);
    throw new Error("Xóa file thất bại");
  }
};

/* =====================================================
   GENERIC DB HELPERS – SAFE
===================================================== */

export async function dbInsert<T>(
  table: string,
  payload: T | T[]
) {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select();

  if (error) {
    console.error(`❌ Insert ${table}:`, error.message);
    throw new Error(`Insert ${table} thất bại`);
  }

  return data;
}

export async function dbSelect<T>(
  table: string,
  filter?: { column: string; value: any }
) {
  let query = supabase.from(table).select("*");

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`❌ Select ${table}:`, error.message);
    throw new Error(`Select ${table} thất bại`);
  }

  return data as T[];
}

export async function dbUpdate<T>(
  table: string,
  id: string,
  payload: Partial<T>
) {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`❌ Update ${table}:`, error.message);
    throw new Error(`Update ${table} thất bại`);
  }

  return data;
}

export async function dbDelete(
  table: string,
  id: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`❌ Delete ${table}:`, error.message);
    throw new Error(`Delete ${table} thất bại`);
  }
}
