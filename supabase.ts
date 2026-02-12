import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* =====================================================
   ENV CONFIG (SAFE MODE)
===================================================== */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase ENV chưa cấu hình. App chạy ở Setup Mode.");
  supabase = {} as SupabaseClient;
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
   ENSURE BUCKET EXISTS
===================================================== */

async function ensureBucket() {
  const { data } = await supabase.storage.listBuckets();
  const exists = data?.find((b) => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, {
      public: false,
    });
  }
}

/* =====================================================
   UPLOAD FILE PRO MAX
===================================================== */

export const uploadExamFile = async (file: File) => {
  try {
    validateFile(file);
    await ensureBucket();

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(fileName, 60 * 60 * 24); // 24h

    return {
      fileName,
      signedUrl: data?.signedUrl ?? null,
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
   GET SIGNED URL
===================================================== */

export const getSignedFileUrl = async (fileName: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileName, 60 * 60 * 24);

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
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
