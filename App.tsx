import { createClient } from '@supabase/supabase-client';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Hàm xử lý upload file Word/PDF chuyên nghiệp
export const uploadExamFile = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const { error } = await supabase.storage.from('exams').upload(fileName, file);
  if (error) throw error;
  return fileName;
};

// Hàm lấy link bảo mật để xem file
export const getSignedFileUrl = async (path: string) => {
  const { data } = await supabase.storage.from('exams').createSignedUrl(path, 3600);
  return data?.signedUrl || null;
};
