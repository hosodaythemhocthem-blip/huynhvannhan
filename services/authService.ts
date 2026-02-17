import { User } from "../types";
import { supabase } from "../supabase";

const SESSION_KEY = "nhanlms_active_session_v6";

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

/* =========================================================
   ENSURE DEFAULT TEACHER EXISTS
========================================================= */

const ensureDefaultTeacher = async () => {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", "huynhvannhan@gmail.com")
    .single();

  if (data) return;

  await supabase.from("users").insert([
    {
      id: "teacher-nhan",
      email: "huynhvannhan@gmail.com",
      fullName: "Thầy Huỳnh Văn Nhẫn",
      role: "teacher",
      isApproved: true,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ]);
};

/* =========================================================
   AUTH SERVICE – PRODUCTION READY
========================================================= */

export const authService = {
  /* =========================================================
     GET CURRENT USER
  ========================================================= */
  async getCurrentUser(): Promise<User | null> {
    try {
      await ensureDefaultTeacher();

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return getLocalSession();

      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!dbUser) return null;

      saveSession(dbUser);
      return dbUser as User;
    } catch {
      return getLocalSession();
    }
  },

  /* =========================================================
     LOGIN
  ========================================================= */
  async login(email: string, password: string): Promise<User> {
    await ensureDefaultTeacher();

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Sai tài khoản hoặc mật khẩu.");
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (!dbUser) {
      throw new Error("Không tìm thấy dữ liệu người dùng.");
    }

    if (dbUser.role === "student" && !dbUser.isApproved) {
      throw new Error("Tài khoản đang chờ Thầy phê duyệt.");
    }

    if (dbUser.isActive === false) {
      throw new Error("Tài khoản đã bị khóa.");
    }

    saveSession(dbUser);
    return dbUser as User;
  },

  /* =========================================================
     REGISTER STUDENT
  ========================================================= */
  async registerStudent(
    email: string,
    password: string,
    fullName: string,
    classInfo: { id: string; name: string }
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error("Email đã tồn tại hoặc đăng ký thất bại.");
    }

    const userId = data.user.id;

    const { error: insertError } = await supabase.from("users").insert([
      {
        id: userId,
        email: normalizedEmail,
        fullName,
        role: "student",
        classId: classInfo.id,
        className: classInfo.name,
        isApproved: false,
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    if (insertError) {
      throw new Error("Không thể tạo hồ sơ học sinh.");
    }
  },

  /* =========================================================
     APPROVE STUDENT
  ========================================================= */
  async approveStudent(userId: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        isApproved: true,
        updatedAt: now(),
      })
      .eq("id", userId);

    if (error) {
      throw new Error("Không thể phê duyệt học sinh.");
    }
  },

  /* =========================================================
     GET STUDENTS
  ========================================================= */
  async getPendingStudents(): Promise<User[]> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .eq("isApproved", false);

    return (data as User[]) || [];
  },

  async getApprovedStudents(): Promise<User[]> {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .eq("isApproved", true);

    return (data as User[]) || [];
  },

  /* =========================================================
     DELETE STUDENT (SOFT DELETE)
  ========================================================= */
  async deleteStudent(userId: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        isDeleted: true,
        isActive: false,
        updatedAt: now(),
      })
      .eq("id", userId);

    if (error) {
      throw new Error("Không thể xóa học sinh.");
    }
  },

  /* =========================================================
     LOGOUT
  ========================================================= */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    clearSession();
  },
};
