import { supabase } from "../supabase";

const toEmail = (username: string) => {
  return `${username.trim().toLowerCase()}@lms.local`;
};

/* =====================================================
   REGISTER STUDENT
===================================================== */

export const registerStudent = async (
  fullName: string,
  username: string,
  password: string
) => {
  if (!fullName || !username || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin");
  }

  const email = toEmail(username);

  // Tạo tài khoản auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Không tạo được tài khoản");

  // Tạo profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    username: username.trim().toLowerCase(),
    full_name: fullName,
    role: "student",
  });

  if (profileError) throw profileError;

  return data.user;
};

/* =====================================================
   LOGIN (USERNAME)
===================================================== */

export const login = async (username: string, password: string) => {
  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ thông tin");
  }

  const email = toEmail(username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error("Sai tài khoản hoặc mật khẩu");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Không tìm thấy role người dùng");
  }

  return {
    user: data.user,
    role: profile.role,
    fullName: profile.full_name,
  };
};

/* =====================================================
   LOGOUT
===================================================== */

export const logout = async () => {
  await supabase.auth.signOut();
};
