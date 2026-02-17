import { User, UserStatus, Role } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = "lumina_lms_session_v8";

const now = () => new Date().toISOString();

/* =========================================================
   SESSION
========================================================= */
const saveSession = (user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const getLocalSession = (): User | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

/* =========================================================
   MAP DB → MODEL
========================================================= */
const mapDbUserToModel = (db: any): User => ({
  id: db.id,
  email: db.email,
  fullName: db.full_name,
  role: db.role as Role,
  avatar: db.avatar ?? undefined,
  status: db.status as UserStatus,
  classId: db.class_id ?? undefined,
  pendingClassId: db.pending_class_id ?? undefined,
  lastLoginAt: db.last_login_at ?? undefined,
  isDeleted: db.is_deleted ?? false,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

/* =========================================================
   AUTO CREATE TEACHER NHẪN
========================================================= */
const ensureTeacherNhanExists = async () => {
  const email = "huynhvannhan@gmail.com";
  const password = "huynhvannhan2020";

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    await supabase.auth.signUp({ email, password });

    await supabase.from("users").insert([
      {
        id: crypto.randomUUID(),
        email,
        full_name: "Thầy Huỳnh Văn Nhẫn",
        role: "teacher",
        status: "active",
        is_deleted: false,
        created_at: now(),
        updated_at: now(),
      },
    ]);
  }
};

/* =========================================================
   AUTH SERVICE
========================================================= */
export const authService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return getLocalSession();

      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (!dbUser) return null;

      const mapped = mapDbUserToModel(dbUser);
      saveSession(mapped);
      return mapped;
    } catch {
      return getLocalSession();
    }
  },

  async login(email: string, password: string): Promise<User> {
    await ensureTeacherNhanExists();

    const normalized = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Thông tin đăng nhập không chính xác.");
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalized)
      .maybeSingle();

    if (!dbUser) throw new Error("Tài khoản chưa tồn tại.");

    const user = mapDbUserToModel(dbUser);

    if (user.role === "student" && user.status === "pending") {
      await supabase.auth.signOut();
      throw new Error("Tài khoản đang chờ duyệt.");
    }

    saveSession(user);
    return user;
  },

  async registerStudent(
    email: string,
    password: string,
    fullName: string,
    classId: string
  ) {
    const normalized = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Không thể đăng ký.");
    }

    await supabase.from("users").insert([
      {
        id: data.user.id,
        email: normalized,
        full_name: fullName,
        role: "student",
        status: "pending",
        pending_class_id: classId,
        is_deleted: false,
        created_at: now(),
        updated_at: now(),
      },
    ]);
  },

  async approveStudent(userId: string) {
    await supabase
      .from("users")
      .update({ status: "active", updated_at: now() })
      .eq("id", userId);
  },

  async logout() {
    await supabase.auth.signOut();
    clearSession();
  },
};
