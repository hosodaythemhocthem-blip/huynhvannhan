import { supabase } from "../supabaseClient";
import { UserRole, AccountStatus } from "../types";

/* =========================
   TYPES
========================= */
export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
}

/* =========================
   ⚠️ ADMIN LOCAL (DEV ONLY)
========================= */
const ADMIN_ACCOUNT = {
  email: "huynhvannhan",
  password: "huynhvannhan2020",
};

const isAdminLogin = (email: string, password: string) =>
  email === ADMIN_ACCOUNT.email &&
  password === ADMIN_ACCOUNT.password;

/* =========================
   INTERNAL ERROR HELPER
========================= */
const authError = (code: string) => {
  const err = new Error(code);
  (err as any).code = code;
  return err;
};

/* =========================
   MAP SUPABASE USER → APP USER
========================= */
const mapSupabaseUser = async (userId: string): Promise<AppUser> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", userId)
    .single();

  if (error || !data) {
    throw authError("account-not-exist");
  }

  if (data.deleted === true) {
    throw authError("account-deleted");
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

/* =========================
   LOGIN
========================= */
export const login = async (
  email: string,
  password: string
): Promise<AppUser> => {
  /* ===== ADMIN LOCAL ===== */
  if (isAdminLogin(email, password)) {
    localStorage.setItem("ADMIN_LOGIN", "true");
    return {
      uid: "ADMIN",
      email,
      role: UserRole.ADMIN,
    };
  }

  /* ===== SUPABASE AUTH ===== */
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw authError("invalid-credentials");
  }

  return await mapSupabaseUser(data.user.id);
};

/* =========================
   REGISTER BASE
========================= */
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

  const { error: insertError } = await supabase.from("users").insert({
    uid: data.user.id,
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
    throw authError("user-profile-create-failed");
  }
};

/* =========================
   REGISTER HELPERS
========================= */
export const registerTeacher = (
  email: string,
  password: string
) => register(email, password, UserRole.TEACHER);

export const registerStudent = (
  email: string,
  password: string
) => register(email, password, UserRole.STUDENT);

/* =========================
   OBSERVE AUTH STATE
========================= */
export const observeAuth = (
  callback: (user: AppUser | null) => void
) => {
  /* ===== ADMIN SESSION ===== */
  if (localStorage.getItem("ADMIN_LOGIN") === "true") {
    callback({
      uid: "ADMIN",
      email: ADMIN_ACCOUNT.email,
      role: UserRole.ADMIN,
    });
    return () => {};
  }

  /* ===== SUPABASE SESSION ===== */
  const { data: listener } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }

      try {
        const user = await mapSupabaseUser(session.user.id);
        callback(user);
      } catch (err) {
        await supabase.auth.signOut();
        callback(null);
      }
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
};

/* =========================
   LOGOUT
========================= */
export const logout = async () => {
  localStorage.removeItem("ADMIN_LOGIN");
  await supabase.auth.signOut();
};
