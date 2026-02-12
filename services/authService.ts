import { supabase } from "../supabase";

export const login = async (username: string, password: string) => {
  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin");
  }

  const email = `${username}@lms.local`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error("Sai tài khoản hoặc mật khẩu");
  }

  if (!data.user) {
    throw new Error("Không tìm thấy người dùng");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Không tìm thấy role người dùng");
  }

  return {
    user: data.user,
    role: profile.role,
  };
};

export const registerStudent = async (
  fullName: string,
  username: string,
  password: string
) => {
  if (!fullName || !username || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin");
  }

  const email = `${username}@lms.local`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Không tạo được tài khoản");

  const { error: insertError } = await supabase.from("profiles").insert({
    id: data.user.id,
    username,
    full_name: fullName,
    role: "student",
  });

  if (insertError) throw insertError;

  return data.user;
};
