import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase ENV");
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/* ================= STORAGE ================= */

export const uploadExamFile = async (file: File) => {
  const ext = file.name.split(".").pop();
  const fileName = `exam-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("exam-files")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("exam-files")
    .getPublicUrl(fileName);

  return {
    fileName,
    url: data.publicUrl,
  };
};

export const deleteExamFile = async (fileName: string) => {
  await supabase.storage
    .from("exam-files")
    .remove([fileName]);
};

export default supabase;
