import { supabase } from "./supabaseClient";
import { AppUser, UserRole } from "../types";

/* ===============================
   SAFE METADATA PARSER
================================ */
function parseUser(user: any): AppUser {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? "",
    full_name: metadata.full_name ?? "",
    role: metadata.role as UserRole,
    approved: metadata.approved ?? false,
  };
}

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
        approved: role === "teacher", // teacher auto approved
      },
    },
  });

  if (error) {
    console.error("Register error:", error.message);
    throw new Error(error.message);
  }

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

  if (error) {
    console.error("Login error:", error.message);
    throw new Error(error.message);
  }

  const user = data.user;

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  const parsedUser = parseUser(user);

  if (!parsedUser.role) {
    throw new Error("Tài khoản chưa được gán vai trò");
  }

  if (parsedUser.role === "student" && !parsedUser.approved) {
    throw new Error("Tài khoản đang chờ giáo viên duyệt");
  }

  return parsedUser;
}

/* ===============================
   CURRENT USER (AUTO RESTORE)
================================ */
export async function getCurrentUser(): Promise<AppUser | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Get current user error:", error.message);
    return null;
  }

  const user = data.user;
  if (!user) return null;

  return parseUser(user);
}

/* ===============================
   LOGOUT
================================ */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
    throw new Error(error.message);
  }
}
