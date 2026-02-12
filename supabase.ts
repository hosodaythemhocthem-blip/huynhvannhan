import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

/* ===============================
   STORAGE - Upload / Delete file
================================= */

const BUCKET = "exam-files";

export const uploadExamFile = async (file: File) => {
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return {
    url: data.publicUrl,
    fileName,
  };
};

export const deleteExamFile = async (fileName: string) => {
  await supabase.storage.from(BUCKET).remove([fileName]);
};
