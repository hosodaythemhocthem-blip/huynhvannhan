import { createClient } from "@supabase/supabase-js";

/* ===============================
   ENV
================================= */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Thiếu biến môi trường Supabase");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);

/* ===============================
   STORAGE
================================= */

const BUCKET = "exam-files";

/* ---------- Upload ---------- */

export const uploadExamFile = async (file: File) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return {
    url: data.publicUrl,
    fileName,
  };
};

/* ---------- Delete ---------- */

export const deleteExamFile = async (fileName: string) => {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([fileName]);

  if (error) {
    console.error("Delete file error:", error.message);
  }
};
