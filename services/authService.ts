import { supabase } from "../supabase";
import { UserRole, AccountStatus } from "../types";

/* =====================================================
   TYPES
===================================================== */

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
}

/* =====================================================
   ERROR SYSTEM (PRO)
===================================================== */

class AuthError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const authError = (code: string) => new AuthError(code);

/* =====================================================
   MAP SUPABASE USER → APP USER
===================================================== */

const mapSupabaseUser = async (userId: string): Promise<AppUser> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", userId)
    .eq("deleted", false)
    .single();

  if (error || !data) {
    throw authError("account-not-exist");
  }

  if (
    data.role === UserRole.TEACHER &&
    data.status !== AccountStatus.APPROVED
  ) {
    throw authError("teacher-pending");
  }

  return {
    uid: data.uid,
    email: data.email,
    role: data.role,
    status: data.status,
  };
};

/* =====================================================
   LOGIN
===================================================== */

export const login = async (
  email: string,
  password: string
): Promise<AppUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw authError("invalid-credentials");
  }

  return await mapSupabaseUser(data.user.id);
};

/* =====================================================
   REGISTER (SAFE + ROLLBACK)
===================================================== */

export const register = async (
  email: string,
  password: string,
  role: UserRole
): Promise<void> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    throw authError("register-failed");
  }

  const userId = data.user.id;

  const { error: insertError } = await supabase.from("users").insert({
    uid: userId,
    email,
    role,
    status:
      role === UserRole.TEACHER
        ? AccountStatus.PENDING
        : AccountStatus.APPROVED,
    deleted: false,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    // 🔥 ROLLBACK AUTH USER nếu profile lỗi
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
    throw authError("user-profile-create-failed");
  }
};

/* =====================================================
   REGISTER HELPERS
===================================================== */

export const registerTeacher = (
  email: string,
  password: string
) => register(email, password, UserRole.TEACHER);

export const registerStudent = (
  email: string,
  password: string
) => register(email, password, UserRole.STUDENT);

/* =====================================================
   GET CURRENT USER
===================================================== */

export const getCurrentUser = async (): Promise<AppUser | null> => {
  const { data } = await supabase.auth.getSession();

  if (!data.session?.user) return null;

  try {
    return await mapSupabaseUser(data.session.user.id);
  } catch {
    return null;
  }
};

/* =====================================================
   OBSERVE AUTH STATE
===================================================== */

export const observeAuth = (
  callback: (user: AppUser | null) => void
) => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }

      try {
        const user = await mapSupabaseUser(session.user.id);
        callback(user);
      } catch {
        await supabase.auth.signOut();
        callback(null);
      }
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
};

/* =====================================================
   SOFT DELETE ACCOUNT
===================================================== */

export const softDeleteAccount = async (uid: string) => {
  const { error } = await supabase
    .from("users")
    .update({ deleted: true })
    .eq("uid", uid);

  if (error) throw authError("delete-failed");
};

/* =====================================================
   LOGOUT
===================================================== */

export const logout = async () => {
  await supabase.auth.signOut();
};
