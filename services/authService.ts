import { User, UserStatus, Role } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = "lumina_lms_session_v7";

/* =========================================================
   UTILITIES
========================================================= */

const now = () => new Date().toISOString();

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

const mapDbUserToModel = (dbUser: any): User => ({
  id: dbUser.id,
  email: dbUser.email,
  fullName: dbUser.fullName,
  role: dbUser.role as Role,
  avatar: dbUser.avatar ?? undefined,
  status: dbUser.status as UserStatus,
  classId: dbUser.classId ?? undefined,
  pendingClassId: dbUser.pendingClassId ?? undefined,
  lastLoginAt: dbUser.lastLoginAt ?? undefined,
  isDeleted: dbUser.isDeleted ?? false,
  createdAt: dbUser.createdAt,
  updatedAt: dbUser.updatedAt,
});

/* =========================================================
   AUTO PROVISION TEACHER NHẪN
========================================================= */

const ensureTeacherNhanExists = async () => {
  const teacherEmail = "huynhvannhan@gmail.com";

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", teacherEmail)
    .maybeSingle();

  if (!existing) {
    console.log("🚀 Auto Provision: Creating Teacher Nhẫn profile");

    await supabase.from("users").insert([
      {
        id: crypto.randomUUID(),
        email: teacherEmail,
        fullName: "Thầy Huỳnh Văn Nhẫn",
        role: "teacher",
        status: "active",
        isDeleted: false,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);
  }
};

/* =========================================================
   AUTH SERVICE – V7 PRO MAX
========================================================= */

export const authService = {
  /* ----------------------------------------------------- */
  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return getLocalSession();
      }

      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .maybeSingle();

      if (!dbUser) return null;

      const user = mapDbUserToModel(dbUser);
      saveSession(user);
      return user;
    } catch {
      return getLocalSession();
    }
  },

  /* ----------------------------------------------------- */
  async login(email: string, password: string): Promise<User> {
    await ensureTeacherNhanExists();

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Thông tin đăng nhập không chính xác.");
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!dbUser) {
      throw new Error("Tài khoản chưa được khởi tạo trên hệ thống.");
    }

    const user = mapDbUserToModel(dbUser);

    /* ===== CHECK STATUS ===== */
    if (user.role === "student" && user.status === "pending") {
      await supabase.auth.signOut();
      throw new Error("Tài khoản đang chờ giáo viên phê duyệt.");
    }

    if (user.status === "rejected") {
      await supabase.auth.signOut();
      throw new Error("Yêu cầu tham gia lớp đã bị từ chối.");
    }

    /* ===== UPDATE LAST LOGIN ===== */
    await supabase
      .from("users")
      .update({
        lastLoginAt: now(),
        updatedAt: now(),
      })
      .eq("email", normalizedEmail);

    saveSession(user);
    return user;
  },

  /* ----------------------------------------------------- */
  async registerStudent(
    email: string,
    password: string,
    fullName: string,
    classId: string
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Email đã được sử dụng hoặc lỗi hệ thống.");
    }

    const { error: insertError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        email: normalizedEmail,
        fullName,
        role: "student",
        status: "pending",
        classId: null,
        pendingClassId: classId,
        isDeleted: false,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    if (insertError) {
      throw new Error("Lỗi khi tạo hồ sơ học sinh.");
    }
  },

  /* ----------------------------------------------------- */
  async approveStudent(userId: string): Promise<void> {
    const { data: student } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!student) throw new Error("Không tìm thấy học sinh.");

    const { error } = await supabase
      .from("users")
      .update({
        status: "active",
        classId: student.pendingClassId,
        pendingClassId: null,
        updatedAt: now(),
      })
      .eq("id", userId);

    if (error) throw new Error("Phê duyệt thất bại.");
  },

  /* ----------------------------------------------------- */
  async rejectStudent(userId: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        status: "rejected",
        updatedAt: now(),
      })
      .eq("id", userId);

    if (error) throw new Error("Từ chối thất bại.");
  },

  /* ----------------------------------------------------- */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    clearSession();
  },
};
