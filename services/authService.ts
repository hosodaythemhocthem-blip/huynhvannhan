import { supabase } from "./supabaseClient";
import { AppUser, UserRole } from "../types";

/* ===============================
   REGISTER
================================ */
export async function registerUser(
  email: string,
  password: string,
  full_name: string,
  role: UserRole
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
        approved: role === "teacher" ? true : false,
      },
    },
  });

  if (error) throw error;
  return data;
}

/* ===============================
   LOGIN
================================ */
export async function loginUser(
  email: string,
  password: string
): Promise<AppUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("User not found");

  const role = user.user_metadata?.role as UserRole;
  const approved = user.user_metadata?.approved ?? false;

  if (!role) throw new Error("Role not found");

  if (role === "student" && !approved) {
    throw new Error("Tài khoản đang chờ giáo viên duyệt");
  }

  return {
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name || "",
    role,
    approved,
  };
}

/* ===============================
   CURRENT USER
================================ */
export async function getCurrentUser(): Promise<AppUser | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return null;

  return {
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name || "",
    role: user.user_metadata?.role,
    approved: user.user_metadata?.approved,
  };
}

/* ===============================
   LOGOUT
================================ */
export async function logoutUser() {
  await supabase.auth.signOut();
}
