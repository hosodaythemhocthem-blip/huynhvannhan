// services/authService.ts
import { supabase } from "../supabase";

export type UserRole = "teacher" | "student" | "admin";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

/**
 * Đăng ký
 */
export const registerUser = async (
  email: string,
  password: string,
  full_name: string,
  role: UserRole
): Promise<AppUser> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Không tạo được user");

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    email,
    full_name,
    role,
  });

  if (profileError) throw profileError;

  return {
    id: data.user.id,
    email,
    full_name,
    role,
  };
};

/**
 * Đăng nhập
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AppUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Sai tài khoản hoặc mật khẩu");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError) throw profileError;

  return profile;
};

/**
 * Logout
 */
export const logoutUser = async () => {
  await supabase.auth.signOut();
};
