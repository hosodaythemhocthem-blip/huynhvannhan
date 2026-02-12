import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* =====================================================
   ENV CONFIG
===================================================== */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Thiếu biến môi trường Supabase");
}

/* =====================================================
   CLIENT
===================================================== */

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/* =====================================================
   STORAGE CONFIG
===================================================== */

const BUCKET = "exam-files";

/* =====================================================
   HELPER: Validate File Type
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
    throw new Error("File không được hỗ trợ. Chỉ chấp nhận PDF, Word, PNG, JPG");
  }
}

/* =====================================================
   UPLOAD FILE (PRO)
===================================================== */

export const uploadExamFile = async (file: File) => {
  try {
    validateFile(file);

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    return {
      fileName,
    };
  } catch (error: any) {
    console.error("❌ Upload error:", error.message);
    throw error;
  }
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
   GET SIGNED URL (SECURE)
===================================================== */

export const getSignedFileUrl = async (fileName: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileName, 60 * 60); // 1 hour

  if (error) {
    console.error("❌ Signed URL error:", error.message);
    return null;
  }

  return data.signedUrl;
};

/* =====================================================
   DELETE FILE
===================================================== */

export const deleteExamFile = async (fileName: string) => {
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
   AUTH HELPERS (UNIFIED)
===================================================== */

export const getCurrentSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
