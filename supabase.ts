import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* =====================================================
   ENV CONFIG
===================================================== */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  }
);

/* =====================================================
   STORAGE CONFIG
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
    throw new Error(
      "Chỉ chấp nhận PDF, Word, PNG, JPG"
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File vượt quá 10MB");
  }
}

/* =====================================================
   UPLOAD FILE
===================================================== */

export const uploadExamFile = async (file: File) => {
  validateFile(file);

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file);

  if (error) throw error;

  return fileName;
};

export const getSignedFileUrl = async (fileName: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileName, 60 * 60 * 24);

  if (error) throw error;

  return data.signedUrl;
};

export const deleteExamFile = async (fileName: string) => {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([fileName]);

  if (error) throw error;
};

/* =====================================================
   AUTH HELPERS
===================================================== */

export const getCurrentSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
