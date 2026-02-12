import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* =====================================================
   ENV CONFIG (SAFE MODE - PRO)
===================================================== */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase ENV chưa cấu hình. App chạy ở Setup Mode.");
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export { supabase };

/* =====================================================
   STORAGE CONFIG
===================================================== */

const BUCKET = "exam-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/* =====================================================
   FILE VALIDATION
===================================================== */

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
];

function validateFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "❌ File không được hỗ trợ. Chỉ chấp nhận PDF, Word, PNG, JPG"
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("❌ File vượt quá 10MB");
  }
}

/* =====================================================
   SESSION CHECK
===================================================== */

async function requireAuth() {
  if (!supabase) {
    throw new Error("Supabase chưa cấu hình.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  return session;
}

/* =====================================================
   UPLOAD FILE (PRO SAFE)
===================================================== */

export const uploadExamFile = async (file: File) => {
  if (!supabase) throw new Error("Supabase chưa cấu hình.");

  await requireAuth();
  validateFile(file);

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("❌ Upload error:", error.message);
    throw error;
  }

  return {
    fileName,
  };
};

/* =====================================================
   REPLACE FILE
===================================================== */

export const replaceExamFile = async (
  oldFileName: string | null,
  newFile: File
) => {
  if (oldFileName) {
    await deleteExamFile(oldFileName);
  }

  return await uploadExamFile(newFile);
};

/* =====================================================
   GET SIGNED URL (AUTO REFRESH)
===================================================== */

export const getSignedFileUrl = async (fileName: string) => {
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileName, 60 * 60 * 24); // 24h

  if (error) {
    console.error("❌ Signed URL error:", error.message);
    return null;
  }

  return data?.signedUrl ?? null;
};

/* =====================================================
   DELETE FILE
===================================================== */

export const deleteExamFile = async (fileName: string) => {
  if (!supabase) return false;

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([fileName]);

    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error("❌ Delete file error:", error.message);
    return false;
  }
};

/* =====================================================
   AUTH HELPERS
===================================================== */

export const getCurrentSession = async () => {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};
