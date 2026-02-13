import { supabase } from "../supabase";
import { UserRole } from "../types";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  approved: boolean;
}

/* ===============================
   PARSE USER
================================ */
function parseUser(user: any): AppUser {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? "",
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
        approved: role === UserRole.TEACHER, // teacher auto approved
      },
    },
  });

  if (error) {
    throw error;
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
    throw error;
  }

  if (!data.user) {
    throw new Error("Không tìm thấy người dùng");
  }

  const parsedUser = parseUser(data.user);

  if (!parsedUser.role) {
    throw new Error("Tài khoản chưa được gán vai trò");
  }

  if (!parsedUser.approved) {
    throw new Error(
      parsedUser.role === UserRole.TEACHER
        ? "Giáo viên đang chờ duyệt"
        : "Học sinh đang chờ duyệt"
    );
  }

  return parsedUser;
}

/* ===============================
   CURRENT USER
================================ */
export async function getCurrentUser(): Promise<AppUser | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  return parseUser(data.user);
}

/* ===============================
   LOGOUT
================================ */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
