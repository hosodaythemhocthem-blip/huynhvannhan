import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_PUBLIC_ANON_KEY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

/* =============================
   Upload File
============================= */
export const uploadExamFile = async (file: File) => {
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("exam-files")
    .upload(fileName, file);

  if (error) {
    alert(error.message);
    return null;
  }

  const { data } = supabase.storage
    .from("exam-files")
    .getPublicUrl(fileName);

  return {
    url: data.publicUrl,
    fileName,
  };
};

/* =============================
   Delete File
============================= */
export const deleteExamFile = async (fileName: string) => {
  await supabase.storage
    .from("exam-files")
    .remove([fileName]);
};
